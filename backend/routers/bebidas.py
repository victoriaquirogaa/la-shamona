from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from database import db
from .usuarios import verificar_acceso_usuario

router = APIRouter()

class BebidaOut(BaseModel):
    id: str
    nombre: str
    imagen_url: Optional[str] = None
    alcohol_tipo: List[str] = []
    graduacion: Optional[float] = None
    tiempo_min: Optional[int] = None
    dificultad: Optional[str] = None
    rating: Optional[float] = None
    ingredientes: List[str] = []
    pasos: List[str] = []
    es_premium: bool = False
    activo: bool = True

def _doc_to_out(doc) -> BebidaOut:
    data = doc.to_dict() or {}
    return BebidaOut(
        id=doc.id,
        nombre=data.get("nombre", "Sin nombre"),
        imagen_url=data.get("imagen_url"),
        alcohol_tipo=data.get("alcohol_tipo", []),
        graduacion=data.get("graduacion"),
        tiempo_min=data.get("tiempo_min"),
        dificultad=data.get("dificultad"),
        rating=data.get("rating"),
        ingredientes=data.get("ingredientes", []),
        pasos=data.get("pasos", []),
        es_premium=bool(data.get("es_premium", False)),
        activo=bool(data.get("activo", True)),
    )

def _puede_ver_premium(device_id: Optional[str]) -> bool:
    return bool(device_id) and verificar_acceso_usuario(device_id)

@router.get("/list", response_model=List[BebidaOut])
def listar_bebidas(
    device_id: Optional[str] = None,
    q: Optional[str] = Query(default=None),
    alcohol: Optional[str] = Query(default=None),
    limit: int = 50
):
    limit = max(1, min(limit, 200))
    premium_ok = _puede_ver_premium(device_id)

    query_ref = db.collection("bebidas").where("activo", "==", True)

    if alcohol:
        query_ref = query_ref.where("alcohol_tipo", "array_contains", alcohol)

    docs = list(query_ref.stream())

    out: List[BebidaOut] = []
    q_norm = (q or "").strip().lower()

    for doc in docs:
        data = doc.to_dict() or {}

        if data.get("es_premium", False) and not premium_ok:
            continue

        nombre = (data.get("nombre", "") or "").lower()
        if q_norm and q_norm not in nombre:
            continue

        out.append(_doc_to_out(doc))

        if len(out) >= limit:
            break

    return out

@router.get("/top", response_model=List[BebidaOut])
def top_bebidas(device_id: Optional[str] = None, limit: int = 50):
    limit = max(1, min(limit, 200))
    premium_ok = _puede_ver_premium(device_id)

    docs = list(
        db.collection("bebidas")
        .where("activo", "==", True)
        .order_by("rating", direction="DESCENDING")
        .limit(limit)
        .stream()
    )

    out: List[BebidaOut] = []
    for doc in docs:
        data = doc.to_dict() or {}
        if data.get("es_premium", False) and not premium_ok:
            continue
        out.append(_doc_to_out(doc))

    return out

@router.get("/{bebida_id}", response_model=BebidaOut)
def obtener_bebida(bebida_id: str, device_id: Optional[str] = None):
    ref = db.collection("bebidas").document(bebida_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Bebida no encontrada")

    data = doc.to_dict() or {}
    if not data.get("activo", True):
        raise HTTPException(status_code=404, detail="Bebida no disponible")

    premium_ok = _puede_ver_premium(device_id)
    if data.get("es_premium", False) and not premium_ok:
        raise HTTPException(status_code=403, detail="Bebida premium bloqueada")

    return _doc_to_out(doc)
