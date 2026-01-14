from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from .utils import generar_codigo_sala 
import random

router = APIRouter()

# --- MODELOS (Aquí estaba el problema del 422) ---
class NuevoPeajeInput(BaseModel):
    jugadores: list[str]

class JugarTurnoInput(BaseModel):
    id_sala: str
    prediccion: str  # "mayor", "menor", "igual"

# --- AUXILIARES ---
def generar_mazo():
    """Genera un mazo de 48 cartas españolas (1-12 x 4 palos) mezclado"""
    numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] * 4
    random.shuffle(numeros)
    return numeros

# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(datos: NuevoPeajeInput): # <--- Ahora usamos el modelo
    # 1. LIMPIEZA DE NOMBRES
    # Accedemos a datos.jugadores en lugar de usar la variable directa
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    codigo = generar_codigo_sala()
    mazo = generar_mazo()
    
    # Sacamos la primera carta para empezar
    carta_inicial = mazo.pop()
    
    nueva_partida = {
        "jugadores": jugadores_limpios, 
        "turno_actual": 0, 
        "posicion": 0,     
        "carta_visible": carta_inicial,
        "mazo": mazo,
        "estado": "jugando",
        "mensaje": "¡Empieza el Peaje! Adivina la próxima carta."
    }
    
    # Guardamos con ID corto
    db.collection('partidas_peaje').document(codigo).set(nueva_partida)
    
    return {
        "id_sala": codigo,
        "carta_visible": carta_inicial,
        "posicion": 0,
        "mensaje": nueva_partida["mensaje"]
    }

@router.post("/jugar")
def jugar_turno(datos: JugarTurnoInput):
    doc_ref = db.collection('partidas_peaje').document(datos.id_sala)
    doc = doc_ref.get()
    
    # 2. PROTECCIÓN ANTI-CRASH
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")
    
    partida = doc.to_dict()
    
    if partida['estado'] == "terminado":
        return {"mensaje": "La partida ya terminó", "terminado": True}

    # 1. Sacamos la SIGUIENTE carta para comparar
    mazo = partida['mazo']
    if len(mazo) == 0:
        mazo = generar_mazo() # Rellenamos si se acaban
        
    carta_nueva = mazo.pop()
    carta_vieja = partida['carta_visible']
    
    # 2. Verificamos si acertó
    resultado = "errado"
    
    if datos.prediccion == "mayor" and carta_nueva > carta_vieja:
        resultado = "acierto"
    elif datos.prediccion == "menor" and carta_nueva < carta_vieja:
        resultado = "acierto"
    elif datos.prediccion == "igual" and carta_nueva == carta_vieja:
        resultado = "acierto"
    
    # 3. Calculamos la nueva posición
    posicion_actual = partida['posicion']
    nueva_posicion = posicion_actual
    accion_extra = None # "peaje", "beber", "ganar"
    mensaje = ""

    if resultado == "acierto":
        nueva_posicion += 1
        mensaje = "¡Correcto! Avanzas."
        
        # DETECCIÓN DE PEAJES (Cruces)
        # De 2 a 3 (Fin Bloque 1 -> Bloque 2)
        if posicion_actual == 2 and nueva_posicion == 3:
            accion_extra = "PEAJE"
            mensaje = "¡Acertaste! Pero cruzaste PEAJE. ¡Fondo blanco!"
            
        # De 5 a 6 (Fin Bloque 2 -> Final)
        elif posicion_actual == 5 and nueva_posicion == 6:
            accion_extra = "PEAJE"
            mensaje = "¡Último paso! PEAJE antes de la gloria."
            
        # VICTORIA (Superó la carta 6)
        elif nueva_posicion > 6:
            partida['estado'] = "terminado"
            accion_extra = "GANADOR"
            mensaje = "¡GANASTE EL JUEGO DEL PEAJE!"
            
    else: # Erró
        accion_extra = "BEBER"
        mensaje = f"¡Error! Salió un {carta_nueva}. Toman un trago."
        
        # PENALIZACIONES CRUELES
        if posicion_actual == 6: # Carta final
            nueva_posicion = 0 
            mensaje += " ¡Y vuelves al principio!"
            
        elif 3 <= posicion_actual <= 5: # Bloque 2
            nueva_posicion = max(0, posicion_actual - 1) 
            mensaje += " Retrocedes un paso."
            
        else: # Bloque 1 (0, 1, 2)
            nueva_posicion = 0 
            mensaje += " Vuelves a empezar."

    # 4. Guardamos cambios
    doc_ref.update({
        "carta_visible": carta_nueva,
        "mazo": mazo,
        "posicion": nueva_posicion,
        "estado": partida['estado']
    })
    
    return {
        "carta_anterior": carta_vieja,
        "carta_nueva": carta_nueva,
        "resultado": resultado,
        "nueva_posicion": nueva_posicion,
        "accion": accion_extra, 
        "mensaje": mensaje,
        "terminado": (partida['estado'] == "terminado")
    }