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
    juego: str

class ReportarTragoInput(BaseModel):
    codigo: str
    victima: str

REGLAS_CARTAS = {
    "1":  {"texto": "TOMAS VOS", "accion": "AUTO_TRAGO"},
    "2":  {"texto": "ELEGÍS QUIÉN TOMA", "accion": "ELEGIR_VICTIMA"},
    "3":  {"texto": "TOMAN TODOS", "accion": "TOMAN_TODOS"},
    "4":  {"texto": "KIWI (El que pierde toma)", "accion": "ELEGIR_VICTIMA"},
    "5":  {"texto": "LA PUTA (Elegí tu mascota)", "accion": "ASIGNAR_MASCOTA"},
    "6":  {"texto": "LIMÓN (El que pierde toma)", "accion": "ELEGIR_VICTIMA"},
    "7":  {"texto": "BARQUITO PERUANO", "accion": "ELEGIR_VICTIMA"},
    "8":  {"texto": "PALITO", "accion": "ELEGIR_VICTIMA"},
    "10": {"texto": "DEDITO", "accion": "ACTIVAR_DEDITO"},
    "11": {"texto": "¿QUERÉS UN KI?", "accion": "ELEGIR_VICTIMA"},
    "12": {"texto": "DESCANSO (Nadie toma)", "accion": "NINGUNA"}
}

def crear_mazo_nuevo():
    palos = ['Copa', 'Oro', 'Basto', 'Espada']
    numeros = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '11', '12'] # Agregué el 8
    mazo = []
    for p in palos:
        for n in numeros:
            regla_info = REGLAS_CARTAS.get(n, {"texto": "Regla Genérica", "accion": "NINGUNA"})
            mazo.append({
                "numero": n, 
                "palo": p, 
                "texto": regla_info["texto"],
                "accion": regla_info["accion"]
            })
    random.shuffle(mazo)
    return mazo

# --- AUXILIARES ---
def generar_codigo():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def crear_mazo_nuevo():
    palos = ['Copa', 'Oro', 'Basto', 'Espada']
    numeros = ['1', '2', '3', '4', '5', '6', '7', '10', '11', '12']
    mazo = []
    for p in palos:
        for n in numeros:
            regla = "Regla Genérica"
            if n == "1": regla = "Yo Nunca"
            elif n == "7": regla = "La Jefa (Mascotas)"
            # ... (Acá después podés pegar todas tus reglas)
            mazo.append({"carta": f"{n} de {p}", "numero": n, "palo": p, "regla": regla})
    random.shuffle(mazo)
    return mazo

# --- ENDPOINTS BÁSICOS (Crear/Unirse/Estado) ---
# (Estos ya los tenías, asegurate de dejarlos o copiarlos si borraste todo)

@router.post("/crear")
def crear_sala(datos: CrearSalaInput):
    codigo = generar_codigo()
    nueva_sala = {
        "host": datos.nombre_host,
        "jugadores": [datos.nombre_host],
        "estado": "esperando",
        "juego_actual": None,
        "fase": None
    }
    db.collection('salas_online').document(codigo).set(nueva_sala)
    return {"codigo_sala": codigo, "jugadores": nueva_sala["jugadores"]}

