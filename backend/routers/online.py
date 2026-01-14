from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
import string

router = APIRouter()

# --- MODELOS ---
class CrearSalaInput(BaseModel):
    nombre_host: str

class UnirseSalaInput(BaseModel):
    codigo: str
    nombre_jugador: str

class IniciarJuegoInput(BaseModel):
    codigo: str
    juego: str # ej: "la-jefa"

# --- AUXILIARES ---
def generar_codigo():
    """Genera 4 letras al azar (Ej: 'AFK4')"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# --- ENDPOINTS ---

@router.post("/crear")
def crear_sala(datos: CrearSalaInput):
    codigo = generar_codigo()
    
    # Verificamos que no exista (muy raro que pase, pero por las dudas)
    while db.collection('salas_online').document(codigo).get().exists:
        codigo = generar_codigo()

    nueva_sala = {
        "host": datos.nombre_host,
        "jugadores": [datos.nombre_host], # El host es el primer jugador
        "estado": "esperando", # esperando | jugando
        "juego_actual": None,
        "configuracion": {}
    }
    
    # Guardamos en Firebase
    db.collection('salas_online').document(codigo).set(nueva_sala)
    
    return {
        "mensaje": "Sala creada con éxito",
        "codigo_sala": codigo,
        "jugadores": nueva_sala["jugadores"]
    }

@router.post("/unirse")
def unirse_sala(datos: UnirseSalaInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="¡Esa sala no existe!")

    sala = doc.to_dict()
    
    if datos.nombre_jugador in sala['jugadores']:
        return {"mensaje": "Ya estabas adentro", "codigo_sala": datos.codigo, "jugadores": sala['jugadores']}
    
    # Agregamos al nuevo jugador
    sala['jugadores'].append(datos.nombre_jugador)
    doc_ref.update({"jugadores": sala['jugadores']})
    
    return {
        "mensaje": f"Te uniste a la sala de {sala['host']}",
        "codigo_sala": datos.codigo,
        "jugadores": sala['jugadores']
    }

# ... (al final del archivo)

@router.get("/estado/{codigo}")
def obtener_estado_sala(codigo: str):
    doc = db.collection('salas_online').document(codigo).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return doc.to_dict()

@router.post("/iniciar")
def iniciar_juego_sala(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Sala no existe")
        
    # Guardamos qué juego se eligió y cambiamos estado
    doc_ref.update({
        "estado": "jugando", 
        "juego_actual": datos.juego
    })
    
    return {"mensaje": f"Iniciando {datos.juego}"}