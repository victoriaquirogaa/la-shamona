from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random
import string
from datetime import datetime, timedelta, timezone # <--- AGREGAR ESTO
from google.cloud.firestore import FieldFilter
from typing import Optional
from firebase_admin import firestore

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

# --- Agregá esto junto a los otros modelos en online.py ---

class VotoInput(BaseModel):
    codigo: str
    votante: str
    acusado: str

class FaseInput(BaseModel):
    codigo: str
    fase: str

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

# --- FUNCIÓN AUXILIAR (La que maneja el MIX) ---
# Pegá esto ANTES de @router.post("/crear")
def obtener_datos_categoria(cat_id=None):
    coleccion_ref = db.collection('categorias_impostor')

    # A. CASO ESPECÍFICO (Ej: "comida")
    if cat_id and cat_id != "mix":
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        data = doc.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)
    
    # B. CASO MIX / ALEATORIO
    else:
        # Traemos todas las categorías
        docs = list(coleccion_ref.stream())
        
        if not docs:
            # Fallback por si la BD está vacía
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        
        # Elegimos una al azar
        doc_elegido = random.choice(docs)
        data = doc_elegido.to_dict()
        
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)

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
    print(f"\n🚀 INICIANDO: {datos.juego}") 
    
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists: raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    sala = doc.to_dict()
    jugadores = sala.get('jugadores', [])

    datos_juego = {}
    fase_inicial = "INICIO" # Variable para controlar la fase según el juego
    
    # --- 1. IMPOSTOR ---
    if datos.juego == 'impostor':
        datos_juego = preparar_partida_impostor(jugadores, datos.categoria_id)
        fase_inicial = "RONDA"

    # --- 2. VOTACIÓN (Rico/Pobre y Probable) ---
    elif datos.juego == 'rico_pobre' or datos.juego == 'probable':
        print("   - Preparando votación...")
        datos_juego = preparar_partida_votacion(datos.juego, jugadores)
        fase_inicial = "VOTACION"

    # --- 3. PIRÁMIDE ---
    elif datos.juego == 'piramide':
        datos_juego = preparar_piramide(jugadores)
        fase_inicial = "RECOLECCION"

    # --- 4. LA JEFA (ESTO ES LO QUE FALTABA) ---
    elif datos.juego == 'la-jefa':
        print("   - Barajando cartas para La Jefa...")
        mazo = crear_mazo_nuevo() # Usamos la función auxiliar que ya tenés arriba
        datos_juego = {
            "mazo": mazo,
            "carta_actual": None,
            "mascotas": {},
            "resultado_trago": None,
            "turno_actual": jugadores[0] if jugadores else None,
            "fase": "ESPERANDO"
        }
        fase_inicial = "ESPERANDO"

    # --- 5. GUARDADO ---
    doc_ref.update({
        "estado": "jugando",
        "juego_actual": datos.juego,
        "datos_juego": datos_juego,
        "turno_actual": jugadores[0] if jugadores else None, # Aseguramos el turno en la raíz también
        "fase": fase_inicial # Usamos la variable dinámica, no "VOTACION" fijo
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

@router.post("/votar")
def emitir_voto(datos: VotoInput):
    # 1. Limpieza y Validación Básica
    votante_limpio = datos.votante.strip().title()
    acusado_limpio = datos.acusado.strip().title()

    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    sala = doc.to_dict()
    datos_juego = sala.get('datos_juego', {})
    eliminados = datos_juego.get('eliminados', [])
    
    if votante_limpio in eliminados:
        return {"ok": False, "error": "No estás vivo"}

    # 2. GUARDAR EL VOTO
    doc_ref.update({
        f"datos_juego.votos.{votante_limpio}": acusado_limpio
    })
    
    # --- 🔎 LÓGICA DE CIERRE AUTOMÁTICO 🔎 ---
    sala_actualizada = doc_ref.get().to_dict()
    votos_actuales = sala_actualizada['datos_juego'].get('votos', {})
    
    # Calculamos vivos
    jugadores_totales = sala_actualizada['jugadores']
    cantidad_vivos = len(jugadores_totales) - len(eliminados)
    
    # SI VOTARON TODOS LOS VIVOS...
    if len(votos_actuales) >= cantidad_vivos:
        print("⚡ ¡Todos votaron! Calculando resultados...")
        
        # A. CONTAR VOTOS
        conteo = {}
        for votante, acusado in votos_actuales.items():
            if acusado:
                conteo[acusado] = conteo.get(acusado, 0) + 1
        
        if not conteo: return {"ok": True, "estado": "VOTOS_VACIOS"}
        
        # B. OBTENER EL NÚMERO MÁS ALTO DE VOTOS
        max_votos = max(conteo.values())
        
        # C. BUSCAR *TODOS* LOS QUE TENGAN ESE MÁXIMO (Aquí estaba el error antes)
        los_mas_votados = [jugador for jugador, cant in conteo.items() if cant == max_votos]

        # --- D. RESOLVER EMPATE O ELIMINACIÓN ---
        
        # CASO 1: EMPATE (Más de 1 persona tiene el máximo)
        if len(los_mas_votados) > 1:
            nombres = ", ".join(los_mas_votados)
            doc_ref.update({
                "datos_juego.votos": {}, # Borramos votos
                # 👇 ESTE MENSAJE ES EL QUE LEERÁ TU FRONTEND
                "datos_juego.mensaje_sistema": f"¡EMPATE entre {nombres}! Nadie se va. Voten de nuevo.",
                "fase": "VOTACION" 
            })
            return {"ok": True, "estado": "EMPATE"}
            
        # CASO 2: HAY UN SOLO ELIMINADO
        else:
            eliminado = los_mas_votados[0]
            impostor_real = datos_juego.get('impostor')
            era_impostor = (eliminado == impostor_real)
            
            nuevo_estado_juego = "jugando"
            ganador = None
            mensaje_final = None
            
            if era_impostor:
                nuevo_estado_juego = "finalizado"
                ganador = "CIUDADANOS"
                mensaje_final = f"¡Atraparon al Impostor! Era {eliminado}."
            else:
                vivos_restantes = cantidad_vivos - 1
                if vivos_restantes <= 2:
                    nuevo_estado_juego = "finalizado"
                    ganador = "IMPOSTOR"
                    mensaje_final = f"El Impostor ({impostor_real}) gana por mayoría."
            
            update_data = {
                "datos_juego.ultimo_eliminado": eliminado,
                "datos_juego.es_impostor_eliminado": era_impostor,
                "datos_juego.votos": {}, 
                "datos_juego.eliminados": firestore.ArrayUnion([eliminado])
            }

            if nuevo_estado_juego == "finalizado":
                update_data["estado"] = "finalizado"
                update_data["fase"] = "FIN_PARTIDA"
                update_data["datos_juego.ganador"] = ganador
                update_data["datos_juego.mensaje_final"] = mensaje_final
            else:
                update_data["fase"] = "RESULTADO_VOTACION" 

            doc_ref.update(update_data)
            return {"ok": True, "estado": "ELIMINADO", "jugador": eliminado}

    return {"ok": True, "estado": "VOTO_GUARDADO"}

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
    # 1. PRIMERO obtenemos la sala y definimos 'partida'
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    partida = sala['datos_juego']
    jugadores = sala['jugadores']

    # 2. AHORA podemos chequear el mazo porque 'partida' ya existe
    if len(partida['mazo']) < 10:
        import random
        partida['mazo'] = [i for i in range(1, 13)] * 4
        random.shuffle(partida['mazo'])
    
    # Identificamos quién está jugando
    idx_actual = partida['turno_jugador_idx']
    nombre_jugador = jugadores[idx_actual]
    
    # Sacar carta
    mazo = partida['mazo']
    carta_nueva = mazo.pop()
    
    # Lógica de apuesta
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

    # Guardar carta en la mano
    partida['datos_jugadores'][nombre_jugador]['cartas'].append(carta_nueva)

    # Avanzar turno y ronda
    partida['turno_jugador_idx'] += 1
    if partida['turno_jugador_idx'] >= len(jugadores):
        partida['turno_jugador_idx'] = 0
        partida['ronda_actual'] += 1
    
    # Actualizar mensaje y fase
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
        "carta_salio": carta_nueva,
        "mensaje_resultado": mensaje_resultado,
        "beber": beber
    }

@router.post("/piramide/voltear")
def piramide_voltear(datos: AccionPiramideInput):
    # 1. Buscamos la sala y definimos 'partida'
    doc_ref = db.collection('salas_online').document(datos.codigo)
    sala = doc_ref.get().to_dict()
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    partida = sala['datos_juego']

    # 2. Chequeo del mazo (con 'partida' ya definida)
    if len(partida['mazo']) < 10:
        import random
        partida['mazo'] = [i for i in range(1, 13)] * 4
        random.shuffle(partida['mazo'])
    
    # Obtenemos posición actual y la carta
    f_idx = partida['piramide_estado']['fila']
    c_idx = partida['piramide_estado']['col']
    
    if f_idx > 4:
        return {"terminado": True}
        
    carta_revelada = partida['piramide_cartas'][str(f_idx)][c_idx]
    
    # Consecuencias
    reglas = [{"b": 3, "a": "TOMÁ"}, {"b": 3, "a": "REPARTÍ"}, {"b": 5, "a": "TOMÁ"}, {"b": 5, "a": "REPARTÍ"}, {"b": 7, "a": "TOMÁ"}]
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

    # Guardamos la acción para que todos la vean
    partida['ultima_revelacion'] = {
        "id_accion": f"f{f_idx}c{c_idx}",
        "carta": carta_revelada,
        "consecuencias": consecuencias
    }

    # Avanzamos el puntero
    c_idx += 1
    if c_idx >= len(partida['piramide_cartas'][str(f_idx)]):
        c_idx = 0
        f_idx += 1
        
    partida['piramide_estado'] = {"fila": f_idx, "col": c_idx}
    partida['terminado'] = f_idx > 4
    
    doc_ref.update({"datos_juego": partida})
    return {"status": "ok"}

@router.post("/finalizar")
def finalizar_juego(datos: AccionPiramideInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc_ref.update({
        "juego": None,
        "datos_juego": None,
        "estado": "esperando"
    })
    return {"status": "ok", "mensaje": "Juego finalizado"}

