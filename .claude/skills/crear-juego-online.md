# Skill: Crear un nuevo juego online

## Cuándo usar
Cuando se necesite agregar un nuevo juego con modo online (salas en tiempo real).

## Pasos

### Backend (FastAPI)

1. **Crear router** en `backend/routers/nuevo_juego.py`:
   ```python
   from fastapi import APIRouter
   router = APIRouter()

   @router.get("/cartas")
   def obtener_cartas():
       # lógica del juego
       pass
   ```
2. **Registrar router** en `backend/main.py`:
   ```python
   from routers import nuevo_juego
   app.include_router(nuevo_juego.router, prefix="/juegos/nuevo-juego", tags=["Nuevo Juego"])
   ```

### Frontend

3. **Agregar endpoints** en `frontend/src/lib/api.ts`
4. **Crear pantalla** en `frontend/src/screens/NuevoJuegoOnline.tsx`
5. **Registrar en el router** de `App.tsx`:
   - Agregar lazy import
   - Agregar case en `renderVista()`
   - Agregar case en `handleJuegoOnlineIniciado()`
6. **Agregar opción en MenuOnline.tsx** para que aparezca en el selector de juegos

## Props del juego online
```tsx
interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string; juego: string };
  salir: () => void;      // Desconecta y vuelve al home
  volver: () => void;     // Vuelve al lobby manteniendo conexión
}
```

## Reglas
- El backend valida TODA la lógica del juego
- El frontend solo muestra y envía acciones
- Usar Firestore para el estado en tiempo real de las salas
- Siempre incluir `salir` (desconexión total) y `volver` (al lobby)
