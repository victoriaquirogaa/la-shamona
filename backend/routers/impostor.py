from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
from utils import generar_codigo_sala # <--- Agrega esto arriba

router = APIRouter()

# --- MODELO DE ENTRADA ---
class CrearPartidaImpostor(BaseModel):
    jugadores: list[str] # Ej: ["Fran", "Gaston", "Victor"]
    categoria_id: str = None # Opcional. Ej: "argentina". Si es None, es aleatoria.

# --- FUNCIÓN AUXILIAR: TRAER PALABRAS ---
def obtener_datos_categoria(cat_id=None):
    """
    Busca una categoría específica o una al azar de Firebase.
    """
    coleccion_ref = db.collection('categorias_impostor')

    if cat_id:
        # 1. Buscamos la específica
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        data = doc.to_dict()
        return data['titulo'], data['palabras']
    else:
        # 2. Elegimos una al azar de todas las disponibles
        docs = list(coleccion_ref.stream()) # Traemos todas (son poquitas, no pasa nada)
        if not docs:
            raise HTTPException(status_code=500, detail="No hay categorías en la BD")
        
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        # Usamos .get() por si te olvidaste de ponerle título en la BD
        return data.get('titulo', 'General'), data.get('palabras', [])

# --- RUTA 1: MODO ONLINE (Cada uno en su cel) ---
@router.post("/crear")
def crear_partida(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    # A. Buscamos datos en Firebase
    titulo_cat, lista_palabras = obtener_datos_categoria(datos.categoria_id)
    
    # B. Elegimos palabra e impostor
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(datos.jugadores)
    
    # C. Guardamos la partida
    nueva_partida = {
        "jugadores": datos.jugadores,
        "categoria": titulo_cat,
        "palabra_secreta": palabra_secreta,
        "impostor": impostor,
        "estado": "jugando"
    }
    
    # --- NUEVA LÓGICA DE CÓDIGO CORTO ---
    codigo_sala = generar_codigo_sala()
    
    # Definimos la referencia CON el ID que nosotros queremos
    doc_ref = db.collection('partidas_impostor').document(codigo_sala)
    
    # IMPORTANTE: Validar que no exista (Colisión). 
    # Es raro con 4 letras, pero un buen ingeniero siempre verifica.
    if doc_ref.get().exists:
        # Si tenemos mala suerte y existe, probamos de nuevo
        codigo_sala = generar_codigo_sala()
        doc_ref = db.collection('partidas_impostor').document(codigo_sala)

    # En vez de .add(), usamos .set() para guardar con NUESTRO ID
    doc_ref.set(nueva_partida) 
    
    return {
        "mensaje": "Partida creada", 
        "id_sala": codigo_sala, # <--- Ahora devolvemos "XJ9P" en vez de "7yXm..."
        "categoria": titulo_cat
    }
    

# --- RUTA 2: MODO PASAMANOS (Un solo cel) ---
@router.post("/crear-local")
def crear_partida_local(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    # A. Buscamos datos en Firebase
    titulo_cat, lista_palabras = obtener_datos_categoria(datos.categoria_id)

    # B. Lógica del juego
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(datos.jugadores)
    
    # C. Armamos la respuesta para el Frontend
    roles_asignados = []
    for jugador in datos.jugadores:
        if jugador == impostor:
            mision = {"nombre": jugador, "rol": "IMPOSTOR", "palabra": "???"}
        else:
            mision = {"nombre": jugador, "rol": "CIUDADANO", "palabra": palabra_secreta}
        roles_asignados.append(mision)
        
    # (Opcional) Guardamos estadística en BD si quieres
    
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
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    data = doc.to_dict()
    
    if nombre_jugador not in data['jugadores']:
        raise HTTPException(status_code=403, detail="No estás en esta partida")

    es_impostor = (data['impostor'] == nombre_jugador)
    
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