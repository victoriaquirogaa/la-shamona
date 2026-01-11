from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
from routers.utils import generar_codigo_sala

router = APIRouter()

# --- MODELO DE ENTRADA ---
class CrearPartidaImpostor(BaseModel):
    jugadores: list[str] # Ej: ["Fran", "Gaston", "Victor"]
    categoria_id: str = None # Opcional.

# --- FUNCIÓN AUXILIAR: TRAER PALABRAS ---
def obtener_datos_categoria(cat_id=None):
    """
    Busca una categoría específica o una al azar de Firebase.
    """
    coleccion_ref = db.collection('categorias_impostor')

    if cat_id:
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        data = doc.to_dict()
        return data['titulo'], data['palabras']
    else:
        docs = list(coleccion_ref.stream())
        if not docs:
            raise HTTPException(status_code=500, detail="No hay categorías en la BD")
        
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', [])

# --- RUTA 1: MODO ONLINE (Cada uno en su cel) ---
@router.post("/crear")
def crear_partida(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    # 1. LIMPIEZA DE NOMBRES (Vital para evitar errores de mayúsculas)
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    # A. Buscamos datos en Firebase
    titulo_cat, lista_palabras = obtener_datos_categoria(datos.categoria_id)
    
    # B. Elegimos palabra e impostor (usando la lista limpia)
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores_limpios)
    
    # C. Guardamos la partida
    nueva_partida = {
        "jugadores": jugadores_limpios,
        "categoria": titulo_cat,
        "palabra_secreta": palabra_secreta,
        "impostor": impostor,
        "estado": "jugando"
    }
    
    # D. Generación de Código Seguro
    codigo_sala = generar_codigo_sala()
    doc_ref = db.collection('partidas_impostor').document(codigo_sala)
    
    if doc_ref.get().exists:
        codigo_sala = generar_codigo_sala()
        doc_ref = db.collection('partidas_impostor').document(codigo_sala)

    doc_ref.set(nueva_partida) 
    
    return {
        "mensaje": "Partida creada", 
        "id_sala": codigo_sala,
        "categoria": titulo_cat
    }
    

# --- RUTA 2: MODO PASAMANOS (Un solo cel) ---
@router.post("/crear-local")
def crear_partida_local(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    # Limpieza aquí también por consistencia
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    titulo_cat, lista_palabras = obtener_datos_categoria(datos.categoria_id)

    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores_limpios)
    
    roles_asignados = []
    for jugador in jugadores_limpios:
        if jugador == impostor:
            mision = {"nombre": jugador, "rol": "IMPOSTOR", "palabra": "???"}
        else:
            mision = {"nombre": jugador, "rol": "CIUDADANO", "palabra": palabra_secreta}
        roles_asignados.append(mision)
        
    return {
        "modo": "pasamanos",
        "categoria": titulo_cat,
        "distribucion": roles_asignados 
    }

# --- RUTA 3: CONSULTAR MISION (Para modo Online) ---
@router.get("/{id_sala}/mi-mision")
def obtener_mision(id_sala: str, nombre_jugador: str):
    doc_ref = db.collection('partidas_impostor').document(id_sala)
    doc = doc_ref.get()
    
    # 1. PROTECCIÓN ANTI-CRASH
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada. Verificá el código.")
    
    data = doc.to_dict()
    
    # 2. LIMPIEZA DEL NOMBRE ENTRANTE (Para que haga match con la BD)
    nombre_limpio = nombre_jugador.strip().title()
    
    if nombre_limpio not in data['jugadores']:
        raise HTTPException(status_code=403, detail=f"No estás en esta partida (Intentaste como '{nombre_limpio}')")

    es_impostor = (data['impostor'] == nombre_limpio)
    
    if es_impostor:
        return {
            "rol": "IMPOSTOR",
            "descripcion": "¡Engáñalos! No sabes la palabra.",
            "palabra": "???"
        }
    else:
        return {
            "rol": "CIUDADANO",
            "descripcion": f"La palabra es: {data['palabra_secreta']}",
            "palabra": data['palabra_secreta']
        }