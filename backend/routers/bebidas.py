# backend/routers/bebidas.py
from fastapi import APIRouter, HTTPException
from google.cloud import firestore
from database import conectar_firebase

router = APIRouter()
db = conectar_firebase()


@router.get("")
def listar_bebidas():
    """
    Devuelve bebidas activas
    """
    try:
        docs = (
            db.collection("bebidas")
            .where("activo", "==", True)
            .stream()
        )

        out = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            out.append(data)

        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{bebida_id}/like-toggle")
def like_toggle(bebida_id: str, body: dict):
    """
    Toggle like por usuario.
    body = { uid: string }
    """
    uid = body.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="UID requerido")

    ref = db.collection("bebidas").document(bebida_id)

    @firestore.transactional
    def txn(transaction: firestore.Transaction):
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Bebida no encontrada")

        data = snap.to_dict() or {}

        likes = int(data.get("likes", 0))
        likes_por_usuario = data.get("likes_por_usuario", {})

        if likes_por_usuario.get(uid):
            # 🔴 Ya tenía like → lo sacamos
            likes_por_usuario.pop(uid, None)
            likes = max(likes - 1, 0)
            liked = False
        else:
            # 🟢 No tenía like → lo sumamos
            likes_por_usuario[uid] = True
            likes += 1
            liked = True

        transaction.update(ref, {
            "likes": likes,
            "likes_por_usuario": likes_por_usuario
        })

        return {
            "id": bebida_id,
            "likes": likes,
            "liked": liked
        }

    try:
        transaction = db.transaction()
        return txn(transaction)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
