from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import db
from datetime import datetime, timedelta

# 1. Create Router
router = APIRouter()

# --- MODELOS ---
class RegistroInput(BaseModel):
    device_id: str

class CanjeInput(BaseModel):
    device_id: str
    codigo: str

class NombreUpdate(BaseModel):
    nombre: str

# --- 1. REGISTRO DE USUARIO NUEVO ---
@router.post("/registrar")
def registrar_usuario(datos: RegistroInput):
    doc_ref = db.collection('usuarios').document(datos.device_id)
    doc = doc_ref.get()

    if not doc.exists:
        nuevo_usuario = {
            "fecha_registro": datetime.now().isoformat(),
            "es_premium": False,       # True solo si pagó con plata (RevenueCat)
            "es_amigo": False,         # True si usó código
            "vencimiento_codigo": None # Para códigos temporales (vacaciones)
        }
        doc_ref.set(nuevo_usuario)
        return {"mensaje": "Usuario registrado", "estado": "free"}
    
    return {"mensaje": "Usuario ya existía", "estado": "ok"}

# --- 2. CANJE DE CÓDIGOS (Desde BD) ---
@router.post("/canjear-codigo")
def canjear_codigo(datos: CanjeInput):
    # 1. Normalizamos el código
    codigo_limpio = datos.codigo.strip().upper()
    
    print(f"🔍 Canjeando: {codigo_limpio} para User: {datos.device_id}")

    # 2. BUSCAR EL CÓDIGO
    doc_ref = db.collection('codigos_promocionales').document(codigo_limpio)
    doc = doc_ref.get()

    # ERROR 404: El código ni siquiera existe en la base de datos
    if not doc.exists:
        raise HTTPException(status_code=404, detail="El código no existe. Revisá si lo escribiste bien.")

    info_codigo = doc.to_dict()

    # 3. VALIDACIONES DE SEGURIDAD

    # A. ¿Está activo manualmente?
    if not info_codigo.get('activo', True):
        raise HTTPException(status_code=400, detail="Este código fue desactivado manualmente.")

    # B. ¿El usuario YA lo usó? (Para que no sume días infinitos)
    usados = info_codigo.get('usado_por', [])
    if datos.device_id in usados:
        # ERROR 400: Ya lo usó antes.
        raise HTTPException(status_code=400, detail="¡Ya canjeaste este código! No seas codicioso 🐀")

    # C. ¿QUEDAN USOS DISPONIBLES? (STOCK)
    stock = info_codigo.get('usos_restantes')
    
    if stock is not None and stock <= 0:
        raise HTTPException(status_code=400, detail="¡Uh! Este código ya alcanzó el límite de usos 😢")

    # 4. TODO OK -> PROCESAR PREMIO
    dias_a_sumar = info_codigo.get('dias_premio', 0)
    
    ahora = datetime.now()
    user_ref = db.collection('usuarios').document(datos.device_id)
    user_doc = user_ref.get()
    
    nueva_fecha_vencimiento = ahora + timedelta(days=dias_a_sumar)

    if user_doc.exists:
        user_data = user_doc.to_dict()
        vencimiento_actual_str = user_data.get('vencimiento_codigo')
        if vencimiento_actual_str:
            try:
                vencimiento_actual = datetime.fromisoformat(vencimiento_actual_str)
                if vencimiento_actual > ahora:
                    nueva_fecha_vencimiento = vencimiento_actual + timedelta(days=dias_a_sumar)
            except:
                pass

    # 5. GUARDAR Y DESCONTAR STOCK
    try:
        # A. Actualizar Usuario
        user_ref.set({
            "es_amigo": True,
            "vencimiento_codigo": nueva_fecha_vencimiento.isoformat()
        }, merge=True)

        # B. Actualizar Código (Agregar usuario a lista Y restar 1 al stock)
        updates = {
            "usado_por": usados + [datos.device_id]
        }
        
        # Si tenía stock limitado, restamos 1
        if stock is not None:
            updates["usos_restantes"] = stock - 1

        doc_ref.update(updates)

        return {
            "mensaje": f"¡Éxito! Tenés VIP por {dias_a_sumar} días. Quedan {stock - 1 if stock else 'infinitos'} usos.",
            "nuevo_vencimiento": nueva_fecha_vencimiento.isoformat()
        }
    except Exception as e:
        print(f"Error critico DB: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar el premio.")

