from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random

router = APIRouter()

# --- REGLAS DEL JUEGO (CMS en código por ahora) ---
MAZO_REGLAS = [
    {"valor": "1", "accion": "Tomas vos"},
    {"valor": "2", "accion": "Elige quién toma"},
    {"valor": "3", "accion": "Toman todos (cadena)"},
    {"valor": "4", "accion": "Kiwi"},
    {"valor": "5", "accion": "La Puta"},
    {"valor": "6", "accion": "Limon"},
    {"valor": "7", "accion": "Barquito Peruano"},
    {"valor": "8", "accion": "Palito"}, 
    {"valor": "9", "accion": "1 al 10"},
    {"valor": "10", "accion": "Dedito"},
    {"valor": "11", "accion": "Queres un ki?"},
    {"valor": "12", "accion": "Descaso"},

]
PALOS = ["Espada", "Basto", "Oro", "Copa"]

class CrearPartidaInput(BaseModel):
    jugadores: list[str]

# 1. CREAR LA MESA
@router.post("/crear")
def crear_partida(datos: CrearPartidaInput):
    nueva_sala = {
        "jugadores": datos.jugadores,
        "turno_index": 0,  # Arranca el primer jugador de la lista
        "ultima_carta": None
    }
    # Guardamos en una colección nueva 'partidas_la_puta'
    ref = db.collection('partidas_la_puta').add(nueva_sala)
    return {"mensaje": "Mesa lista", "id_sala": ref[1].id}

# 2. JUGAR TURNO (La lógica de punteros)
@router.post("/{id_sala}/sacar-carta")
def jugar_turno(id_sala: str):
    # A. Buscamos el estado actual en la nube
    doc_ref = db.collection('partidas_la_puta').document(id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    sala = doc.to_dict()
    
    # B. Sacamos carta al azar
    carta_info = random.choice(MAZO_REGLAS)
    palo = random.choice(PALOS)
    
    # C. CÁLCULO DE TURNOS (Aquí arreglamos tu problema anterior)
    jugadores = sala['jugadores']
    index_actual = sala['turno_index']
    
    # El que tira ahora
    jugador_actual = jugadores[index_actual]
    
    # Calculamos el siguiente usando MÓDULO (%)
    # Ejemplo: Si son 3 jugadores (0, 1, 2) y va el 2:
    # (2 + 1) = 3.   3 / 3 tiene resto 0.   -> Vuelve al 0.
    proximo_index = (index_actual + 1) % len(jugadores)
    
    carta_completa = {
        "valor": carta_info["valor"],
        "palo": palo,
        "accion": carta_info["accion"]
    }
    
    # D. Guardamos el nuevo estado (Movemos el "puntero" en la BD)
    doc_ref.update({
        "turno_index": proximo_index,
        "ultima_carta": carta_completa
    })
    
    return {
        "carta": carta_completa,
        "jugador_que_tiro": jugador_actual,
        "proximo_jugador": jugadores[proximo_index] # Para que el front sepa a quién le toca
    }