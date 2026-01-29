from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos tus routers
from routers import yo_nunca, votacion, preguntas, la_puta, peaje, piramide, impostor, online, usuarios, bebidas


app = FastAPI()

# --- CORS (CONFIGURACIÓN CORRECTA) ---
# 🚨 IMPORTANTE: Si allow_credentials es True, NO podés usar ["*"].
# Tenés que poner las URLs exactas de tu frontend.
origins = [
    "http://localhost:5173",    # Frontend accediendo como localhost
    "http://127.0.0.1:5173",    # Frontend accediendo como IP
]

app.add_middleware(
    CORSMiddleware,
    # El truco: Usar regex para permitir CUALQUIER origen http/https
    allow_origin_regex="https?://.*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONECTAR LOS ROUTERS ---
app.include_router(yo_nunca.router, prefix="/juegos/yo-nunca", tags=["Yo Nunca"])
app.include_router(la_puta.router, prefix="/juegos/la-puta", tags=["La Puta"])
app.include_router(impostor.router, prefix="/impostor", tags=["impostor"]) 
app.include_router(peaje.router, prefix="/juegos/peaje", tags=["Peaje"])
app.include_router(piramide.router, prefix="/juegos/piramide", tags=["Piramide"])
app.include_router(votacion.router, prefix="/juegos/votacion", tags=["Votacion"])
app.include_router(preguntas.router, prefix="/juegos/preguntas", tags=["Preguntas"])
app.include_router(online.router, prefix="/juegos/online", tags=["Modo Online"])
app.include_router(bebidas.router, prefix="/bebidas", tags=["Bebidas"])

# USUARIOS
app.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"]) 

@app.get("/")
def home():
    return {"estado": "Backend Modular Operativo 🚀", "cors": "FIXED"}