# --- 3. WEBHOOK REVENUECAT (Pagos Reales) ---
@router.post("/webhook-revenuecat")
async def recibir_aviso_pago(request: Request):
    """
    RevenueCat llama a esto cuando alguien paga en Google/Apple.
    """
    datos = await request.json()
    evento = datos.get('event', {})
    tipo = evento.get('type') # INITIAL_PURCHASE, EXPIRATION, etc.
    usuario_id = evento.get('app_user_id') # Tu device_id
    
    doc_ref = db.collection('usuarios').document(usuario_id)
    
    if tipo in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"]:
        # El usuario pagó -> Es Premium Real
        print(f"💰 Venta: {usuario_id}")
        doc_ref.set({"es_premium": True}, merge=True)
        
    elif tipo == "EXPIRATION":
        # Se le venció el tiempo pago
        print(f"⌛ Expiró: {usuario_id}")
        doc_ref.update({"es_premium": False})
        
    return {"status": "ok"}

# --- 4. CONSULTA DE PERMISOS (El Cerebro) ---
@router.get("/{device_id}/permisos")
def consultar_permisos(device_id: str):
    doc = db.collection('usuarios').document(device_id).get()
    
    es_premium_real = False   # El que puso tarjeta
    es_amigo_activo = False   # El que usó código
    es_amigo_flag = False     # Guardamos el flag crudo para el frontend
    
    if doc.exists:
        data = doc.to_dict()
        es_premium_real = data.get("es_premium", False)
        
        # Validar si el amigo sigue vigente
        es_amigo_flag = data.get("es_amigo", False)
        vencimiento = data.get("vencimiento_codigo") 

        if es_amigo_flag:
            if vencimiento:
                try:
                    fecha_limite = datetime.fromisoformat(vencimiento)
                    if datetime.now() < fecha_limite:
                        es_amigo_activo = True
                except:
                    es_amigo_activo = False
            else:
                es_amigo_activo = True 

    # --- LÓGICA DE PODERES ---

    # 1. ¿Quién tiene acceso a Categorías VIP? (Premium + Amigos)
    acceso_vip = es_premium_real or es_amigo_activo

    # 2. ¿Quién se salva de los anuncios molestos al salir/cambiar turno? (Premium + Amigos)
    sin_anuncios = es_premium_real or es_amigo_activo

    # 3. ¿Quién tiene el Mix desbloqueado SIN ver video? (SOLO PREMIUM REAL)
    # El amigo (False) tendrá que ver video.
    mix_sin_video = es_premium_real

    return {
        "acceso_vip": acceso_vip,
        "sin_anuncios": sin_anuncios,
        "mix_sin_video": mix_sin_video,
        "es_premium": es_premium_real, # Devuelve si pagó
        "es_amigo": es_amigo_active      # Devuelve si es amigo activo (FIXED TYPO: es_amigo_activo)
    }

# --- AUXILIAR PARA IMPORTAR EN OTROS ARCHIVOS ---
def verificar_acceso_usuario(device_id: str):
    """
    Función rápida para usar dentro de impostor.py, votacion.py, etc.
    Devuelve True si tiene permiso VIP.
    """
    permisos = consultar_permisos(device_id)
    return permisos['acceso_vip'] # FIXED: changed 'puede_crear_premium' to 'acceso_vip'

# --- 5. ACTUALIZAR NOMBRE (FIXED) ---
@router.put("/{uid}/nombre") # FIXED: removed /usuarios prefix and @app -> @router
def actualizar_nombre_usuario(uid: str, datos: NombreUpdate):
    try:
        # Referencia al documento del usuario
        doc_ref = db.collection('usuarios').document(uid)
        
        # Verificamos si existe antes de actualizar
        doc = doc_ref.get()
        
        if doc.exists:
            # Si existe, solo actualizamos el nombre
            doc_ref.update({"nombre": datos.nombre})
        else:
            # 🚨 SALVAVIDAS: Si el usuario no existía (porque falló el sync antes),
            # lo creamos ahora mismo con el nombre nuevo.
            doc_ref.set({
                "uid": uid,
                "nombre": datos.nombre,
                "es_premium": False, # Valores por defecto para que no rompa nada
                "es_amigo": False
            })
            
        return {"status": "ok", "mensaje": "Nombre actualizado"}
        
    except Exception as e:
        print(f"Error actualizando nombre: {e}")
        return {"error": str(e)}, 500