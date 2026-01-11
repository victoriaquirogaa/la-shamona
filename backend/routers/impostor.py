from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
from routers.utils import generar_codigo_sala
# Importamos la función que revisa si pagó o tiene código
from routers.usuarios import verificar_acceso_usuario 

router = APIRouter()

# --- MODELO DE ENTRADA ---
class CrearPartidaImpostor(BaseModel):
    jugadores: list[str]
    categoria_id: str = None 
    device_id: str  # <--- NUEVO: El "Carnet" del usuario es obligatorio

# --- FUNCIÓN AUXILIAR: TRAER PALABRAS ---
def obtener_datos_categoria(cat_id=None):
    """
    Busca datos y TAMBIÉN nos dice si es premium.
    Retorna: (titulo, palabras, es_premium)
    """
    coleccion_ref = db.collection('categorias_impostor')

    if cat_id:
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        data = doc.to_dict()
        # Devolvemos también el campo es_premium (False por defecto)
        return data['titulo'], data['palabras'], data.get('es_premium', False)
    else:
        # Si es aleatoria, traemos una cualquiera
        docs = list(coleccion_ref.stream())
        if not docs:
            raise HTTPException(status_code=500, detail="No hay categorías en la BD")
        
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)

# --- RUTA 1: MODO ONLINE (Cada uno en su cel) ---
@router.post("/crear")
def crear_partida(datos: CrearPartidaImpostor):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    # 1. LIMPIEZA DE NOMBRES
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    # 2. BUSCAR CATEGORÍA Y VERIFICAR SI ES PAGA
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)
    
    # --- EL FILTRO PATOVICA ---
    if es_premium:
        # Si la categoría cuesta plata, pedimos identificación
        tiene_permiso = verificar_acceso_usuario(datos.device_id)
        
        if not tiene_permiso:
            raise HTTPException(
                status_code=403, # Prohibido
                detail="Esta categoría es Premium. Comprá un pase o usá un código amigo."
            )
    # --------------------------

    # 3. Lógica del Juego
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores_limpios)
    
    nueva_partida = {
        "jugadores": jugadores_limpios,
        "categoria": titulo_cat,
        "palabra_secreta": palabra_secreta,
        "impostor": impostor,
        "estado": "jugando"
    }
    
    # 4. Generar Sala Segura
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

    jugadores_limpios = [j.strip().title() for j in datos.jugadores]

    # 1. Buscar datos
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)

    # 2. FILTRO PATOVICA (También aplica en local)
    if es_premium:
        tiene_permiso = verificar_acceso_usuario(datos.device_id)
        if not tiene_permiso:
            raise HTTPException(
                status_code=403, 
                detail="Esta categoría es Premium. Desbloqueala para jugar."
            )

    # 3. Armar respuesta
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
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada. Verificá el código.")
    
    data = doc.to_dict()
    
    nombre_limpio = nombre_jugador.strip().title()
    
    if nombre_limpio not in data['jugadores']:
        raise HTTPException(status_code=403, detail=f"No estás en esta partida (Probaste como '{nombre_limpio}'?)")

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