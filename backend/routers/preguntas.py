from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
from typing import List

router = APIRouter()

# --- DEFINICIÓN DE VIPs ---
CATEGORIAS_VIP = ["picantes"]

# --- 🃏 MAZO COMPLETO (para que el frontend no repita) ---
MAPA_CATEGORIAS_PREGUNTAS = {
    "polemicas": "polemicas",
    "profundas": "profundas",
    "toxicos": "toxicos",
    "picantes": "picantes",
}

@router.get("/mazo/{categoria_id}")
def obtener_mazo_completo_preguntas(categoria_id: str, es_premium: bool = False) -> dict:
    lista_final: List[str] = []

    if categoria_id == "mix":
        for nombre_front, id_doc in MAPA_CATEGORIAS_PREGUNTAS.items():
            if nombre_front in CATEGORIAS_VIP and not es_premium:
                continue
            try:
                doc = db.collection('categorias_preguntas').document(id_doc).get()
                if doc.exists:
                    lista_final.extend(doc.to_dict().get('preguntas', []))
            except Exception as e:
                print(f"Error cargando {id_doc}: {e}")
    else:
        if categoria_id in CATEGORIAS_VIP and not es_premium:
            raise HTTPException(status_code=403, detail="Categoría exclusiva Premium.")
        id_doc = MAPA_CATEGORIAS_PREGUNTAS.get(categoria_id, categoria_id)
        doc = db.collection('categorias_preguntas').document(id_doc).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"No existe el mazo '{categoria_id}'")
        lista_final = doc.to_dict().get('preguntas', [])

    random.shuffle(lista_final)
    return {"frases": lista_final, "total": len(lista_final)}

# --- MODELOS (Restaurados) ---
class CrearPartidaInput(BaseModel):
    jugadores: list[str]
    categoria_id: str 
    device_id: str    

class SiguientePreguntaInput(BaseModel):
    id_sala: str

# --- ENDPOINTS PLACEHOLDER (Restaurados) ---
@router.post("/crear")
def crear_partida(datos: CrearPartidaInput):
    raise HTTPException(status_code=501, detail="Este juego es solo Offline por ahora.")

@router.post("/siguiente")
def siguiente_pregunta(datos: SiguientePreguntaInput):
    raise HTTPException(status_code=501, detail="Este juego es solo Offline por ahora.")


# --- 🌟 ATAJO: MODO RÁPIDO (OFFLINE) 🌟 ---
# Este es el que usa tu app cuando tocan "Siguiente"

@router.get("/{categoria_id}")
def sacar_pregunta_rapida(categoria_id: str, es_premium: bool = False): # 👈 Agregamos el flag aquí
    
    # 1. Definimos qué colecciones existen en Firebase
    mapa_categorias = {
        "polemicas": "polemicas",
        "profundas": "profundas",
        "toxicos": "toxicos",
        "picantes": "picantes", 
        "mix": "mix"
    }

    lista_final_preguntas = []
    tipo_resultado = categoria_id

    try:
        # --- 🔀 CASO 1: MIX (Traemos TODO, pero filtramos VIPs) ---
        if categoria_id == "mix":
            # Recorremos el mapa (Clave: nombre frontend, Valor: id firebase)
            for nombre_front, id_doc in mapa_categorias.items():
                if nombre_front == "mix": continue

                # 🛑 FILTRO DE JUSTICIA:
                # Si la categoría es VIP y el usuario NO paga -> LA SALTAMOS
                if nombre_front in CATEGORIAS_VIP and not es_premium:
                    continue

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
                return {"texto": "No hay preguntas disponibles (o son todas VIP).", "tipo": "info"}

        # --- 📂 CASO 2: CATEGORÍA ESPECÍFICA ---
        else:
            # 🛑 BLOQUEO DE SEGURIDAD VIP
            # Si intentan pedir 'picantes' directamente sin pagar -> 403
            if categoria_id in CATEGORIAS_VIP and not es_premium:
                raise HTTPException(status_code=403, detail="Categoría exclusiva Premium")

            # Validación de seguridad: ¿Existe la categoría?
            id_doc = mapa_categorias.get(categoria_id, categoria_id)

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
            "tipo": tipo_resultado 
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error crítico en preguntas: {e}")
        return {"texto": "Error de conexión con la base de datos", "tipo": "error"}