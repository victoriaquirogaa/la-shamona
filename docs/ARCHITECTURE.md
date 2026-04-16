# Arquitectura de Comunicación

## Flujo de Datos
1. El **Frontend** envía la acción del jugador (ej: `playCard`) vía Socket.io/REST.
2. El **Backend** valida la acción contra el estado actual en la base de datos/memoria.
3. El **Backend** emite el nuevo estado a todos los jugadores en la sala.

## Seguridad de Red
- Autenticación vía JWT en cada petición.
- Validación de esquemas con Zod/Pydantic antes de procesar cualquier jugada.