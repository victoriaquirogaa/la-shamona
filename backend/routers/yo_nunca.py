from fastapi import APIRouter, HTTPException
from database import db
import random
from models import JuegoCarta

router = APIRouter()

# Ahora la ruta recibe una "categoria" (gratis o hot)
@router.get("/{categoria}")
def sacar_carta(categoria: str):
    
    # 1. Definimos los nombres de documentos válidos en tu BD
    mazos_validos = {
        "gratis": "yo_nunca_gratis",
        "hot": "yo_nunca_hot"
    }

    # 2. Seguridad: Si piden algo raro, error
    if categoria not in mazos_validos:
        raise HTTPException(status_code=400, detail="Categoría no válida")

    nombre_documento = mazos_validos[categoria]

    # 3. Buscamos en Firebase
    doc_ref = db.collection('mazos').document(nombre_documento)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"No se encontró el mazo {nombre_documento}")

    data = doc.to_dict()
    lista_frases = data.get('frases', [])

    if not lista_frases:
        return JuegoCarta(texto="No hay cartas en este mazo todavía.", tipo="info")

    frase_elegida = random.choice(lista_frases)

    return JuegoCarta(texto=frase_elegida, tipo=categoria)