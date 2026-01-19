from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db
from firebase_admin import firestore # 👈 Necesario para agregar eliminados a la lista
import random
from routers.usuarios import verificar_acceso_usuario 

router = APIRouter()

# --- MODELOS ---

class IniciarJuegoInput(BaseModel):
    codigo: str
    categoria_id: Optional[str] = "mix"
    device_id: Optional[str] = "invitado"
    es_usuario_premium: bool = False # 👈 NUEVO

class CrearPartidaLocalInput(BaseModel):
    jugadores: list[str]
    categoria_id: Optional[str] = "mix"
    device_id: Optional[str] = "invitado_offline"
    tiene_permiso: bool = False # Salvoconducto para categoría específica (Video)
    es_usuario_premium: bool = False # 👈 NUEVO: Para saber si filtramos el Mix

# 👇 NUEVO MODELO PARA CERRAR VOTACIÓN
class CerrarVotacionInput(BaseModel):
    codigo: str

# --- HELPER: LÓGICA DEL MIX ---
def obtener_datos_categoria(cat_id=None):
    coleccion_ref = db.collection('categorias_impostor')

    if cat_id and cat_id != "mix":
        doc = coleccion_ref.document(cat_id).get()
        if not doc.exists:
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        data = doc.to_dict()
        return data.get('titulo', 'General'), data.get('palabras', []), data.get('es_premium', False)
    else:
        # LÓGICA MIX (Por defecto sin filtro, usada por otros endpoints si hiciera falta)
        docs = list(coleccion_ref.stream())
        if not docs:
            return "General", ["Pizza", "Superman", "Guitarra", "Playa", "Messi"], False
        
        todas_palabras = []
        for doc in docs:
            d = doc.to_dict()
            todas_palabras.extend(d.get('palabras', []))
            
        return "ALEATORIA (MIX)", todas_palabras, False

# --- ENDPOINTS ---

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

@router.post("/iniciar")
def iniciar_juego_online(datos: IniciarJuegoInput):
    # A. Buscar la sala
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")

    sala = doc.to_dict()
    jugadores = sala.get('jugadores', [])

    if len(jugadores) < 3:
        raise HTTPException(status_code=400, detail="Faltan jugadores (mínimo 3)")

    # B. Preparar variables para palabras
    lista_palabras = []
    titulo_cat = ""

    # C. LÓGICA DE SELECCIÓN DE PALABRAS
    
    # --- OPCIÓN 1: MIX (Mezclar todo) ---
    if datos.categoria_id == "mix" or not datos.categoria_id:
        titulo_cat = "ALEATORIA (MIX)"
        
        # Traer todas las categorías de la base de datos
        docs = db.collection('categorias_impostor').stream()
        
        for doc in docs:
            d = doc.to_dict()
            es_cat_premium = d.get("es_premium", False)
            
            # 🛑 FILTRO DE JUSTICIA:
            # Si la categoría es VIP y el usuario NO es Premium real -> La saltamos
            if es_cat_premium and not datos.es_usuario_premium:
                continue 
            
            # Si pasa el filtro, agregamos sus palabras a la bolsa
            lista_palabras.extend(d.get('palabras', []))

    # --- OPCIÓN 2: CATEGORÍA ESPECÍFICA ---
    else:
        # Usamos el helper que ya tenés definido arriba en tu archivo
        titulo_cat, palabras_cat, es_premium = obtener_datos_categoria(datos.categoria_id)
        
        # Validación de seguridad extra (aunque el frontend ya bloquea)
        if es_premium:
            # Permitimos si es usuario premium O si el device_id tiene permiso (legacy)
            if not datos.es_usuario_premium and not verificar_acceso_usuario(datos.device_id):
                 raise HTTPException(status_code=403, detail="Categoría Premium bloqueada.")
        
        lista_palabras = palabras_cat

    # D. Validación final (por si el filtro vació todo o la DB está vacía)
    if not lista_palabras:
        raise HTTPException(status_code=500, detail="No hay palabras disponibles para jugar.")

    # E. Mecánica del Juego (Elegir impostor y palabra)
    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores)

    datos_partida = {
        "impostor": impostor,
        "palabra_secreta": palabra_secreta,
        "categoria": titulo_cat,
        "eliminados": [],
        "ultimo_eliminado": None,
        "ganador": None,
        "mensaje_final": None,
        "mensaje_sistema": None, 
        "votos": {}
    }

    # F. Guardar en Firestore
    doc_ref.update({
        "estado": "jugando",
        "juego_actual": "impostor",
        "fase": "RONDA",
        "datos_juego": datos_partida
    })

    return {"mensaje": "Juego iniciado", "categoria": titulo_cat}

