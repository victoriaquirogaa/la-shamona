from fastapi import APIRouter
from database import db
import random

router = APIRouter()

@router.get("/random")
def obtener_publicidad():
    # 1. Buscamos solo los anuncios que estén marcados como ACTIVOS
    #    (En Firebase se usa .where para filtrar)
    docs = db.collection('publicidades').where('activo', '==', True).stream()
    
    lista_ads = []
    for doc in docs:
        ad = doc.to_dict()
        ad['id'] = doc.id # Guardamos el ID para contar la vista después
        lista_ads.append(ad)
    
    if not lista_ads:
        return {"hay_anuncio": False}

    # 2. Elegimos uno al azar
    #    (Dato Pro: Podrías usar 'random.choices' con pesos según cuánto pagaron)
    anuncio_elegido = random.choice(lista_ads)
    
    # 3. (Opcional) Sumamos +1 al contador de vistas en segundo plano
    #    Esto es clave para mostrarle al cliente que su plata valió la pena.
    db.collection('publicidades').document(anuncio_elegido['id']).update({
        "vistas_contador": anuncio_elegido.get('vistas_contador', 0) + 1
    })

    return {
        "hay_anuncio": True,
        "datos": {
            "imagen": anuncio_elegido['imagen_url'],
            "link": anuncio_elegido['link_destino'],
            "titulo": anuncio_elegido.get('cliente', 'Sponsor')
        }
    }