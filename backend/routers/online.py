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
    categoria_id: str = None # <--- NUEVO CAMPO OPCIONAL

class ReportarTragoInput(BaseModel):
    codigo: str
    victima: str

class AsignarPutaInput(BaseModel):
    codigo: str
    dueno: str
    esclavo: str

class VotoEncuestaInput(BaseModel):
    codigo: str
    votante: str
    opcion: str

class AccionPiramideInput(BaseModel):
    codigo: str
    nombre: str = ""
    apuesta: str = ""

class VoltearInput(BaseModel):
    id_sala: str

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

def generar_mazo_piramide():
    # Mazo español: 1 al 12 x 4 palos
    mazo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] * 4
    random.shuffle(mazo)
    return mazo

def preparar_piramide(jugadores):
    mazo = generar_mazo_piramide()
    datos_jugadores = {j: {"cartas": [], "tragos": 0} for j in jugadores}
    
    return {
        "jugadores": jugadores,
        "datos_jugadores": datos_jugadores,
        "mazo": mazo,
        "fase": "RECOLECCION",
        "ronda_actual": 1,
        "turno_jugador_idx": 0,
        "piramide_cartas": {},
        "piramide_estado": {"fila": 0, "col": 0},
        "mensaje": f"Ronda 1: {jugadores[0]}, ¿Par o Impar?"
    }

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

