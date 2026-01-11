from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from .utils import generar_codigo_sala
import random

router = APIRouter()

# --- MODELOS ---
class VotoInput(BaseModel):
    id_sala: str
    nombre_votante: str
    voto_para: str

class NuevaRondaInput(BaseModel):
    id_sala: str

# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(jugadores: list[str]):
    codigo = generar_codigo_sala()
    
    nueva_partida = {
        "jugadores": jugadores,
        "estado": "esperando",
        "pregunta_actual": "Esperando inicio...",
        "votos": {}, 
        "historial_preguntas": [] # Para no repetir frases
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
    
    # 1. TRAER PREGUNTAS DE LA BASE DE DATOS (NUEVO)
    # Buscamos en la colección de configuración
    config_ref = db.collection('configuracion_juegos').document('votacion').get()
    
    if config_ref.exists:
        todas_las_frases = config_ref.to_dict().get('frases', [])
    else:
        # Fallback de emergencia por si borraste la colección sin querer
        todas_las_frases = ["¿Quién no configuró la base de datos?", "¿Quién rompió el código?"]

    # 2. FILTRAR LAS YA USADAS
    usadas = set(partida.get('historial_preguntas', []))
    disponibles = [p for p in todas_las_frases if p not in usadas]
    
    # Si ya usamos todas, reseteamos el historial
    if not disponibles:
        disponibles = todas_las_frases
        usadas = set()
        
    pregunta_elegida = random.choice(disponibles)
    
    # Guardamos la nueva en el historial (convertimos set a list)
    usadas.add(pregunta_elegida) 
    
    # 3. RESETEAR PARA VOTAR
    doc_ref.update({
        "estado": "votando",
        "pregunta_actual": pregunta_elegida,
        "votos": {}, # Urna vacía
        "historial_preguntas": list(usadas)
    })
    
    return {
        "pregunta": pregunta_elegida,
        "opciones": partida['jugadores'],
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
            "pregunta": partida['pregunta_actual'],
            "votos_actuales": total_votos,
            "total_esperado": total_jugadores,
            "detalle_grafico": [] # Aún no hay datos para mostrar
        }
    
    # --- ESCENARIO 2: ¡TERMINARON! (CÁLCULO DE RESULTADOS) ---
    conteo = {}
    # Inicializamos todos en 0 para que salgan en el gráfico aunque nadie los vote
    for j in jugadores:
        conteo[j] = 0
        
    for votado in votos.values():
        if votado in conteo:
            conteo[votado] += 1
        
    # Preparamos los datos EXACTOS para que el Frontend dibuje la torta
    # Formato: [{"nombre": "Vicky", "votos": 5}, {"nombre": "Gaston", "votos": 2}]
    datos_grafico = [{"nombre": k, "votos": v} for k, v in conteo.items()]
    
    # Calculamos quién ganó para el mensaje
    ranking = sorted(conteo.items(), key=lambda x: x[1], reverse=True)
    ganador = ranking[0][0]
    
    return {
        "estado": "resultados", # <--- ESTO ES LO QUE DISPARA LA PANTALLA DE GRÁFICO
        "pregunta": partida['pregunta_actual'],
        "ganador": ganador,
        "frase_final": f"¡{ganador} es el más probable!",
        "detalle_grafico": datos_grafico 
    }

# --- NUEVO MODELO ---
class SiguienteTarjetaInput(BaseModel):
    id_sala: str

# --- NUEVO ENDPOINT PARA MODO PASAMANOS ---
@router.post("/siguiente-tarjeta")
def siguiente_tarjeta(datos: SiguienteTarjetaInput):
    doc_ref = db.collection('partidas_votacion').document(datos.id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
        
    partida = doc.to_dict()
    
    # 1. TRAER PREGUNTAS (Igual que antes)
    config_ref = db.collection('configuracion_juegos').document('votacion').get()
    if config_ref.exists:
        todas_las_frases = config_ref.to_dict().get('frases', [])
    else:
        todas_las_frases = ["Error: No hay preguntas en la BD"]

    # 2. FILTRAR USADAS
    usadas = set(partida.get('historial_preguntas', []))
    disponibles = [p for p in todas_las_frases if p not in usadas]
    
    # Reset si se acabaron
    if not disponibles:
        disponibles = todas_las_frases
        usadas = set()
        
    pregunta_elegida = random.choice(disponibles)
    usadas.add(pregunta_elegida)
    
    # 3. ACTUALIZAR HISTORIAL (Pero NO cambiamos el estado a 'votando')
    doc_ref.update({
        "pregunta_actual": pregunta_elegida,
        "historial_preguntas": list(usadas),
        "estado": "pasamanos" # Solo informativo
    })
    
    # 4. DEVOLVER LA TARJETA
    return {
        "pregunta": pregunta_elegida,
        "mensaje": "Leéla en voz alta y pasá el celu"
    }