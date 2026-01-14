from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from routers.utils import generar_codigo_sala
from routers.usuarios import verificar_acceso_usuario 
import random

router = APIRouter()

# --- MODELOS ---
class CrearPartidaInput(BaseModel):
    jugadores: list[str]
    categoria_id: str # "picante", "profundas", "polemica"
    device_id: str    # Carnet para validar premium

class SiguientePreguntaInput(BaseModel):
    id_sala: str

# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(datos: CrearPartidaInput):
    # 1. Validar Jugadores
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]
    
    # 2. Buscar Categoría y sus Preguntas
    doc_cat = db.collection('categorias_preguntas').document(datos.categoria_id).get()
    
    if not doc_cat.exists:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    info_cat = doc_cat.to_dict()
    preguntas = info_cat.get('preguntas', [])
    es_premium = info_cat.get('es_premium', False)
    
    if not preguntas:
        raise HTTPException(status_code=500, detail="Esta categoría está vacía")

    # 3. FILTRO PATOVICA (Seguridad Premium) 👮‍♂️
    if es_premium:
        tiene_permiso = verificar_acceso_usuario(datos.device_id)
        if not tiene_permiso:
            raise HTTPException(
                status_code=403, 
                detail="Categoría Premium. Comprá el pase o usá un código."
            )

    # 4. Preparar el mazo (Mezclar)
    random.shuffle(preguntas)

    # 5. Crear la Sala
    codigo = generar_codigo_sala()
    
    nueva_partida = {
        "jugadores": jugadores_limpios,
        "categoria_titulo": info_cat.get('titulo', 'Preguntas'),
        "mazo_restante": preguntas, # Guardamos todas las preguntas mezcladas
        "preguntas_usadas": [],
        "pregunta_actual": "Toca 'Siguiente' para empezar",
        "turno_jugador": 0, # Índice para ir rotando quién lee/responde
        "estado": "jugando"
    }
    
    # Check de colisión de código (por las dudas)
    doc_ref = db.collection('partidas_preguntas').document(codigo)
    if doc_ref.get().exists:
        codigo = generar_codigo_sala()
        doc_ref = db.collection('partidas_preguntas').document(codigo)
        
    doc_ref.set(nueva_partida)
    
    return {
        "id_sala": codigo, 
        "mensaje": "Partida creada", 
        "titulo": nueva_partida['categoria_titulo']
    }

@router.post("/siguiente")
def siguiente_pregunta(datos: SiguientePreguntaInput):
    doc_ref = db.collection('partidas_preguntas').document(datos.id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
        
    partida = doc.to_dict()
    
    # Verificar si quedan cartas
    if not partida['mazo_restante']:
        return {"mensaje": "¡Se acabaron las preguntas de este mazo!", "terminado": True}
    
    # 1. Sacar carta del mazo
    nueva_pregunta = partida['mazo_restante'].pop(0)
    
    # 2. Rotar jugador (Opcional: dice a quién le toca responder o leer)
    idx = partida['turno_jugador']
    jugador_actual = partida['jugadores'][idx]
    proximo_idx = (idx + 1) % len(partida['jugadores'])
    
    # 3. Guardar cambios
    doc_ref.update({
        "pregunta_actual": nueva_pregunta,
        "mazo_restante": partida['mazo_restante'],
        "preguntas_usadas": partida['preguntas_usadas'] + [nueva_pregunta],
        "turno_jugador": proximo_idx
    })
    
    return {
        "pregunta": nueva_pregunta,
        "le_toca_a": jugador_actual,
        "terminado": False
    }

# ... (todo tu código anterior de crear sala y siguiente pregunta sigue igual) ...

# --- ATAJO: MODO RÁPIDO (Para jugar offline sin sala) ---
from models import JuegoCarta # Asegúrate de tener este import arriba o aquí

@router.get("/{categoria_id}")
def sacar_pregunta_rapida(categoria_id: str):
    # 1. Mapeo de seguridad (Frontend -> ID Documento Firebase)
    mapa = {
        "polemicas": "polemicas",
        "profundas": "profundas",
        "picantes": "picantes", 
        "toxicos": "toxicos"
    }
    
    # Si piden algo que no existe, error
    if categoria_id not in mapa:
         # Fallback: si no está en el mapa, intentamos usar el ID directo
         # pero por seguridad mejor usar el mapa si puedes.
         id_doc = categoria_id
    else:
         id_doc = mapa[categoria_id]

    # 2. Buscar directo en la colección de preguntas
    doc_ref = db.collection('categorias_preguntas').document(id_doc)
    doc = doc_ref.get()

    if not doc.exists:
        return {"texto": f"Error: No existe el mazo '{id_doc}'", "tipo": "error"}

    data = doc.to_dict()
    lista = data.get('preguntas', [])

    if not lista:
        return {"texto": "¡Mazo vacío!", "tipo": "info"}

    # 3. Devolver una al azar
    import random
    return {
        "texto": random.choice(lista),
        "tipo": categoria_id
    }