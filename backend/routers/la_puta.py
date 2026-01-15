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
    # --- LIMPIEZA DE NOMBRES ---
    # Convertimos "vicky" -> "Vicky", "GASTON" -> "Gaston"
    # El .strip() quita espacios vacíos adelante o atrás
    jugadores_limpios = [j.strip().title() for j in datos.jugadores]
    
    codigo = generar_codigo_sala() # Esto ya genera 6 dígitos
    mazo = [f"{n} de {p}" for n in range(1, 13) for p in ["Espada", "Basto", "Oro", "Copa"]]
    random.shuffle(mazo)
    
    datos_jugadores = {}
    for j in jugadores_limpios:
        datos_jugadores[j] = {
            "putas": [] 
        }

    nueva_partida = {
        "jugadores_lista": jugadores_limpios, # Usamos la lista limpia
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
    
    # --- PROTECCIÓN ANTI-CRASH ---
    if not doc.exists:
        raise HTTPException(status_code=404, detail="No existe una partida con ese código.")
        
    partida = doc.to_dict()
    
    if not partida['mazo']:
        return {"mensaje": "Se terminó el mazo, ¡a mezclar!", "terminado": True}
    
    carta = partida['mazo'].pop(0)
    jugador_actual = partida['jugadores_lista'][partida['turno_index']]
    
    # Analizar número
    numero = carta.split(" ")[0]
    regla = REGLAS.get(numero, "Toma un trago")
    
    # Avanzar turno
    nuevo_index = (partida['turno_index'] + 1) % len(partida['jugadores_lista'])
    
    doc_ref.update({
        "mazo": partida['mazo'],
        "descarte": partida['descarte'] + [carta],
        "turno_index": nuevo_index
    })
    
    # --- LÓGICA DE RESPUESTA ---
    accion_requerida = "NINGUNA"
    resultado_extra = {}

    if numero == "1":
        # CORRECCIÓN AQUÍ:
        # 1. Usamos jugador_actual (porque datos.victima no existe aquí)
        afectados = calcular_cadena_tragos(jugador_actual, partida['datos_jugadores'])
        
        mensaje_trago = f"¡Toma {jugador_actual}!"
        
        # 2. Usamos la variable correcta 'afectados' (no lista_toman)
        if len(afectados) > 1: 
            solo_putas = afectados[1:] 
            nombres_putas = ", ".join(solo_putas)
            mensaje_trago = f"¡Toma {jugador_actual} y sus putas: {nombres_putas}!"
        
        # 3. Guardamos el mensaje en resultado_extra
        resultado_extra = {"mensaje_trago": mensaje_trago}

    elif numero == "2":
        accion_requerida = "ELEGIR_VICTIMA"
        resultado_extra = {"opciones": partida['jugadores_lista']}
        
    elif numero == "3":
        # Lógica TOMAN TODOS
        conteo_tragos = {j: 0 for j in partida['jugadores_lista']}
        
        for iniciador in partida['jugadores_lista']:
            cadena = calcular_cadena_tragos(iniciador, partida['datos_jugadores'])
            for victima in cadena:
                conteo_tragos[victima] += 1
                
        lista_final = [{"nombre": k, "tragos": v} for k, v in conteo_tragos.items() if v > 0]
        lista_final.sort(key=lambda x: x['tragos'], reverse=True)
        
        resultado_extra = {"detalle_toman_todos": lista_final}
        
    elif numero == "5":
        accion_requerida = "ELEGIR_PUTA"
        resultado_extra = {"opciones": [j for j in partida['jugadores_lista'] if j != jugador_actual]}
        
    elif numero == "10":
        accion_requerida = "INICIAR_DEDITO"
        
    elif numero in ["4", "6", "7", "8", "9", "11"]:
        accion_requerida = "ELEGIR_VICTIMA" # Unifiqué nombres (antes tenías ELEGIR_PERDEDOR)
        resultado_extra = {"opciones": partida['jugadores_lista']}
    
    return {
        "carta": carta,
        "jugador": jugador_actual,
        "regla": regla,
        "accion_requerida": accion_requerida,
        "datos_extra": resultado_extra 
    }

    if numero == "1":
        afectados = calcular_cadena_tragos(jugador_actual, partida['datos_jugadores'])
        mensaje = f"¡Toma {datos.victima}!"
        if len(lista_toman) > 1:
            # lista_toman tiene: [Dueño, Puta1, Puta2...]
            # Separamos las putas para mostrarlas
            solo_putas = lista_toman[1:] 
            nombres_putas = ", ".join(solo_putas) # Une los nombres con comas
            
            mensaje = f"¡Toma {datos.victima} y sus putas: {nombres_putas}!"
    elif numero == "2":
        accion_requerida = "ELEGIR_VICTIMA"
        resultado_extra = {"opciones": partida['jugadores_lista']}
    elif numero == "3":
        # Lógica TOMAN TODOS con Cadenas
        conteo_tragos = {j: 0 for j in partida['jugadores_lista']}
        
        # Simulamos que CADA jugador toma 1 trago y vemos a quién arrastra
        for iniciador in partida['jugadores_lista']:
            # Si A toma, ¿quién más toma por culpa de A?
            cadena = calcular_cadena_tragos(iniciador, partida['datos_jugadores'])
            for victima in cadena:
                conteo_tragos[victima] += 1
                
        # Formateamos para el frontend
        lista_final = [{"nombre": k, "tragos": v} for k, v in conteo_tragos.items() if v > 0]
        # Ordenamos: el que más toma arriba
        lista_final.sort(key=lambda x: x['tragos'], reverse=True)
        
        resultado_extra = {"detalle_toman_todos": lista_final}
    elif numero == "5":
        accion_requerida = "ELEGIR_PUTA"
        resultado_extra = {"opciones": [j for j in partida['jugadores_lista'] if j != jugador_actual]}
    elif numero == "10":
        accion_requerida = "INICIAR_DEDITO"
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
    doc = doc_ref.get()
    
    # 1. Protección Anti-Crash
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    partida = doc.to_dict()
    mapa = partida['datos_jugadores']
    
    # 2. Limpieza de nombres
    dueño_limpio = datos.dueño.strip().title()
    mascota_limpia = datos.mascota.strip().title()
    
    # Validación extra: ¿Existen estos jugadores?
    if dueño_limpio not in mapa or mascota_limpia not in mapa:
        raise HTTPException(status_code=400, detail="Uno de los jugadores no existe en esta partida")

    # 3. Lógica de Anulación (Usando los nombres limpios)
    if dueño_limpio in mapa[mascota_limpia]['putas']:
        mapa[mascota_limpia]['putas'].remove(dueño_limpio)
        mensaje = f"¡ESPEJITO! {dueño_limpio} se liberó de {mascota_limpia}."
    else:
        if mascota_limpia not in mapa[dueño_limpio]['putas']:
            mapa[dueño_limpio]['putas'].append(mascota_limpia)
        mensaje = f"{mascota_limpia} ahora es la puta de {dueño_limpio}."

    doc_ref.update({"datos_jugadores": mapa})
    return {"mensaje": mensaje, "estado_actual": mapa}

@router.post("/registrar-trago")
def registrar_trago(datos: RegistrarTragoInput):
    doc_ref = db.collection('partidas_laputa').document(datos.id_sala)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
        
    partida = doc.to_dict()
    
    # Limpiamos el nombre del perdedor
    perdedor_limpio = datos.perdedor.strip().title()
    
    if perdedor_limpio not in partida['datos_jugadores']:
         raise HTTPException(status_code=400, detail=f"El jugador {perdedor_limpio} no está en la partida")
    
    cadena_de_borrachos = calcular_cadena_tragos(perdedor_limpio, partida['datos_jugadores'])
    
    return {
        "mensaje": f"Perdió {perdedor_limpio}.",
        "toman": cadena_de_borrachos,
        "cantidad_afectados": len(cadena_de_borrachos)
    }