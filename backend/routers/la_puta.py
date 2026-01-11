from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from .utils import generar_codigo_sala
import random

router = APIRouter()

# --- REGLAS DEL JUEGO ---
REGLAS = {
    "1": "Tomas vos",
    "2": "Quien toma? (Elige a uno para que tome)",
    "3": "Toman todos",
    "4": "Kiwi (1 kiwi, 1 kiwi 2 kiwis...)",
    "5": "LA PUTA (elegis quien toma cada vez que tomas vos)",
    "6": "Limon (tu numero de limon...)",
    "7": "Barquito Peruano",
    "8": "Palito (numeros romanos)", 
    "9": "1 al 10 (cambia numero por palabra)",
    "10": "Dedito (ultimo que pone el dedo toma)",
    "11": "Queres un ki?",
    "12": "Descanso" 
}

# --- MODELOS ---
class NuevoJuegoInput(BaseModel):
    jugadores: list[str]

class TurnoInput(BaseModel):
    id_sala: str

class AsignarPutaInput(BaseModel):
    id_sala: str
    dueño: str   # El que sacó la carta (A)
    mascota: str # El elegido (B)

class RegistrarTragoInput(BaseModel):
    id_sala: str
    perdedor: str # El que perdió el juego

# --- AUXILIAR: CALCULAR CADENA DE TRAGOS ---
def calcular_cadena_tragos(nombre_victima, mapa_jugadores, visitados=None):
    if visitados is None:
        visitados = set()
    
    if nombre_victima in visitados:
        return []
    
    visitados.add(nombre_victima)
    afectados = [nombre_victima]
    
    # Buscamos a las putas de esta víctima
    datos_victima = mapa_jugadores.get(nombre_victima, {})
    mis_putas = datos_victima.get("putas", [])
    
    for mascota in mis_putas:
        # Recursividad: Si A toma -> B toma -> C toma
        afectados.extend(calcular_cadena_tragos(mascota, mapa_jugadores, visitados))
        
    # Eliminamos duplicados manteniendo el orden
    return list(dict.fromkeys(afectados))

# --- ENDPOINTS ---

@router.post("/crear")
def crear_partida(datos: NuevoJuegoInput):
    codigo = generar_codigo_sala()
    mazo = [f"{n} de {p}" for n in range(1, 13) for p in ["Espada", "Basto", "Oro", "Copa"]]
    random.shuffle(mazo)
    
    datos_jugadores = {}
    for j in datos.jugadores:
        datos_jugadores[j] = {
            "putas": [] 
        }

    nueva_partida = {
        "jugadores_lista": datos.jugadores,
        "datos_jugadores": datos_jugadores,
        "mazo": mazo,
        "descarte": [],
        "turno_index": 0,
        "estado": "jugando"
    }
    
    db.collection('partidas_laputa').document(codigo).set(nueva_partida)
    return {"id_sala": codigo, "mensaje": "Mazo barajado y listo"}

