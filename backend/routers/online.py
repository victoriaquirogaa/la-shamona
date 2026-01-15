from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
import string
from datetime import datetime, timedelta, timezone # <--- AGREGAR ESTO
from google.cloud.firestore import FieldFilter

router = APIRouter()

# --- MODELOS DE DATOS (Inputs) ---
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

class AsignarPutaInput(BaseModel):
    codigo: str
    dueno: str
    esclavo: str

# --- CONFIGURACIÓN DE REGLAS (Tu lista) ---
REGLAS_JUEGO = {
    "1":  {"texto": "TOMAS VOS (Y tus putas)", "accion": "AUTO_TRAGO"},
    "2":  {"texto": "ELEGÍS QUIÉN TOMA", "accion": "ELEGIR_VICTIMA"},
    "3":  {"texto": "TOMAN TODOS (Según qué tan puta sos)", "accion": "TOMAN_TODOS"},
    "4":  {"texto": "KIWI (El que pierde toma)", "accion": "ELEGIR_VICTIMA"},
    "5":  {"texto": "LA PUTA (Elegí tu mascota)", "accion": "ASIGNAR_MASCOTA"},
    "6":  {"texto": "LIMÓN (El que pierde toma)", "accion": "ELEGIR_VICTIMA"},
    "7":  {"texto": "BARQUITO PERUANO", "accion": "ELEGIR_VICTIMA"},
    "8":  {"texto": "PALITO", "accion": "ELEGIR_VICTIMA"},
    "10": {"texto": "DEDITO (El último toma)", "accion": "ACTIVAR_DEDITO"}, # <--- CAMBIAR ESTO
    "11": {"texto": "¿QUERÉS UN KI?", "accion": "ELEGIR_VICTIMA"},
    "12": {"texto": "DESCANSO (Zafaste)", "accion": "NINGUNA"}
}

# --- FUNCIONES AUXILIARES ---
def generar_codigo():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def crear_mazo_nuevo():
    palos = ['Copa', 'Oro', 'Basto', 'Espada']
    numeros = ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "12"]
    mazo = []
    for p in palos:
        for n in numeros:
            info = REGLAS_JUEGO.get(n)
            mazo.append({
                "numero": n, 
                "palo": p, 
                "texto": info["texto"],
                "accion": info["accion"]
            })
    random.shuffle(mazo)
    return mazo

def obtener_cadena_de_tragos(victima, mascotas_dict):
    """Devuelve una lista con la victima principal y todas sus mascotas en cadena"""
    cadena = [victima]
    procesados = {victima}
    cola = [victima]
    
    while cola:
        actual = cola.pop(0)
        for esclavo, dueno in mascotas_dict.items():
            if dueno == actual and esclavo not in procesados:
                cadena.append(esclavo)
                cola.append(esclavo)
                procesados.add(esclavo)
    return cadena

def limpiar_salas_viejas():
    """Borra las salas que tienen más de 24 horas de antigüedad"""
    try:
        # Calculamos la fecha límite (Ahora - 24 horas)
        # Usamos UTC para no liarnos con zonas horarias
        limite = datetime.now(timezone.utc) - timedelta(hours=24)
        
        # Buscamos salas donde 'creado_en' sea menor (más viejo) que el límite
        # Nota: Esto requiere que guardemos la fecha al crear la sala
        docs = db.collection('salas_online').where(filter=FieldFilter('creado_en', '<', limite)).stream()
        
        batch = db.batch()
        count = 0
        
        for doc in docs:
            batch.delete(doc.reference)
            count += 1
            # Firestore permite lotes de hasta 500 operaciones
            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0
                
        if count > 0:
            batch.commit()
            print(f"🧹 Limpieza: Se borraron {count} salas viejas.")
            
    except Exception as e:
        print(f"Error en limpieza automática: {e}")

# --- ENDPOINTS DE LOBBY (CREAR / UNIRSE / ESTADO) ---
# Estos eran los que faltaban y por eso no creaba la sala

@router.post("/crear")
def crear_sala(datos: CrearSalaInput):
    # 1. EJECUTAMOS LIMPIEZA (Mantenimiento automático)
    # Lo hacemos en un try para que si falla la limpieza, NO impida crear la sala
    try:
        limpiar_salas_viejas() 
    except:
        pass 

    # 2. GENERAMOS CÓDIGO (Ya tenés el de 6 letras)
    codigo = generar_codigo() 
    
    # 3. CREAMOS LA SALA CON FECHA (Timestamp)
    nueva_sala = {
        "host": datos.nombre_host,
        "jugadores": [datos.nombre_host],
        "estado": "esperando",
        "juego_actual": None,
        "fase": None,
        "turno_actual": None,
        "datos_juego": {},
        # IMPORTANTE: Guardamos la fecha actual en UTC
        "creado_en": datetime.now(timezone.utc) 
    }
    
    db.collection('salas_online').document(codigo).set(nueva_sala)
    return {"codigo_sala": codigo, "jugadores": nueva_sala["jugadores"]}

