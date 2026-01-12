import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime

# Conexión
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred) # Descomentar si es necesario
db = firestore.client()

# Simulamos un ID de usuario (esto te lo da Firebase Auth en la app real)
user_id = "usuario_prueba_gaston"

# Referencia a la colección 'users'
user_ref = db.collection("users").document(user_id)

# Datos del usuario
user_data = {
    "created_at": datetime.now(),
    "email": "test@gmail.com", # Puede ser null si es anónimo
    "is_anonymous": False,
    
    # ACÁ ESTÁ LA PLATA 💰
    # Controlamos qué compró y qué no
    "purchases": {
        "premium_toxicos": False,   # Si pagó el pack Tóxicos
        "premium_impostor": False,  # Si pagó packs del impostor
        "premium_yonunca": True     # Imaginemos que compró este
    },

    # Consumibles (por si querés vender "fichas" para saltar anuncios)
    "tokens": 10,

    # Estadísticas (Opcional, para que vos veas qué onda)
    "stats": {
        "partidas_jugadas": 5,
        "anuncios_vistos": 12
    }
}

user_ref.set(user_data, merge=True)
print(f"Usuario {user_id} creado/actualizado con estructura de compras.")