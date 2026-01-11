from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import db
from datetime import datetime, timedelta

router = APIRouter()

# --- MODELOS ---
class RegistroInput(BaseModel):
    device_id: str

class CanjeInput(BaseModel):
    device_id: str
    codigo: str

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
    # Limpieza: " vicky " -> "VICKY"
    codigo_limpio = datos.codigo.strip().upper()
    
    # A. Buscamos el código en Firestore
    cod_ref = db.collection('codigos_promo').document(codigo_limpio)
    cod_doc = cod_ref.get()
    
    if not cod_doc.exists:
        raise HTTPException(status_code=404, detail="Código inválido.")
    
    info_codigo = cod_doc.to_dict()
    
    # B. Validaciones de Stock y Estado
    if not info_codigo.get('activo', True):
        raise HTTPException(status_code=400, detail="Este código fue desactivado.")
        
    usos = info_codigo.get('usos_restantes', 0)
    if usos == 0: 
        raise HTTPException(status_code=400, detail="Este código ya se agotó.")

    # C. Calcular Vencimiento (Si es temporal)
    # En la BD, el código puede tener "dias_duracion": 7. Si no tiene, es eterno.
    dias = info_codigo.get('dias_duracion', None) 
    fecha_vencimiento = None
    
    mensaje_exito = "¡Código Amigo activado para siempre!"
    
    if dias:
        # Si es un pase de vacaciones, sumamos los días a HOY
        fecha_obj = datetime.now() + timedelta(days=dias)
        fecha_vencimiento = fecha_obj.isoformat()
        mensaje_exito = f"¡Pack activado! Válido por {dias} días."

    # D. Actualizar al Usuario
    user_ref = db.collection('usuarios').document(datos.device_id)
    updates = {
        "es_amigo": True,
        "vencimiento_codigo": fecha_vencimiento,
        "codigo_usado": codigo_limpio
    }
    user_ref.set(updates, merge=True)

    # E. Descontar Stock del Código (Si no es infinito/-1)
    if usos > 0:
        cod_ref.update({"usos_restantes": usos - 1})

    return {"mensaje": mensaje_exito, "valido_hasta": fecha_vencimiento}

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
    
    # Valores por defecto (Usuario Gratis)
    puede_crear_premium = False
    ver_anuncios = True 
    
    if doc.exists:
        data = doc.to_dict()
        es_pago = data.get("es_premium", False)
        es_amigo = data.get("es_amigo", False)
        vencimiento = data.get("vencimiento_codigo") # String ISO o None
        
        # LÓGICA 1: ¿Tiene funciones Premium?
        # A. Si pagó, siempre SÍ.
        if es_pago:
            puede_crear_premium = True
        
        # B. Si es amigo, verificamos fecha (si tiene)
        elif es_amigo:
            if vencimiento:
                # Chequear si no se venció
                ahora = datetime.now()
                fecha_limite = datetime.fromisoformat(vencimiento)
                if ahora < fecha_limite:
                    puede_crear_premium = True # Todavía vigente
                else:
                    # Se venció, volvemos a false en memoria (y podrías actualizar BD)
                    puede_crear_premium = False 
            else:
                # Si no tiene vencimiento, es amigo eterno
                puede_crear_premium = True
        
        # LÓGICA 2: ¿Ve Anuncios? (Tu regla de oro)
        if es_pago:
            ver_anuncios = False # Pagó -> No anuncios
        else:
            ver_anuncios = True  # Gratis o Amigo -> SÍ anuncios
            
    return {
        "puede_crear_premium": puede_crear_premium,
        "ver_anuncios": ver_anuncios
    }

# --- AUXILIAR PARA IMPORTAR EN OTROS ARCHIVOS ---
def verificar_acceso_usuario(device_id: str):
    """
    Función rápida para usar dentro de impostor.py, votacion.py, etc.
    Devuelve True si tiene permiso de crear/jugar premium.
    """
    permisos = consultar_permisos(device_id)
    return permisos['puede_crear_premium']