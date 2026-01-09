import firebase_admin
from firebase_admin import credentials, firestore

# Variable global para la base de datos
db = None

def conectar_firebase():
    global db
    if not firebase_admin._apps:
        # Asegurate que el archivo json esté en la carpeta backend
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("🔥 Firebase Conectado desde database.py")
    return db

# Inicializamos de una vez para que esté lista
conectar_firebase()