from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from .utils import generar_codigo_sala
import random

router = APIRouter()

# --- MODELOS ---
class ApostarInput(BaseModel):
    id_sala: str
    apuesta: str  # "par", "impar", "mayor", "menor", "igual", "adentro", "afuera"

class VoltearInput(BaseModel):
    id_sala: str

# --- AUXILIARES ---
def generar_mazo():
    # Mazo español de 48 cartas (1 al 12 x 4 palos)
    numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] * 4
    random.shuffle(numeros)
    return numeros

def calcular_consecuencia_piramide(fila_index, cantidad_coincidencias):
    # Definimos las reglas explícitas con nombres para debug
    reglas = [
        {"nombre": "BASE (5 cartas)", "accion": "TOMAR", "base": 3},     # Indice 0
        {"nombre": "SEGUNDA (4 cartas)", "accion": "REPARTIR", "base": 3}, # Indice 1
        {"nombre": "TERCERA (3 cartas)", "accion": "TOMAR", "base": 5},    # Indice 2
        {"nombre": "CUARTA (2 cartas)", "accion": "REPARTIR", "base": 5},  # Indice 3
        {"nombre": "PUNTA (1 carta)", "accion": "TOMAR", "base": 7},       # Indice 4
    ]
    
    if cantidad_coincidencias == 0:
        return None

    regla = reglas[fila_index]
    monto_total = regla["base"] * cantidad_coincidencias
    
    # Texto humano para leer fácil
    verbo = "toma" if regla["accion"] == "TOMAR" else "reparte"
    mensaje_humano = f"Tiene {cantidad_coincidencias} veces el número. ¡{verbo.upper()} {monto_total} tragos!"

    return {
        "fila_nombre": regla["nombre"],
        "accion": regla["accion"],
        "cantidad": monto_total,
        "mensaje": mensaje_humano
    }
# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(jugadores: list[str]):
    codigo = generar_codigo_sala()
    mazo = generar_mazo()
    
    # Estructura inicial de los jugadores
    players_data = {nombre: {"cartas": [], "tragos": 0} for nombre in jugadores}

    nueva_partida = {
        "jugadores": jugadores,
        "datos_jugadores": players_data,
        "mazo": mazo,
        "fase": "RECOLECCION",  # RECOLECCION o PIRAMIDE
        "ronda_actual": 1,      # 1, 2 o 3 (para saber qué preguntar)
        "turno_jugador_idx": 0, # Índice del jugador que le toca
        "piramide_cartas": [],  # Se llena al final de la fase 1
        "piramide_estado": {"fila": 0, "col": 0}, # Qué carta toca voltear
        "mensaje": f"Ronda 1: {jugadores[0]}, ¿Par o Impar?"
    }
    
    db.collection('partidas_piramide').document(codigo).set(nueva_partida)
    
    return {"id_sala": codigo, "mensaje": nueva_partida["mensaje"], "fase": "RECOLECCION"}


@router.post("/apostar")
def apostar_carta(datos: ApostarInput):
    doc_ref = db.collection('partidas_piramide').document(datos.id_sala)
    doc = doc_ref.get()
    if not doc.exists: raise HTTPException(status_code=404, detail="Partida no encontrada")
    partida = doc.to_dict()

    if partida['fase'] != "RECOLECCION":
        return {"mensaje": "Ya no se puede apostar, estamos en la pirámide"}

    jugadores = partida['jugadores']
    idx = partida['turno_jugador_idx']
    jugador_actual = jugadores[idx]
    
    # 1. Sacamos carta
    mazo = partida['mazo']
    if not mazo: mazo = generar_mazo()
    carta_nueva = mazo.pop()
    
    cartas_mano = partida['datos_jugadores'][jugador_actual]['cartas']
    
    # 2. Lógica según la ronda (1, 2 o 3)
    resultado = "ERROR"
    mensaje_resultado = ""
    beber = False
    
    # --- RONDA 1: PAR O IMPAR ---
    if partida['ronda_actual'] == 1:
        es_par = (carta_nueva % 2 == 0)
        dijo_par = (datos.apuesta.lower() == "par")
        
        if es_par == dijo_par:
            mensaje_resultado = "¡Acertaste!"
        else:
            mensaje_resultado = "Fallaste. TOMAS."
            beber = True

    # --- RONDA 2: MAYOR, MENOR O IGUAL ---
    elif partida['ronda_actual'] == 2:
        carta_base = cartas_mano[0]
        if datos.apuesta == "mayor" and carta_nueva > carta_base: mensaje_resultado = "¡Bien! Era mayor."
        elif datos.apuesta == "menor" and carta_nueva < carta_base: mensaje_resultado = "¡Bien! Era menor."
        elif datos.apuesta == "igual" and carta_nueva == carta_base: mensaje_resultado = "¡Increíble! Era igual."
        else:
            mensaje_resultado = "Fallaste. TOMAS."
            beber = True

    # --- RONDA 3: ADENTRO O AFUERA (Intervalo) ---
    elif partida['ronda_actual'] == 3:
        min_c = min(cartas_mano)
        max_c = max(cartas_mano)
        esta_adentro = min_c <= carta_nueva <= max_c # Intervalo cerrado
        
        dijo_adentro = (datos.apuesta == "adentro")
        
        if esta_adentro == dijo_adentro:
            mensaje_resultado = "¡Acertaste el intervalo!"
        else:
            mensaje_resultado = "Fallaste el intervalo. TOMAS."
            beber = True

    # 3. Guardamos la carta en la mano del jugador
    partida['datos_jugadores'][jugador_actual]['cartas'].append(carta_nueva)
    
    # 4. Avanzamos turno
    idx += 1
    nueva_ronda = partida['ronda_actual']
    
    # Si terminaron todos los jugadores esta ronda
    if idx >= len(jugadores):
        idx = 0
        nueva_ronda += 1
    
    # 5. ¿TERMINÓ LA FASE 1? (Al terminar la ronda 3)
    cambio_fase = False
    mensaje_next = ""
    
    if nueva_ronda > 3:
        cambio_fase = True
        partida['fase'] = "PIRAMIDE"
        mensaje_next = "¡Todos tienen cartas! Armado pirámide..."
        
        # ARMAR PIRÁMIDE (5, 4, 3, 2, 1) = 15 cartas
        piramide = {} 
        filas_tamanos = [5, 4, 3, 2, 1]
        
        # Usamos enumerate para saber el índice (0, 1, 2...) y usarlo como clave "0", "1"...
        for i, tamano in enumerate(filas_tamanos):
            fila = []
            for _ in range(tamano):
                if not mazo: mazo = generar_mazo()
                fila.append(mazo.pop())
            # Guardamos como clave string: "0": [c1, c2...], "1": [c3, c4...]
            piramide[str(i)] = fila 
            
        partida['piramide_cartas'] = piramide
        
    else:
        # Definir pregunta del siguiente
        prox_jugador = jugadores[idx]
        preguntas = {1: "¿Par o Impar?", 2: "¿Mayor o Menor?", 3: "¿Adentro o Afuera?"}
        mensaje_next = f"Turno de {prox_jugador}: {preguntas[nueva_ronda]}"

    # Guardar todo
    doc_ref.update({
        "mazo": mazo,
        "datos_jugadores": partida['datos_jugadores'],
        "turno_jugador_idx": idx,
        "ronda_actual": nueva_ronda,
        "fase": partida['fase'],
        "piramide_cartas": partida.get('piramide_cartas', []),
        "mensaje": mensaje_next
    })
    
    return {
        "carta_salio": carta_nueva,
        "mensaje_resultado": mensaje_resultado,
        "beber": beber,
        "proximo_turno": mensaje_next,
        "fase": partida['fase']
    }