@router.post("/sacar-carta")
def sacar_carta(datos: TurnoInput):
    doc_ref = db.collection('partidas_laputa').document(datos.id_sala)
    doc = doc_ref.get()
    partida = doc.to_dict()
    
    if not partida['mazo']:
        return {"mensaje": "Se terminó el mazo, ¡a mezclar!", "terminado": True}
    
    carta = partida['mazo'].pop(0)
    jugador_actual = partida['jugadores_lista'][partida['turno_index']]
    
    # Analizar número
    numero = carta.split(" ")[0] # "7 de Espada" -> "7"
    regla = REGLAS.get(numero, "Toma un trago")
    
    # Avanzar turno
    nuevo_index = (partida['turno_index'] + 1) % len(partida['jugadores_lista'])
    
    doc_ref.update({
        "mazo": partida['mazo'],
        "descarte": partida['descarte'] + [carta],
        "turno_index": nuevo_index
    })
    
    # --- LÓGICA DE ACCIONES ---
    accion_requerida = "NINGUNA"
    resultado_extra = {} # Aquí mandamos info extra según la carta

    # CARTA 1: TOMAS VOS (Calculamos cadena automática)
    if numero == "1":
        afectados = calcular_cadena_tragos(jugador_actual, partida['datos_jugadores'])
        resultado_extra = {
            "mensaje_trago": f"Le toca a {jugador_actual}, pero arrastra a: {', '.join(afectados)}",
            "toman_lista": afectados
        }

    # CARTA 2: ELEGIR VICTIMA
    elif numero == "2":
        accion_requerida = "ELEGIR_VICTIMA"
        # Enviamos lista de todos para que elija
        resultado_extra = {"opciones": partida['jugadores_lista']}

    # CARTA 3: TOMAN TODOS (Cálculo Matemático de Putas)
    elif numero == "3":
        conteo_tragos = {j: 0 for j in partida['jugadores_lista']}
        
        # Simulamos que CADA jugador dispara una cadena
        for iniciador in partida['jugadores_lista']:
            # Si 'iniciador' toma, ¿quiénes más caen con él?
            cadena = calcular_cadena_tragos(iniciador, partida['datos_jugadores'])
            for victima in cadena:
                conteo_tragos[victima] += 1
        
        # Formateamos para el frontend
        lista_final = [{"nombre": k, "tragos": v} for k, v in conteo_tragos.items()]
        # Ordenamos por cantidad de tragos (el más borracho arriba)
        lista_final.sort(key=lambda x: x['tragos'], reverse=True)
        
        resultado_extra = {"detalle_toman_todos": lista_final}

    # CARTA 5: LA PUTA (Asignar)
    elif numero == "5":
        accion_requerida = "ELEGIR_PUTA"
        resultado_extra = {"opciones": [j for j in partida['jugadores_lista'] if j != jugador_actual]}

    # CARTA 10: DEDITO (Activar botón especial)
    elif numero == "10":
        accion_requerida = "INICIAR_DEDITO"
        # El front debe mostrar un botón flotante que diga "¡Vi un dedo!" o "Perdió alguien"

    # JUEGOS DONDE ALGUIEN PIERDE AL FINAL (4, 6, 7, 8, 9, 11)
    elif numero in ["4", "6", "7", "8", "9", "11"]:
        accion_requerida = "ELEGIR_PERDEDOR"
        resultado_extra = {"opciones": partida['jugadores_lista']}
    
    return {
        "carta": carta,
        "jugador": jugador_actual,
        "regla": regla,
        "accion_requerida": accion_requerida,
        "datos_extra": resultado_extra 
    }

@router.post("/asignar-puta")
def asignar_puta(datos: AsignarPutaInput):
    doc_ref = db.collection('partidas_laputa').document(datos.id_sala)
    partida = doc_ref.get().to_dict()
    mapa = partida['datos_jugadores']
    
    # REGLA ANULACIÓN (Espejito)
    if datos.dueño in mapa[datos.mascota]['putas']:
        mapa[datos.mascota]['putas'].remove(datos.dueño)
        mensaje = f"¡ESPEJITO! {datos.dueño} se liberó de {datos.mascota}."
    else:
        if datos.mascota not in mapa[datos.dueño]['putas']:
            mapa[datos.dueño]['putas'].append(datos.mascota)
        mensaje = f"{datos.mascota} ahora es la puta de {datos.dueño}."

    doc_ref.update({"datos_jugadores": mapa})
    return {"mensaje": mensaje, "estado_actual": mapa}

@router.post("/registrar-trago")
def registrar_trago(datos: RegistrarTragoInput):
    """
    Se usa para CARTA 2, CARTA 10 (Dedito) y JUEGOS (4,6,7,8,9,11).
    Calcula la cadena de tragos de la víctima elegida.
    """
    doc_ref = db.collection('partidas_laputa').document(datos.id_sala)
    partida = doc_ref.get().to_dict()
    
    cadena_de_borrachos = calcular_cadena_tragos(datos.perdedor, partida['datos_jugadores'])
    
    return {
        "mensaje": f"Perdió {datos.perdedor}.",
        "toman": cadena_de_borrachos,
        "cantidad_afectados": len(cadena_de_borrachos)
    }