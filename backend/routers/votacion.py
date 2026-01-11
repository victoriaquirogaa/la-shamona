from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from .utils import generar_codigo_sala
import random
from typing import Optional

router = APIRouter()

# --- MODELOS ---
class VotoInput(BaseModel):
    id_sala: str
    nombre_votante: str
    voto_para: str

class NuevaRondaInput(BaseModel):
    id_sala: str
    modo: str = "PERSONAS" # Opciones: "PERSONAS" (default) o "RICO_POBRE"

class SiguienteTarjetaInput(BaseModel):
    id_sala: str
    modo: str = "PERSONAS" 

# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(jugadores: list[str]):
    codigo = generar_codigo_sala()
    
    nueva_partida = {
        "jugadores": jugadores,
        "estado": "esperando",
        "pregunta_actual": "Esperando inicio...",
        "modo_actual": "PERSONAS",
        "opciones_actuales": jugadores, # Por defecto votamos gente
        "votos": {}, 
        "historial_preguntas": [] 
    }
    
    db.collection('partidas_votacion').document(codigo).set(nueva_partida)
    return {"id_sala": codigo, "mensaje": "Sala lista"}

@router.post("/nueva-ronda")
def iniciar_ronda(datos: NuevaRondaInput):
    doc_ref = db.collection('partidas_votacion').document(datos.id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
        
    partida = doc.to_dict()
    
    # 1. DETERMINAR MODO Y COLECCIÓN
    nombre_doc_firebase = "votacion" # Default
    opciones_ronda = partida['jugadores'] # Default: Botones con nombres de amigos
    
    if datos.modo == "RICO_POBRE":
        nombre_doc_firebase = "rico_pobre"
        opciones_ronda = ["Muy de Rico", "Muy de Pobre"]
    
    # 2. TRAER PREGUNTAS DE LA BASE DE DATOS
    config_ref = db.collection('configuracion_juegos').document(nombre_doc_firebase).get()
    
    if config_ref.exists:
        todas_las_frases = config_ref.to_dict().get('frases', [])
    else:
        todas_las_frases = ["Error: No hay preguntas cargadas en la BD para este modo"]

    # 3. FILTRAR LAS YA USADAS
    usadas = set(partida.get('historial_preguntas', []))
    disponibles = [p for p in todas_las_frases if p not in usadas]
    
    if not disponibles:
        disponibles = todas_las_frases
        usadas = set()
        
    pregunta_elegida = random.choice(disponibles)
    usadas.add(pregunta_elegida) 
    
    # 4. ACTUALIZAR ESTADO
    doc_ref.update({
        "estado": "votando",
        "modo_actual": datos.modo,
        "opciones_actuales": opciones_ronda, # <--- ESTO LE DICE AL FRONT QUÉ BOTONES DIBUJAR
        "pregunta_actual": pregunta_elegida,
        "votos": {},
        "historial_preguntas": list(usadas)
    })
    
    return {
        "pregunta": pregunta_elegida,
        "opciones": opciones_ronda,
        "modo": datos.modo,
        "mensaje": "¡A votar!"
    }

@router.post("/votar")
def emitir_voto(datos: VotoInput):
    doc_ref = db.collection('partidas_votacion').document(datos.id_sala)
    
    # Guardamos el voto
    clave = f"votos.{datos.nombre_votante}"
    doc_ref.update({ clave: datos.voto_para })
    
    return {"mensaje": "Voto registrado"}

@router.get("/{id_sala}/estado")
def consultar_estado(id_sala: str):
    doc_ref = db.collection('partidas_votacion').document(id_sala)
    partida = doc_ref.get().to_dict()
    
    jugadores = partida['jugadores']
    votos = partida.get('votos', {})
    
    total_votos = len(votos)
    total_jugadores = len(jugadores)
    
    # --- ESCENARIO 1: FALTAN VOTOS ---
    if total_votos < total_jugadores:
        return {
            "estado": "votando",
            "modo": partida.get('modo_actual', 'PERSONAS'),
            "pregunta": partida['pregunta_actual'],
            "opciones": partida.get('opciones_actuales', []),
            "votos_actuales": total_votos,
            "total_esperado": total_jugadores,
            "detalle_grafico": [] 
        }
    
    # --- ESCENARIO 2: ¡TERMINARON! (CÁLCULO) ---
    conteo = {}
    modo = partida.get('modo_actual', 'PERSONAS')
    
    # Inicializar contadores en 0
    if modo == "RICO_POBRE":
        keys_iniciales = ["Muy de Rico", "Muy de Pobre"]
    else:
        keys_iniciales = jugadores

    for k in keys_iniciales:
        conteo[k] = 0
        
    # Contar
    for votado in votos.values():
        if votado in conteo:
            conteo[votado] += 1
        else:
            # Por si alguien manda basura
            conteo[votado] = 1 
            
    # Calcular Porcentajes para el gráfico
    datos_grafico = []
    for k, v in conteo.items():
        porcentaje = 0
        if total_votos > 0:
            porcentaje = round((v / total_votos) * 100)
        
        datos_grafico.append({
            "nombre": k,
            "votos": v,
            "porcentaje": porcentaje
        })
    
    # Mensaje final
    ranking = sorted(conteo.items(), key=lambda x: x[1], reverse=True)
    ganador = ranking[0][0]
    
    frase_final = ""
    if modo == "RICO_POBRE":
        frase_final = f"La mayoría ({ranking[0][1]} votos) dice que es: {ganador}"
    else:
        frase_final = f"¡{ganador} es el más probable! ({ranking[0][1]} votos)"

    return {
        "estado": "resultados",
        "modo": modo,
        "pregunta": partida['pregunta_actual'],
        "ganador": ganador,
        "frase_final": frase_final,
        "detalle_grafico": datos_grafico # Ahora incluye campo 'porcentaje'
    }

# --- MODO PASAMANOS (Simple) ---
@router.post("/siguiente-tarjeta")
def siguiente_tarjeta(datos: SiguienteTarjetaInput):
    doc_ref = db.collection('partidas_votacion').document(datos.id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
        
    partida = doc.to_dict()
    
    # Determinar colección según modo
    nombre_doc_firebase = "votacion"
    if datos.modo == "RICO_POBRE":
        nombre_doc_firebase = "rico_pobre"

    config_ref = db.collection('configuracion_juegos').document(nombre_doc_firebase).get()
    if config_ref.exists:
        todas_las_frases = config_ref.to_dict().get('frases', [])
    else:
        todas_las_frases = ["Error BD"]

    # Filtrar
    usadas = set(partida.get('historial_preguntas', []))
    disponibles = [p for p in todas_las_frases if p not in usadas]
    
    if not disponibles:
        disponibles = todas_las_frases
        usadas = set()
        
    pregunta_elegida = random.choice(disponibles)
    usadas.add(pregunta_elegida)
    
    doc_ref.update({
        "pregunta_actual": pregunta_elegida,
        "historial_preguntas": list(usadas),
        "modo_actual": datos.modo,
        "estado": "pasamanos"
    })
    
    return {
        "pregunta": pregunta_elegida,
        "mensaje": "Leéla en voz alta"
    }