@router.post("/voltear")
def voltear_carta_piramide(datos: VoltearInput):
    doc_ref = db.collection('partidas_piramide').document(datos.id_sala)
    doc = doc_ref.get()
    partida = doc.to_dict()
    
    if partida['fase'] != "PIRAMIDE":
        return {"mensaje": "Aún no estamos en fase pirámide"}

    # Obtenemos índices actuales
    fila_idx = partida['piramide_estado']['fila']
    col_idx = partida['piramide_estado']['col']
    piramide = partida['piramide_cartas']
    
    # --- VALIDACIÓN DE FIN DE JUEGO ---
    # Convertimos a string porque en Firestore las claves son textos "0", "1"...
    if str(fila_idx) not in piramide:
         return {"mensaje": "Juego terminado", "terminado": True}
        
    carta_revelada = piramide[str(fila_idx)][col_idx]
    
    # --- APLICAR REGLAS (Lógica Dura) ---
    # Definimos las reglas aquí mismo para que no haya dudas
    reglas = [
        {"nombre": "BASE (5 cartas)", "accion": "TOMAR", "base": 3},      # Index 0
        {"nombre": "SEGUNDA (4 cartas)", "accion": "REPARTIR", "base": 3}, # Index 1
        {"nombre": "TERCERA (3 cartas)", "accion": "TOMAR", "base": 5},    # Index 2
        {"nombre": "CUARTA (2 cartas)", "accion": "REPARTIR", "base": 5},  # Index 3
        {"nombre": "PUNTA (1 carta)", "accion": "TOMAR", "base": 7},       # Index 4
    ]
    
    regla_actual = reglas[fila_idx] # Obtenemos la regla de esta fila
    
    # --- BUSCAR COINCIDENCIAS ---
    consecuencias = []
    
    for nombre, datos_j in partida['datos_jugadores'].items():
        coincidencias = datos_j['cartas'].count(carta_revelada)
        
        if coincidencias > 0:
            monto = regla_actual["base"] * coincidencias
            accion = regla_actual["accion"]
            
            consecuencias.append({
                "jugador": nombre,
                "accion": accion,
                "cantidad": monto,
                "motivo": f"Tiene {coincidencias} veces el {carta_revelada}"
            })

    # --- AVANZAR ÍNDICES (Matemática de matriz) ---
    col_idx += 1
    
    # Si terminamos las cartas de esta fila (usamos str para buscar en el diccionario)
    largo_fila_actual = len(piramide[str(fila_idx)])
    
    if col_idx >= largo_fila_actual:
        col_idx = 0       # Reiniciamos columna
        fila_idx += 1     # Pasamos a la siguiente fila (de 0 a 1, de 1 a 2...)
        
    doc_ref.update({
        "piramide_estado": {"fila": fila_idx, "col": col_idx}
    })
    
    return {
        "carta_revelada": carta_revelada,
        "debug_regla": f"Fila {fila_idx} ({regla_actual['nombre']}) -> {regla_actual['accion']}",
        "consecuencias": consecuencias,
        "terminado": False
    }