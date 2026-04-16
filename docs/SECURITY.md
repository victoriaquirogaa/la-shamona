# Protocolos de Seguridad

## Manejo de Secretos
- **NUNCA** escribir llaves de API o credenciales en el código.
- Usar archivos `.env` (asegurarse de que estén en `.gitignore`).
- Las variables de entorno del frontend deben estar prefijadas correctamente (ej: `EXPO_PUBLIC_`).

## Prevención de Vulnerabilidades
- **Inyección**: Usar ORM/Query Builders para evitar SQL Injection.
- **Validación**: Validar que el jugador que envía la acción es el dueño de la sesión y es su turno.
- **Sanitización**: Limpiar cualquier entrada de texto para evitar ataques XSS si hay chats en los juegos.

## Reglas de Claude
- Si se detecta un hard-coded secret, advertir inmediatamente.
- Siempre sugerir validaciones de tipos y rangos para las apuestas o movimientos de cartas.