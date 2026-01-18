from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db
import random
from routers.usuarios import verificar_acceso_usuario 

router = APIRouter()

# --- MODELOS ---

# Para INICIAR el juego en una sala que YA EXISTE (Lobby)
class IniciarJuegoInput(BaseModel):
    codigo: str  # El código de la sala donde están todos esperando
    categoria_id: Optional[str] = "mix" # Si no mandan nada, es Mix
    device_id: Optional[str] = "invitado"

# Para jugar OFFLINE (Pasando el celu)
class CrearPartidaLocalInput(BaseModel):
    jugadores: list[str]
    categoria_id: Optional[str] = "mix"
    device_id: Optional[str] = "invitado_offline"

# --- HELPER: LÓGICA DEL MIX ---
def obtener_datos_categoria(cat_id=None):
    coleccion_ref = db.collection('categorias_impostor')

    # A. CASO ESPECÍFICO (Ej: "comida")
    if cat_id and cat_id != "mix":
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            # Fallback seguro por si borraste la categoría
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        data = doc.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)
    
    # B. CASO MIX / ALEATORIO
    else:
        # Traemos todas las categorías
        docs = list(coleccion_ref.stream())
        if not docs:
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        
        # Elegimos una al azar
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)

# --- ENDPOINT 1: LISTAR CATEGORÍAS (Para el selector del Host) ---
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

# --- ENDPOINT 2: INICIAR ONLINE (Usando la sala existente) ---
@router.post("/iniciar")
def iniciar_juego_online(datos: IniciarJuegoInput):
    # 1. Buscamos la sala en 'salas_online'
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    sala = doc.to_dict()
    jugadores = sala.get('jugadores', [])

    # 2. Validamos jugadores
    if len(jugadores) < 3:
        raise HTTPException(status_code=400, detail="Faltan jugadores (mínimo 3)")

    # 3. Elegimos Categoría (Mix o Específica)
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)

    # 4. Seguridad Premium
    # Si es Mix, pasa gratis (asumimos que vio video en frontend). Si es específica premium, validamos.
    if es_premium and datos.categoria_id != "mix":
        if not verificar_acceso_usuario(datos.device_id):
             raise HTTPException(status_code=403, detail="Categoría Premium bloqueada.")

    # 5. Asignamos Roles
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores)

    # 6. Actualizamos la sala para que arranque el juego
    datos_partida = {
        "impostor": impostor,
        "palabra_secreta": palabra_secreta,
        "categoria": titulo_cat,
        "eliminados": [],
        "ultimo_eliminado": None,
        "ganador": None,
        "mensaje_final": None,
        "votos": {}
    }

    doc_ref.update({
        "estado": "jugando",     # Esto dispara el cambio de pantalla en el frontend
        "juego_actual": "impostor",
        "fase": "RONDA",         # Fase inicial del Impostor
        "datos_juego": datos_partida
    })

    return {"mensaje": "Juego iniciado", "categoria": titulo_cat}

# --- ENDPOINT 3: CREAR LOCAL (OFFLINE / PASAMANOS) ---
@router.post("/crear-local")
def crear_partida_local(datos: CrearPartidaLocalInput):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    jugadores_limpios = [j.strip().title() for j in datos.jugadores]
    
    # Mix / Categoría
    titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)

    # Seguridad Local
    if es_premium and datos.categoria_id != "mix":
        dev_id = datos.device_id or "invitado_offline"
        if not verificar_acceso_usuario(dev_id):
            raise HTTPException(status_code=403, detail="Categoría Premium.")

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

# --- ENDPOINT 4: OBTENER MISIÓN (ONLINE) ---
# Ahora busca correctamente en 'salas_online'
@router.get("/{codigo_sala}/mi-mision")
def obtener_mision(codigo_sala: str, nombre_jugador: str):
    doc = db.collection('salas_online').document(codigo_sala).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")
    
    sala = doc.to_dict()
    
    # Validamos que el juego sea impostor
    if sala.get('juego_actual') != 'impostor':
         # Si la sala existe pero no están jugando impostor, devolvemos algo neutro o error
         raise HTTPException(status_code=400, detail="No se está jugando al Impostor.")

    datos_juego = sala.get('datos_juego', {})
    
    nombre_limpio = nombre_jugador.strip().title()
    if nombre_limpio not in sala.get('jugadores', []):
         raise HTTPException(status_code=403, detail="No estás en la sala.")

    palabra = datos_juego.get('palabra_secreta')
    impostor = datos_juego.get('impostor')

    es_impostor = (impostor == nombre_limpio)
    
    if es_impostor:
        return {"rol": "IMPOSTOR", "descripcion": "Engaña a todos.", "palabra": "???"}
    else:
        return {"rol": "CIUDADANO", "descripcion": f"Palabra: {palabra}", "palabra": palabra}