# --- AGREGAR ESTO EN FUNCIONES AUXILIARES ---
def preparar_partida_impostor(jugadores, categoria_id=None):
    # 1. Buscamos palabras (Reutilizamos lógica o fallback simple para no romper)
    try:
        coleccion = db.collection('categorias_impostor')
        if categoria_id:
            doc = coleccion.document(categoria_id).get()
            data = doc.to_dict() if doc.exists else None
        else:
            # Si es aleatoria
            docs = list(coleccion.stream())
            if docs:
                data = random.choice(docs).to_dict()
            else:
                data = None
        
        if data:
            titulo = data.get('titulo', 'General')
            palabras = data.get('palabras', [])
        else:
            # Fallback por si la BD falla
            titulo = "General"
            palabras = ["Pizza", "Superman", "Guitarra", "Playa", "Messi"]

    except Exception as e:
        print(f"Error cargando categorias: {e}")
        titulo = "Error"
        palabras = ["Error"]

    # 2. Elegimos
    palabra = random.choice(palabras)
    impostor = random.choice(jugadores)

    # 3. Retornamos la estructura lista para guardar
    return {
        "categoria": titulo,
        "palabra_secreta": palabra,
        "impostor": impostor,
        "votos": {} # Para la fase de votación si la agregamos después
    }

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
    host_limpio = datos.nombre_host.strip().title() # Forzamos Mayúscula al entrar
    
    # 3. CREAMOS LA SALA CON FECHA (Timestamp)
    nueva_sala = {
        "host": host_limpio,
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

    nombre_limpio = datos.nombre_jugador.strip().title() # Forzamos Mayúscula al entrar
    
    if nombre_limpio not in sala['jugadores']:
        sala['jugadores'].append(nombre_limpio)
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
    print(f"\n🚀 INICIANDO: {datos.juego}") # Log limpio
    
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists: raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    sala = doc.to_dict()
    jugadores = sala.get('jugadores', [])

    datos_juego = {}
    
    # --- 1. IMPOSTOR ---
    if datos.juego == 'impostor':
        # Para probar solo, comentamos la restricción. 
        # DESCOMENTAR CUANDO TERMINES DE PROBAR:
        # if len(jugadores) < 3: raise HTTPException(status_code=400, detail="Faltan jugadores")
        datos_juego = preparar_partida_impostor(jugadores, datos.categoria_id)

    # --- 2. VOTACIÓN (Rico/Pobre y Probable) ---
    elif datos.juego == 'rico_pobre' or datos.juego == 'probable':
        # ¡ELIMINAMOS LAS RESTRICCIONES DE CANTIDAD PARA QUE NO DE ERROR 400!
        print("   - Preparando votación (Modo Prueba)...")
        datos_juego = preparar_partida_votacion(datos.juego, jugadores)

    elif datos.juego == 'piramide':
        datos_juego = preparar_piramide(jugadores)
        fase = "JUGANDO"

    # --- 3. GUARDADO ---
    doc_ref.update({
        "estado": "jugando",
        "juego_actual": datos.juego,
        "datos_juego": datos_juego,
        "fase": "VOTACION"
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

# --- PEGAR AL FINAL DE backend/routers/online.py ---

class VotoInput(BaseModel):
    codigo: str
    votante: str
    acusado: str

@router.post("/votar")
def emitir_voto(datos: VotoInput):
    # 1. Limpieza de nombres
    votante_limpio = datos.votante.strip().title()
    acusado_limpio = datos.acusado.strip().title()

    print(f"\n📩 VOTO ENTRANTE: {votante_limpio} -> {acusado_limpio}")

    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    sala = doc.to_dict()
    datos_juego = sala.get('datos_juego', {})
    eliminados = datos_juego.get('eliminados', [])
    
    # 2. Obtener lista de vivos (sin duplicados)
    raw_players = [j for j in sala['jugadores'] if j not in eliminados]
    jugadores_vivos = list(set([j.strip().title() for j in raw_players]))
    
    if votante_limpio not in jugadores_vivos:
        print(f"⚠️ Rechazado: {votante_limpio} no está vivo.")
        return {"ok": False, "error": "No estás vivo"}

    # --- 3. GUARDADO BLINDADO (La Solución) ---
    # En lugar de reescribir todo 'votos', actualizamos SOLO el campo de este jugador.
    # Esto evita que se borren votos si dos personas votan rápido.
    
    # Primero guardamos este voto específico
    doc_ref.update({
        f"datos_juego.votos.{votante_limpio}": acusado_limpio
    })
    
    # --- 4. LEEMOS DE NUEVO PARA VER EL TOTAL REAL ---
    # (Como acabamos de escribir, leemos de nuevo para tener la foto completa)
    doc_actualizado = doc_ref.get().to_dict()
    votos_actuales = doc_actualizado['datos_juego'].get('votos', {})
    
    cantidad_votos = len(votos_actuales)
    total_vivos = len(jugadores_vivos)
    
    print(f"📊 ESTADO ACTUAL: {cantidad_votos}/{total_vivos} votos.")
    print(f"   - Votos registrados: {list(votos_actuales.keys())}")

    # --- 5. VERIFICAR FIN DE RONDA ---
    if cantidad_votos >= total_vivos:
        print("✅ ¡RONDA TERMINADA! Calculando eliminado...")
        
        conteo = {}
        for ac in votos_actuales.values():
            conteo[ac] = conteo.get(ac, 0) + 1
            
        eliminado = max(conteo, key=conteo.get)
        eliminados.append(eliminado)
        
        # Chequear ganador
        impostor = datos_juego['impostor']
        nuevos_vivos = [j for j in sala['jugadores'] if j not in eliminados]
        ganador = None
        mensaje = ""
        
        if eliminado == impostor:
            ganador = "CIUDADANOS"
            mensaje = f"¡Atraparon al Impostor! Era {impostor}."
        elif len(nuevos_vivos) <= 2:
            ganador = "IMPOSTOR"
            mensaje = "¡El Impostor ganó! Quedan 2 personas."
            
        doc_ref.update({
            "datos_juego.eliminados": eliminados,
            "fase": "RESULTADO_VOTACION" if not ganador else "FIN_PARTIDA",
            "datos_juego.ultimo_eliminado": eliminado,
            "datos_juego.ganador": ganador,
            "datos_juego.mensaje_final": mensaje
        })
        return {"ok": True, "estado": "RONDA_FINALIZADA"}
    
    return {
        "ok": True, 
        "estado": "VOTO_GUARDADO", 
        "faltan": [j for j in jugadores_vivos if j not in votos_actuales]
    }

class FaseInput(BaseModel):
    codigo: str
    fase: str

@router.post("/cambiar-fase")
def cambiar_fase(datos: FaseInput):
    print(f"🔄 CAMBIANDO FASE: Sala {datos.codigo} -> {datos.fase}")
    
    doc_ref = db.collection('salas_online').document(datos.codigo)
    
    # Preparamos la actualización
    update_data = {"fase": datos.fase}
    
    # Si volvemos a RONDA (al reiniciar o seguir jugando), limpiamos los votos
    if datos.fase == "RONDA":
         update_data["datos_juego.votos"] = {}
         
    doc_ref.update(update_data)
    return {"ok": True}

# --- FUNCIÓN ACTUALIZADA: Acepta el nombre del campo ---
def obtener_pregunta_config(nombre_documento, nombre_campo):
    try:
        doc_ref = db.collection('configuracion_juegos').document(nombre_documento)
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"⚠️ Documento '{nombre_documento}' no existe.")
            return "Error: Falta configuración"
            
        data = doc.to_dict()
        
        # Leemos el campo específico que nos pidas ('frases' o 'preguntas')
        lista = data.get(nombre_campo, [])
        
        if not lista:
            print(f"⚠️ El campo '{nombre_campo}' está vacío en '{nombre_documento}'")
            return f"Error: Lista '{nombre_campo}' vacía"
            
        import random
        return random.choice(lista)

    except Exception as e:
        print(f"Error DB: {e}")
        return "Error técnico"

# --- FUNCIÓN DE PREPARACIÓN ---
def preparar_partida_votacion(modo, jugadores):
    pregunta = "Error"
    opciones = []
    titulo = ""

    if modo == 'rico_pobre':
        # Rico/Pobre usa el campo 'frases'
        pregunta = obtener_pregunta_config('rico_pobre', 'frases')
        opciones = ["Muy de Rico", "Muy de Pobre"]
        titulo = "Muy de Rico o Muy de Pobre"
    
    elif modo == 'probable':
        # Probable usa el documento 'votacion' y el campo 'preguntas'
        pregunta = obtener_pregunta_config('votacion', 'preguntas')
        opciones = jugadores 
        titulo = "¿Quién es más probable que...?"
    
    return {
        "modo": modo, 
        "titulo": titulo,
        "consigna": pregunta, 
        "opciones": opciones,
        "votos": {},       
        "resultados": {},
        "terminado": False
    }

@router.post("/votar-encuesta")
def votar_encuesta(datos: VotoEncuestaInput):
    print(f"📩 Voto Encuesta: {datos.votante} -> {datos.opcion}")
    
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    if not doc.exists: raise HTTPException(status_code=404, detail="Sala no existe")
    
    # Guardamos el voto de este jugador
    doc_ref.update({
        f"datos_juego.votos.{datos.votante}": datos.opcion
    })
    
    # Leemos para ver si ya votaron todos
    sala_actualizada = doc_ref.get().to_dict()
    votos = sala_actualizada['datos_juego'].get('votos', {})
    jugadores = sala_actualizada.get('jugadores', [])
    
    if len(votos) >= len(jugadores):
        print("🏁 Encuesta terminada. Calculando resultados...")
        conteo = {}
        # Inicializamos los contadores con las opciones disponibles
        opciones = sala_actualizada['datos_juego'].get('opciones', [])
        for op in opciones: conteo[op] = 0
            
        # Contamos los votos reales
        for v in votos.values():
            conteo[v] = conteo.get(v, 0) + 1
            
        # Marcamos como terminado para que el Frontend muestre los gráficos
        doc_ref.update({
            "datos_juego.terminado": True,
            "datos_juego.resultados": conteo
        })
        
    return {"ok": True}

@router.post("/terminar")
def terminar_juego(datos: IniciarJuegoInput):
    # Validamos que exista la sala
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    if not doc.exists: return {"ok": False}
    
    # Reseteamos la sala al estado de Lobby
    doc_ref.update({
        "estado": "esperando",     # Vuelve al lobby
        "juego_actual": None,      # Limpia el juego
        "fase": None,
        "datos_juego": {},          # Borra los votos/cartas
        "turno_actual": None
    })
    return {"ok": True}

class PiramideApostar(BaseModel):
    codigo: str
    nombre: str
    apuesta: str

# --- EN EL BACKEND (online.py) ---

@router.post("/piramide/apostar")
def piramide_apostar(datos: AccionPiramideInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    partida = sala['datos_juego']
    jugadores = sala['jugadores']
    
    # Identificamos quién está jugando
    idx_actual = partida['turno_jugador_idx']
    nombre_jugador = jugadores[idx_actual]
    
    # 1. Sacar carta
    mazo = partida['mazo']
    if not mazo: mazo = [i for i in range(1, 13)] * 4
    carta_nueva = mazo.pop()
    
    # --- LÓGICA DE APUESTA (Ejemplo rápido) ---
    cartas_jugador = partida['datos_jugadores'][nombre_jugador]['cartas']
    beber = False
    mensaje_resultado = ""
    ronda = partida['ronda_actual']

    if ronda == 1: # Par/Impar
        gano = (carta_nueva % 2 == 0) == (datos.apuesta == "par")
    elif ronda == 2: # Mayor/Menor
        gano = (carta_nueva > cartas_jugador[0]) if datos.apuesta == "mayor" else (carta_nueva < cartas_jugador[0])
    else: # Adentro/Afuera
        gano = (min(cartas_jugador) <= carta_nueva <= max(cartas_jugador)) == (datos.apuesta == "adentro")

    mensaje_resultado = "¡Acertaste!" if gano else "Pifiaste. ¡TOMÁS!"
    beber = not gano

    # 🚨 CRUCIAL: GUARDAR LA CARTA EN LA MANO DEL JUGADOR
    partida['datos_jugadores'][nombre_jugador]['cartas'].append(carta_nueva)

    # 2. Avanzar turno y ronda
    partida['turno_jugador_idx'] += 1
    if partida['turno_jugador_idx'] >= len(jugadores):
        partida['turno_jugador_idx'] = 0
        partida['ronda_actual'] += 1
    
    # 3. Actualizar mensaje y fase
    r = partida['ronda_actual']
    if r <= 3:
        prox = jugadores[partida['turno_jugador_idx']]
        msgs = {1: "¿Par o Impar?", 2: "¿Mayor, Menor o Igual?", 3: "¿Adentro o Afuera?"}
        partida['mensaje'] = f"Ronda {r}: {prox}, {msgs[r]}"
    else:
        partida['fase'] = "PIRAMIDE"
        partida['mensaje'] = "¡A repartir!"
        if not partida.get('piramide_cartas'):
            partida['piramide_cartas'] = {str(i): [mazo.pop() for _ in range(t)] for i, t in enumerate([5,4,3,2,1])}

    doc_ref.update({"datos_juego": partida})
    
    return {
        "carta_salio": carta_nueva,       # Evita el 'undefined'
        "mensaje_resultado": mensaje_resultado,
        "beber": beber
    }

@router.post("/piramide/voltear")
def piramide_voltear(datos: AccionPiramideInput):
    # 1. Buscamos la sala en la colección correcta
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
        
    partida = sala['datos_juego']
    
    # 2. Obtenemos posición actual y la carta
    f_idx = partida['piramide_estado']['fila']
    c_idx = partida['piramide_estado']['col']
    
    # Validamos que no hayamos terminado
    if f_idx > 4:
        return {"terminado": True}
        
    carta_revelada = partida['piramide_cartas'][str(f_idx)][c_idx]
    
    # 3. Calculamos quién toma (Consecuencias)
    reglas = [
        {"b": 3, "a": "TOMÁ"},    # Fila 0
        {"b": 3, "a": "REPARTÍ"}, # Fila 1
        {"b": 5, "a": "TOMÁ"},    # Fila 2
        {"b": 5, "a": "REPARTÍ"}, # Fila 3
        {"b": 7, "a": "TOMÁ"}     # Fila 4
    ]
    regla = reglas[f_idx]
    consecuencias = []
    
    for jugador, info in partida['datos_jugadores'].items():
        cant = info['cartas'].count(carta_revelada)
        if cant > 0:
            consecuencias.append({
                "jugador": jugador,
                "accion": regla["a"],
                "cantidad": regla["b"] * cant,
                "motivo": f"Tiene {cant} {'vez' if cant==1 else 'veces'} el {carta_revelada}"
            })

    # 4. 🚨 CLAVE: Guardamos la acción para que todos la vean
    partida['ultima_revelacion'] = {
        "id_accion": f"f{f_idx}c{c_idx}", # ID único para que el Front sepa que es una nueva carta
        "carta": carta_revelada,
        "consecuencias": consecuencias
    }

    # 5. Avanzamos el puntero de la pirámide
    c_idx += 1
    if c_idx >= len(partida['piramide_cartas'][str(f_idx)]):
        c_idx = 0
        f_idx += 1
        
    partida['piramide_estado'] = {"fila": f_idx, "col": c_idx}
    partida['terminado'] = f_idx > 4
    
    # 6. Actualizamos Firebase
    doc_ref.update({"datos_juego": partida})
    
    return {"status": "ok"}

@router.post("/finalizar")
def finalizar_juego(datos: AccionPiramideInput):
    # Conectamos a la sala
    doc_ref = db.collection('salas_online').document(datos.codigo)
    
    # Limpiamos el juego actual y volvemos al estado de espera
    doc_ref.update({
        "juego": None,
        "datos_juego": None,
        "estado": "esperando" # Esto hace que aparezcan de nuevo los botones de juegos
    })
    
    return {"status": "ok", "mensaje": "Juego finalizado"}