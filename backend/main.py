from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONEXIÓN REAL ---
try:
    # Busca el archivo en la misma carpeta donde corre el script
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ ¡Conexión con Firebase exitosa!")
except Exception as e:
    print(f"❌ Error conectando a Firebase: {e}")

app = FastAPI()
# --- IMPORTAR EL MIDDLEWARE (Agrégalo arriba con los otros imports) ---
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CONFIGURACIÓN DE CORS (El Puente) ---
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <--- EL CAMBIO CLAVE: El asterisco libera todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"estado": "online", "mensaje": "Si ves esto, el servidor corre"}

@app.get("/prueba-db")
def prueba_db():
    # Esto va a crear un documento de prueba en tu nube
    ref = db.collection('pruebas').add({
        'mensaje': 'Hola desde Python',
        'fecha': firestore.SERVER_TIMESTAMP
    })
    return {"id_creado": ref[1].id, "status": "Guardado en Firestore"}