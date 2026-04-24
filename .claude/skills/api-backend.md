# Skill: Agregar un endpoint al backend y conectarlo al frontend

## Cuándo usar
Cuando se necesite agregar una nueva funcionalidad que requiera comunicación frontend-backend.

## Pasos

### Backend

1. **Crear o editar router** en `backend/routers/nombre.py`:
   ```python
   @router.post("/accion")
   def hacer_accion(datos: dict):
       # Validar datos
       # Ejecutar lógica
       # Retornar respuesta
       return {"status": "ok", "resultado": ...}
   ```
2. Si es un router nuevo, **registrarlo** en `backend/main.py`.

### Frontend

3. **Agregar función en `frontend/src/lib/api.ts`**:
   ```typescript
   async nombreAccion(datos: any) {
     const res = await fetch(`${BASE}/juegos/nombre/accion`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(datos),
     });
     if (!res.ok) throw new Error("Error en nombreAccion");
     return res.json();
   },
   ```
4. **Llamar desde la pantalla** usando `api.nombreAccion(datos)`.

## Reglas
- Siempre incluir manejo de errores (try/catch)
- El backend usa FastAPI con type hints de Python
- El frontend usa `fetch` directo (NO axios)
- CORS ya está configurado para cualquier origen
- La URL base del backend está definida en `api.ts`