@router.post("/unirse")
def unirse_sala(datos: UnirseSalaInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    if not doc.exists: return {"detail": "Sala no existe"}
    sala = doc.to_dict()
    if datos.nombre_jugador not in sala['jugadores']:
        sala['jugadores'].append(datos.nombre_jugador)
        doc_ref.update({"jugadores": sala['jugadores']})
    return {"codigo_sala": datos.codigo, "jugadores": sala['jugadores']}

@router.get("/estado/{codigo}")
def obtener_estado_sala(codigo: str):
    return db.collection('salas_online').document(codigo).get().to_dict()

# --- LOGICA DEL JUEGO LA JEFA ---

@router.post("/iniciar")
def iniciar_juego(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mazo = crear_mazo_nuevo()
    
    doc_ref.update({
        "estado": "jugando",
        "juego_actual": datos.juego,
        "turno_actual": sala['jugadores'][0], # Empieza el host
        "fase": "ESPERANDO", # Fases: ESPERANDO -> ACCION -> RESULTADO
        "datos_juego": {
            "mazo": mazo,
            "carta_actual": None,
            "mascotas": {}, 
            "resultado_trago": None # Acá guardamos quién toma para mostrarle a todos
        }
    })
    return {"mensaje": "Juego iniciado"}

@router.post("/jugada/sacar")
def sacar_carta(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mazo = sala['datos_juego']['mazo']
    
    if not mazo: return {"error": "Fin del mazo"}
    
    carta = mazo.pop(0)
    doc_ref.update({
        "datos_juego.mazo": mazo,
        "datos_juego.carta_actual": carta,
        "fase": "ACCION" # Ahora todos ven la carta
    })
    return {"carta": carta}

@router.post("/jugada/reportar")
def reportar_trago(datos: ReportarTragoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    
    # Lógica de mascotas simple
    toman = [datos.victima]
    mascotas = sala['datos_juego'].get('mascotas', {})
    
    # Buscamos si la victima tenía mascotas (cadena de tragos)
    for esclavo, dueno in mascotas.items():
        if dueno == datos.victima:
            toman.append(esclavo)
            
    doc_ref.update({
        "fase": "RESULTADO", # Activamos el modo "Escracho"
        "datos_juego.resultado_trago": {
            "culpable": datos.victima,
            "toman_todos": toman
        }
    })
    return {"mensaje": "Reportado"}

@router.post("/jugada/pasar")
def pasar_turno(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    
    jugadores = sala['jugadores']
    idx = jugadores.index(sala['turno_actual'])
    siguiente = jugadores[(idx + 1) % len(jugadores)]
    
    doc_ref.update({
        "fase": "ESPERANDO",
        "turno_actual": siguiente,
        "datos_juego.carta_actual": None,
        "datos_juego.resultado_trago": None
    })
    return {"turno": siguiente}

@router.post("/jugada/reportar")
def reportar_trago_online(datos: ReportarTragoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mascotas = sala['datos_juego'].get('mascotas', {})
    
    # Lógica de Cadena de Putas
    def obtener_cadena(victima):
        cadena = [victima]
        # Buscamos recursivamente quiénes son mascotas de la víctima
        # (Esto busca solo un nivel, si quieres cadena infinita avísame)
        for esclavo, dueno in mascotas.items():
            if dueno == victima and esclavo not in cadena:
                cadena.append(esclavo)
        return cadena

    toman_final = obtener_cadena(datos.victima)

    doc_ref.update({
        "fase": "RESULTADO",
        "datos_juego.resultado_trago": {
            "culpable": datos.victima,
            "toman_todos": toman_final,
            "mensaje": f"¡Toma {datos.victima} y sus putas!"
        }
    })
    return {"mensaje": "Reportado"}

# --- NUEVO ENDPOINT: ASIGNAR PUTA (Carta 5) ---
class AsignarPutaInput(BaseModel):
    codigo: str
    dueno: str # El que sacó la carta
    esclavo: str # La nueva puta

@router.post("/jugada/asignar_puta")
def asignar_puta(datos: AsignarPutaInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    
    mascotas = sala['datos_juego'].get('mascotas', {})
    mascotas[datos.esclavo] = datos.dueno # El esclavo ahora responde al dueño
    
    doc_ref.update({
        "datos_juego.mascotas": mascotas,
        "fase": "RESULTADO", # Mostramos cartel de confirmación
        "datos_juego.resultado_trago": {
            "culpable": datos.esclavo,
            "toman_todos": [],
            "mensaje": f"¡{datos.esclavo} ahora es la PUTA de {datos.dueno}!"
        }
    })
    return {"mensaje": "Mascota asignada"}

# --- NUEVO ENDPOINT: TOMAN TODOS (Carta 3) ---
@router.post("/jugada/toman_todos")
def reportar_toman_todos(datos: IniciarJuegoInput): # Reusamos modelo con codigo
    doc_ref = db.collection('salas_online').document(datos.codigo)
    # Acá podrías calcular tragos complejos si quieres, por ahora mensaje simple
    doc_ref.update({
        "fase": "RESULTADO",
        "datos_juego.resultado_trago": {
            "culpable": "TODOS",
            "toman_todos": ["TODOS"],
            "mensaje": "¡TOMAN TODOS! (Y sus putas sufren doble)"
        }
    })
    return {"mensaje": "Fiesta"}