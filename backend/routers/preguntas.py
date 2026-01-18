from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from routers.utils import generar_codigo_sala
from routers.usuarios import verificar_acceso_usuario 
import random
from models import JuegoCarta 

router = APIRouter()

# --- MODELOS (Los dejamos por si algún día activás el online) ---
class CrearPartidaInput(BaseModel):
    jugadores: list[str]
    categoria_id: str 
    device_id: str    

class SiguientePreguntaInput(BaseModel):
    id_sala: str

# --- ENDPOINTS ---

# (Dejé estos endpoints online por si acaso, pero el importante es el último)
@router.post("/crear")
def crear_partida(datos: CrearPartidaInput):
    # ... (Lógica online existente) ...
    raise HTTPException(status_code=501, detail="Este juego es solo Offline por ahora.")

@router.post("/siguiente")
def siguiente_pregunta(datos: SiguientePreguntaInput):
    raise HTTPException(status_code=501, detail="Este juego es solo Offline por ahora.")


# --- 🌟 ATAJO: MODO RÁPIDO (OFFLINE) 🌟 ---
# Este es el que usa tu app cuando tocan "Siguiente"

@router.get("/{categoria_id}")
def sacar_pregunta_rapida(categoria_id: str):
    
    # 1. Definimos qué colecciones existen en Firebase y si son premium
    # (Esto sirve para validar y para saber qué mezclar)
    mapa_categorias = {
        "polemicas": "polemicas",
        "profundas": "profundas",
        "toxicos": "toxicos",
        "picantes": "picantes", # 💲 Esta es la paga
        # Agregá acá cualquier otra categoría nueva
    }

    lista_final_preguntas = []
    tipo_resultado = categoria_id

    try:
        # --- 🔀 CASO 1: MIX (Traemos TODO) ---
        if categoria_id == "mix":
            # Recorremos todas las categorías del mapa
            for id_doc in mapa_categorias.values():
                try:
                    doc_ref = db.collection('categorias_preguntas').document(id_doc)
                    doc = doc_ref.get()
                    if doc.exists:
                        data = doc.to_dict()
                        # Sumamos las preguntas de esta categoría a la bolsa común
                        lista_final_preguntas.extend(data.get('preguntas', []))
                except Exception as e:
                    print(f"Error cargando categoría {id_doc} para el mix: {e}")
            
            # Si después de recorrer todo no hay preguntas...
            if not lista_final_preguntas:
                return {"texto": "Error: No se encontraron preguntas para mezclar.", "tipo": "error"}

        # --- 📂 CASO 2: CATEGORÍA ESPECÍFICA ---
        else:
            # Validación de seguridad: ¿Existe la categoría?
            if categoria_id not in mapa_categorias:
                # Intento de fallback por si el ID es directo
                id_doc = categoria_id
            else:
                id_doc = mapa_categorias[categoria_id]

            doc_ref = db.collection('categorias_preguntas').document(id_doc)
            doc = doc_ref.get()

            if not doc.exists:
                return {"texto": f"Error: No existe el mazo '{categoria_id}'", "tipo": "error"}

            data = doc.to_dict()
            lista_final_preguntas = data.get('preguntas', [])

        # --- 3. SELECCIÓN FINAL ---
        if not lista_final_preguntas:
            return {"texto": "¡Este mazo está vacío!", "tipo": "info"}

        # Elegimos una al azar
        frase_elegida = random.choice(lista_final_preguntas)

        return {
            "texto": frase_elegida,
            "tipo": tipo_resultado # Devuelve "mix" o el nombre de la categoría
        }

    except Exception as e:
        print(f"Error crítico en preguntas: {e}")
        return {"texto": "Error de conexión con la base de datos", "tipo": "error"}