@router.post("/unirse")
def unirse_sala(datos: UnirseSalaInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="¡Esa sala no existe!")
    
    sala = doc.to_dict()
    
    if datos.nombre_jugador not in sala['jugadores']:
        sala['jugadores'].append(datos.nombre_jugador)
        doc_ref.update({"jugadores": sala['jugadores']})
        
    return {"codigo_sala": datos.codigo, "jugadores": sala['jugadores']}

@router.get("/estado/{codigo}")
def obtener_estado_sala(codigo: str):
    doc = db.collection('salas_online').document(codigo).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return doc.to_dict()

# --- ENDPOINTS DE JUEGO (LA JEFA) ---

@router.post("/iniciar")
def iniciar_juego(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    
    doc_ref.update({
        "estado": "jugando",
        "juego_actual": "la-jefa",
        "turno_actual": sala['jugadores'][0],
        "fase": "ESPERANDO",
        "datos_juego": {
            "mazo": crear_mazo_nuevo(),
            "carta_actual": None,
            "mascotas": {}, 
            "resultado_trago": None
        }
    })
    return {"ok": True}

@router.post("/jugada/sacar")
def sacar_carta(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    datos_juego = sala.get('datos_juego', {})
    mazo = datos_juego.get('mazo', [])
    
    if not mazo: return {"error": "Se terminó el mazo"}
    
    carta = mazo.pop(0)
    
    doc_ref.update({
        "datos_juego.mazo": mazo,
        "datos_juego.carta_actual": carta,
        "fase": "ACCION" 
    })
    return {"carta": carta}

@router.post("/jugada/reportar")
def reportar_trago(datos: ReportarTragoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mascotas = sala['datos_juego'].get('mascotas', {})
    
    lista_toman = obtener_cadena_de_tragos(datos.victima, mascotas)
    
    mensaje = f"¡Toma {datos.victima}!"
    if len(lista_toman) > 1:
        mensaje = f"¡Toma {datos.victima} y sus putas!"

    doc_ref.update({
        "fase": "RESULTADO",
        "datos_juego.resultado_trago": {
            "culpable": datos.victima,
            "toman_todos": lista_toman,
            "mensaje": mensaje
        }
    })
    return {"ok": True}

@router.post("/jugada/asignar_puta")
def asignar_puta(datos: AsignarPutaInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mascotas = sala['datos_juego'].get('mascotas', {})
    
    mascotas[datos.esclavo] = datos.dueno
    
    doc_ref.update({
        "datos_juego.mascotas": mascotas,
        "fase": "RESULTADO",
        "datos_juego.resultado_trago": {
            "culpable": datos.esclavo,
            "toman_todos": [],
            "mensaje": f"¡{datos.esclavo} ahora es la PUTA de {datos.dueno}!"
        }
    })
    return {"ok": True}

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
    return {"ok": True}

@router.post("/jugada/toman_todos")
def toman_todos(datos: IniciarJuegoInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    mascotas = sala['datos_juego'].get('mascotas', {})
    jugadores = sala['jugadores']
    
    resultados = [] # Lista de diccionarios: {"nombre": "Fran", "tragos": 3}
    
    for j in jugadores:
        tragos = 1 # El trago base por "Toman Todos"
        
        # Calculamos cuántos dueños tiene arriba (Cadena ascendente)
        # Si Fran es dueño de Vicky, y Vicky de Gastón.
        # Gastón toma: 1 (suyo) + 1 (por Vicky) + 1 (por Fran)
        
        actual = j
        # Mientras 'actual' sea una mascota (esté en las llaves del dict)
        while actual in mascotas: 
            dueno = mascotas[actual]
            tragos += 1
            actual = dueno # Subimos un nivel para ver si el dueño tiene dueño
            
            # (Protección anti-bucle infinito por si A es dueño de B y B de A)
            if tragos > 20: break 
            
        resultados.append({"nombre": j, "tragos": tragos})
    
    # Ordenamos: los que más toman primero (para el escracho)
    resultados.sort(key=lambda x: x['tragos'], reverse=True)
    
    # Armamos textos para mostrar
    lista_texto = [f"{r['nombre']} ({r['tragos']} tragos)" for r in resultados]

    doc_ref.update({
        "fase": "RESULTADO",
        "datos_juego.resultado_trago": {
            "culpable": "TODOS",
            "toman_todos": lista_texto, # Enviamos la lista formateada
            "mensaje": "¡TOMAN TODOS!"
        }
    })
    return {"ok": True}