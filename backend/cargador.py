import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.cloud.firestore import ArrayUnion

# 1. Tu conexión (usá tu archivo json real)
cred = credentials.Certificate("serviceAccountKey.json")
#firebase_admin.initialize_app(cred) # Descomentá si hace falta inicializar
db = firestore.client()

# Estas son para calentar motores sin ser +18 explícito.
frases_gratis = [
    
]

# --- LISTA 2: YO NUNCA HOT 🔥 (Premium / +18 Fuerte) ---
# Acá vamos directo a los bifes.
frases_hot = [
    
]

# --- CARGA A FIRESTORE ---

# 1. Cargar Gratis
ref_gratis = db.collection("mazos").document("yo_nunca_gratis")
ref_gratis.update({
    "frases": ArrayUnion(frases_gratis)
})
print(f"✅ Se agregaron {len(frases_gratis)} frases al mazo GRATIS.")

# 2. Cargar Hot
ref_hot = db.collection("mazos").document("yo_nunca_hot")
ref_hot.update({
    "frases": ArrayUnion(frases_hot)
})
print(f"🔥 Se agregaron {len(frases_hot)} frases al mazo HOT (Premium).")

#3. cargar bebidas

