from fastapi import APIRouter
from models import JuegoCarta # Importamos del archivo de modelos
import random

# En lugar de app = FastAPI(), usamos router
router = APIRouter()

# Base de datos simulada (luego la sacamos de Firebase)
db_yo_nunca = [
    "Yo nunca he sido infiel.",
    "Yo nunca he robado algo de un hotel.",
    "Yo nunca he mentido en este juego."
]

@router.get("/") 
def sacar_carta():
    frase = random.choice(db_yo_nunca)
    return JuegoCarta(texto=frase, tipo="verdad")

@router.get("/cultura-chupistica")
def sacar_tema():
    temas = ["Marcas de autos", "Posiciones sexuales", "Colores primarios"]
    return {"tema": random.choice(temas)}