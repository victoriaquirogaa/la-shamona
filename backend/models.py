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