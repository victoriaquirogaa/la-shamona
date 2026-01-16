from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional # <--- 1. AGREGÁ ESTA IMPORTACIÓN
from database import db
import random
from routers.utils import generar_codigo_sala
from routers.usuarios import verificar_acceso_usuario 

router = APIRouter()

# --- MODELO DE ENTRADA BLINDADO ---
class CrearPartidaImpostor(BaseModel):
    jugadores: list[str]
    # Usamos Optional para que si el frontend manda null, no explote
    categoria_id: Optional[str] = None 
    device_id: Optional[str] = "invitado_offline"

# --- FUNCIÓN AUXILIAR ---
def obtener_datos_categoria(cat_id=None):
    coleccion_ref = db.collection('categorias_impostor')

    if cat_id:
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        data = doc.to_dict()
        return data['titulo'], data['palabras'], data.get('es_premium', False)
    else:
        # Si es aleatoria
        docs = list(coleccion_ref.stream())
        if not docs:
            # Fallback por si la BD está vacía
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)

# --- NUEVO: LISTAR CATEGORÍAS DISPONIBLES ---
@router.get("/categorias")
def listar_categorias():
    try:
        docs = db.collection('categorias_impostor').stream()
        lista = []
        for doc in docs:
            d = doc.to_dict()
            lista.append({
                "id": doc.id,
                "titulo": d.get("titulo", "Sin Título"),
                "es_premium": d.get("es_premium", False)
            })
        return lista
    except Exception as e:
        print(f"Error trayendo categorias: {e}")
        return []

# --- RUTA 1: ONLINE ---
@router.post("/crear")
def crear_partida(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    jugadores_limpios = [j.strip().title() for j in datos.jugadores]
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)
    
    if es_premium:
        # Si no hay device_id, asumimos que no tiene permiso
        dev_id = datos.device_id or "invitado"
        if not verificar_acceso_usuario(dev_id):
             raise HTTPException(status_code=403, detail="Categoría Premium bloqueda.")

    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores_limpios)
    
    nueva_partida = {
        "jugadores": jugadores_limpios,
        "categoria": titulo_cat,
        "palabra_secreta": palabra_secreta,
        "impostor": impostor,
        "estado": "jugando"
    }
    
    codigo_sala = generar_codigo_sala()
    # (Simplifiqué la lógica de guardado para que sea más clara, es igual a la tuya)
    db.collection('partidas_impostor').document(codigo_sala).set(nueva_partida)
    
    return {
        "mensaje": "Partida creada", 
        "id_sala": codigo_sala,
        "categoria": titulo_cat
    }
    
# --- RUTA 2: OFFLINE (LOCAL) ---
@router.post("/crear-local")
def crear_partida_local(datos: CrearPartidaImpostor):
    # Validación básica
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    # 1. Buscar datos
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)

    # 2. Filtro Premium (Opcional en local, pero lo dejamos)
    if es_premium:
        dev_id = datos.device_id or "invitado_offline"
        if not verificar_acceso_usuario(dev_id):
            raise HTTPException(status_code=403, detail="Categoría Premium.")

    # 3. Lógica del juego
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

# --- RUTA 3: MISION ---
@router.get("/{id_sala}/mi-mision")
def obtener_mision(id_sala: str, nombre_jugador: str):
    doc = db.collection('partidas_impostor').document(id_sala).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")
    
    data = doc.to_dict()
    nombre_limpio = nombre_jugador.strip().title()
    
    if nombre_limpio not in data['jugadores']:
        raise HTTPException(status_code=403, detail="No estás en la partida.")

    es_impostor = (data['impostor'] == nombre_limpio)
    
    if es_impostor:
        return {"rol": "IMPOSTOR", "descripcion": "Engaña a todos.", "palabra": "???"}
    else:
        return {"rol": "CIUDADANO", "descripcion": f"Palabra: {data['palabra_secreta']}", "palabra": data['palabra_secreta']}
    
# --- AGREGAR AL FINAL DE backend/routers/impostor.py ---
