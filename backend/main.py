from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importamos las piezas nuevas
from database import db 
from routers import yo_nunca
from routers import la_puta
from routers import impostor
# from routers import admin (cuando lo crees)

app = FastAPI()

# --- CORS (Seguridad) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONECTAR LOS ROUTERS ---

# 1. Juego Yo Nunca (Rutas: /juegos/yo-nunca/...)
app.include_router(yo_nunca.router, prefix="/juegos/yo-nunca", tags=["Yo Nunca"])

# 2. Juego La Puta (Rutas: /juegos/la-puta/sacar-carta)
app.include_router(la_puta.router, prefix="/juegos/la-puta", tags=["La Puta"])

# 3. Juego El impostor (Rutas: /juegos/impostor)
app.include_router(impostor.router, prefix="/juegos/impostor", tags=["Impostor"])

# 3. Admin (Futuro)
# app.include_router(admin.router, prefix="/admin", tags=["Admin"])

@app.get("/")
def home():
    return {"estado": "Backend Modular Operativo 🚀"}