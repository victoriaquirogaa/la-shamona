from fastapi import APIRouter, HTTPException
from database import db # <--- Importamos la conexión que creaste en database.py
import random
from models import JuegoCarta # Asumiendo que definiste este modelo

router = APIRouter()

@router.get("/")
def sacar_carta():
    # 1. Buscamos el documento en Firebase
    #    (OJO: Usa los mismos nombres que pusiste en la consola)
    doc_ref = db.collection('mazos').document('yo_nunca')
    doc = doc_ref.get()

    # 2. Validamos que exista
    if not doc.exists:
        raise HTTPException(status_code=404, detail="No se encontró el mazo en la BD")

    # 3. Obtenemos los datos
    data = doc.to_dict()
    lista_frases = data.get('frases', [])

    if not lista_frases:
        return {"texto": "¡Se acabaron las cartas! Agrega más en Firebase.", "tipo": "info"}

    # 4. Elegimos una al azar
    frase_elegida = random.choice(lista_frases)

    return JuegoCarta(texto=frase_elegida, tipo="verdad")