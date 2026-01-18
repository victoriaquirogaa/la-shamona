from fastapi import APIRouter, HTTPException
from database import db
import random
from models import JuegoCarta

router = APIRouter()

@router.get("/{categoria}")
def sacar_carta(categoria: str):
    
    # 1. Definimos los nombres reales de los documentos en Firebase
    mazos_validos = {
        "gratis": "yo_nunca_gratis",
        "hot": "yo_nunca_hot"
    }

    # --- 🔀 CASO MIX: JUNTAR TODO ---
    if categoria == "mix":
        todas_las_frases = []
        
        # Recorremos todos los mazos conocidos (gratis y hot)
        for nombre_doc in mazos_validos.values():
            try:
                doc_ref = db.collection('mazos').document(nombre_doc)
                doc = doc_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    frases = data.get('frases', [])
                    todas_las_frases.extend(frases) # Agregamos a la bolsa grande
            except Exception as e:
                print(f"Error leyendo {nombre_doc}: {e}")

        # Si no encontramos ninguna frase en ningún lado
        if not todas_las_frases:
             return JuegoCarta(texto="No se encontraron cartas para el Mix.", tipo="info")

        # Elegimos una al azar de la mezcla total
        frase_elegida = random.choice(todas_las_frases)
        return JuegoCarta(texto=frase_elegida, tipo="mix")


    # --- 📂 CASO NORMAL: UNA SOLA CATEGORÍA ---
    if categoria not in mazos_validos:
        raise HTTPException(status_code=400, detail="Categoría no válida. Usá: gratis, hot o mix")

    nombre_documento = mazos_validos[categoria]

    # Buscamos en Firebase el documento específico
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