@router.post("/crear-local")
def crear_partida_local(datos: CrearPartidaLocalInput):
    if len(datos.jugadores) < 3:
        raise HTTPException(status_code=400, detail="Se necesitan mínimo 3 jugadores")

    jugadores_limpios = [j.strip().title() for j in datos.jugadores]
    
    lista_palabras = []
    titulo_cat = ""

    # 👇 CASO 1: MIX (ACÁ FILTRAMOS LO VIP) 👇
    if not datos.categoria_id or datos.categoria_id == "mix":
        titulo_cat = "ALEATORIA (MIX)"
        
        docs = db.collection('categorias_impostor').stream()
        for doc in docs:
            d = doc.to_dict()
            es_cat_premium = d.get("es_premium", False)

            # 🛑 FILTRO DE JUSTICIA:
            # Si la categoría es Premium y el usuario NO lo es -> LA SALTAMOS
            if es_cat_premium and not datos.es_usuario_premium:
                continue 
            
            lista_palabras.extend(d.get('palabras', []))
    
    # 👇 CASO 2: CATEGORÍA ESPECÍFICA 👇
    else:
        titulo_cat, lista_palabras, es_premium = obtener_datos_categoria(datos.categoria_id)
        
        # Validación de seguridad estricta para categorías individuales
        if es_premium and not datos.tiene_permiso:
            print(f"⛔ Acceso denegado a {datos.categoria_id} - Sin permiso")
            raise HTTPException(status_code=403, detail="Requiere Premium o Video")

    if not lista_palabras:
         # Fallback por si filtró todo
         return {"modo": "error", "mensaje": "No hay palabras disponibles (o son todas premium)."}

    palabra_secreta = random.choice(lista_palabras)
    impostor = random.choice(jugadores_limpios)
    
    roles_asignados = []
    for jugador in jugadores_limpios:
        if jugador == impostor:
            mision = {"nombre": jugador, "rol": "IMPOSTOR", "palabra": "???"}
        else:
            mision = {"nombre": jugador, "rol": "CIUDADANO", "palabra": palabra_secreta}
        roles_asignados.append(mision)
        
    return { "modo": "pasamanos", "categoria": titulo_cat, "distribucion": roles_asignados }

@router.get("/{codigo_sala}/mi-mision")
def obtener_mision(codigo_sala: str, nombre_jugador: str):
    doc = db.collection('salas_online').document(codigo_sala).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada.")
    
    sala = doc.to_dict()
    if sala.get('juego_actual') != 'impostor':
         raise HTTPException(status_code=400, detail="No se está jugando al Impostor.")

    datos_juego = sala.get('datos_juego', {})
    nombre_limpio = nombre_jugador.strip().title()
    
    if nombre_limpio not in sala.get('jugadores', []):
         raise HTTPException(status_code=403, detail="No estás en la sala.")

    palabra = datos_juego.get('palabra_secreta')
    impostor = datos_juego.get('impostor')

    if impostor == nombre_limpio:
        return {"rol": "IMPOSTOR", "descripcion": "Engaña a todos.", "palabra": "???"}
    else:
        return {"rol": "CIUDADANO", "descripcion": f"Palabra: {palabra}", "palabra": palabra}


