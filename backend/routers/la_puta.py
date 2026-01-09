from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random

router = APIRouter()

# Lógica específica de este juego
mazo_base = ["A", "2", "3", "4", "5", "6", "7", "10", "11", "12"]
palos = ["Espada", "Basto", "Oro", "Copa"]

class Carta(BaseModel):
    numero: str
    palo: str
    accion: str

def obtener_accion(numero):
    # Aquí va la lógica de TU juego
    reglas = {
        "A": "Toman todos",
        "7": "Mojas el dedo (El último toma)",
        "10": "Elige quién toma",
        "12": "Regla nueva"
    }
    return reglas.get(numero, "Toma el jugador actual")

@router.get("/sacar-carta")
def jugar_turno():
    numero = random.choice(mazo_base)
    palo = random.choice(palos)
    accion = obtener_accion(numero)
    
    return Carta(numero=numero, palo=palo, accion=accion)

@router.post("/reiniciar-mazo")
def reiniciar():
    return {"mensaje": "Mazo mezclado de nuevo"}