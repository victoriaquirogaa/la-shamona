import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

bebidas = [
    {
        "nombre": "Mojito",
        "imagen_url": "https://i.imgur.com/6XHqG9n.jpg",
        "alcohol_tipo": ["Ron"],
        "graduacion": 14,
        "tiempo_min": 5,
        "dificultad": "Fácil",
        "rating": 4.8,
        "ingredientes": ["Ron", "Menta", "Azúcar", "Lima", "Soda"],
        "pasos": [
            "Macerar la menta con el azúcar y la lima",
            "Agregar hielo",
            "Añadir ron",
            "Completar con soda"
        ],
        "es_premium": False,
        "activo": True,
        "vistas": 0,
        "likes": 0
    },
    {
        "nombre": "Caipirinha",
        "imagen_url": "https://i.imgur.com/QJ2aEJ6.jpg",
        "alcohol_tipo": ["Cachaça"],
        "graduacion": 18,
        "tiempo_min": 4,
        "dificultad": "Fácil",
        "rating": 4.6,
        "ingredientes": ["Cachaça", "Lima", "Azúcar", "Hielo"],
        "pasos": [
            "Cortar la lima",
            "Agregar azúcar",
            "Macerar",
            "Agregar hielo y cachaça"
        ],
        "es_premium": False,
        "activo": True,
        "vistas": 0,
        "likes": 0
    },
    {
        "nombre": "Margarita",
        "imagen_url": "https://i.imgur.com/r6k1J0b.jpg",
        "alcohol_tipo": ["Tequila"],
        "graduacion": 20,
        "tiempo_min": 6,
        "dificultad": "Media",
        "rating": 4.7,
        "ingredientes": ["Tequila", "Triple sec", "Jugo de lima", "Sal"],
        "pasos": [
            "Escarchar el vaso con sal",
            "Mezclar tequila, triple sec y lima",
            "Agitar con hielo",
            "Servir colado"
        ],
        "es_premium": False,
        "activo": True,
        "vistas": 0,
        "likes": 0
    },
    {
        "nombre": "Old Fashioned",
        "imagen_url": "https://i.imgur.com/BB5K6iT.jpg",
        "alcohol_tipo": ["Whisky"],
        "graduacion": 32,
        "tiempo_min": 5,
        "dificultad": "Media",
        "rating": 4.9,
        "ingredientes": ["Whisky", "Azúcar", "Angostura", "Naranja"],
        "pasos": [
            "Disolver el azúcar con angostura",
            "Agregar hielo",
            "Añadir whisky",
            "Decorar con naranja"
        ],
        "es_premium": True,
        "activo": True,
        "vistas": 0,
        "likes": 0
    },
    {
        "nombre": "Negroni",
        "imagen_url": "https://i.imgur.com/Xb6g0qL.jpg",
        "alcohol_tipo": ["Gin"],
        "graduacion": 24,
        "tiempo_min": 4,
        "dificultad": "Media",
        "rating": 4.8,
        "ingredientes": ["Gin", "Vermut rojo", "Campari"],
        "pasos": [
            "Agregar hielo al vaso",
            "Añadir gin, vermut y campari",
            "Mezclar suavemente"
        ],
        "es_premium": True,
        "activo": True,
        "vistas": 0,
        "likes": 0
    }
]

print("🍹 Cargando bebidas...")

for bebida in bebidas:
    db.collection("bebidas").add(bebida)
    print(f"✔ {bebida['nombre']} cargada")

print("🚀 Carga de bebidas finalizada")
