from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Usuario(BaseModel):
    id: Optional[str] = None
    nombre: str
    es_premium: bool = False

class JuegoCarta(BaseModel):
    texto: str
    tipo: str # "reto", "verdad", "shot"

class PartidaLaPuta(BaseModel):
    jugadores: List[str]      # Ej: ["Yo", "Tu", "El"]
    turno_index: int = 0      # 0, 1, 2...
    ultima_carta: Optional[dict] = None
    sentido_horario: bool = True  # Por si sale un 8 y cambia la ronda (opcional)