@router.post("/cerrar-votacion")
def cerrar_votacion(datos: CerrarVotacionInput):
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
        
    sala = doc.to_dict()
    datos_juego = sala.get('datos_juego', {})
    votos = datos_juego.get('votos', {}) 

    # 1. Validar si hay votos
    if not votos:
         return {"mensaje": "Nadie votó"}

    # 2. Contar Votos
    conteo = {}
    for votante, acusado in votos.items():
        if acusado: # Ignorar votos nulos
            conteo[acusado] = conteo.get(acusado, 0) + 1
            
    if not conteo:
        return {"mensaje": "Votos vacíos"}

    # 3. Buscar Máximo y Empates
    max_votos = max(conteo.values())
    los_mas_votados = [jugador for jugador, cant in conteo.items() if cant == max_votos]
    
    # --- ⚖️ LÓGICA DE EMPATE ⚖️ ---
    if len(los_mas_votados) > 1:
        # Caso: Empate (Ej: Juan 1, Pedro 1)
        doc_ref.update({
            "datos_juego.votos": {}, # Borramos votos para reiniciar
            "datos_juego.mensaje_sistema": f"¡EMPATE entre {', '.join(los_mas_votados)}! Discutan y voten de nuevo.",
            "fase": "VOTACION" # Mantenemos la fase para que no cambie de pantalla
        })
        return {"resultado": "empate", "empatados": los_mas_votados}

    # --- ☠️ LÓGICA DE ELIMINACIÓN ☠️ ---
    else:
        eliminado = los_mas_votados[0]
        impostor_real = datos_juego.get('impostor')
        era_impostor = (eliminado == impostor_real)
        
        nuevo_estado_juego = "jugando"
        ganador = None
        mensaje_final = None
        
        if era_impostor:
            # Ganaron Ciudadanos
            nuevo_estado_juego = "finalizado"
            ganador = "CIUDADANOS"
            mensaje_final = f"¡Atraparon al Impostor! Era {eliminado}."
        else:
            # Eliminaron inocente, chequeamos si termina el juego
            jugadores_totales = sala['jugadores']
            eliminados_previos = datos_juego.get('eliminados', [])
            
            # Cantidad de vivos contando al que se acaba de ir
            cantidad_vivos_ahora = len(jugadores_totales) - len(eliminados_previos) - 1
            
            # Si quedan 2 personas (1 Impostor + 1 Ciudadano), gana Impostor
            if cantidad_vivos_ahora <= 2:
                nuevo_estado_juego = "finalizado"
                ganador = "IMPOSTOR"
                mensaje_final = f"El Impostor ({impostor_real}) gana por mayoría."
        
        # Preparamos la actualización
        update_data = {
            "datos_juego.ultimo_eliminado": eliminado,
            "datos_juego.es_impostor_eliminado": era_impostor,
            "datos_juego.votos": {}, # Limpiamos votos
            "datos_juego.eliminados": firestore.ArrayUnion([eliminado]) # Lo agregamos a la lista negra
        }

        if nuevo_estado_juego == "finalizado":
            update_data["estado"] = "finalizado"
            update_data["fase"] = "FIN_PARTIDA"
            update_data["datos_juego.ganador"] = ganador
            update_data["datos_juego.mensaje_final"] = mensaje_final
        else:
            # Si sigue jugando, mostramos quién se fue y su rol
            update_data["fase"] = "RESULTADO_VOTACION" 

        doc_ref.update(update_data)
        
        return {"resultado": "eliminado", "jugador": eliminado}
    
# --- MODELO PARA EL VOTO ---
class VotoInput(BaseModel):
    codigo: str
    votante: str
    acusado: str

# --- ENDPOINT: EMITIR VOTO ---
@router.post("/votar")
def emitir_voto(datos: VotoInput):
    # 1. Buscamos la sala
    doc_ref = db.collection('salas_online').document(datos.codigo)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    sala = doc.to_dict()
    datos_juego = sala.get('datos_juego', {})
    eliminados = datos_juego.get('eliminados', [])
    
    # 2. Validamos que el votante esté VIVO
    votante_limpio = datos.votante.strip().title()
    if votante_limpio in eliminados:
         return {"mensaje": "Los muertos no votan 💀"}

    # 3. Guardamos el voto (Solo actualizamos ese campo)
    # Usamos notación de punto para no sobrescribir todo el objeto
    doc_ref.update({
        f"datos_juego.votos.{votante_limpio}": datos.acusado
    })
    
    return {"mensaje": "Voto registrado"}