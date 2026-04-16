# Proyecto: Card Game Mobile App

## Estructura del Proyecto
- `/frontend`: Aplicación móvil (React Native/Expo o Flutter).
- `/backend`: API y lógica de juegos (Node.js/Python).
- `/docs`: Documentación técnica y reglas de juegos.

## Comandos de Desarrollo
### Frontend
- Instalar: `cd frontend && npm install`
- Ejecutar: `cd frontend && npm start`
- Test: `cd frontend && npm test`

### Backend
- Instalar: `cd backend && npm install`
- Ejecutar: `cd backend && npm run dev`
- Test: `cd backend && npm test`

## Reglas de Estilo y Código
- **Arquitectura**: Basada en servicios en el backend y componentes funcionales en el frontend.
- **Estado**: Gestión de estado centralizada para las partidas de cartas.
- **Nomenclatura**: CamelCase para variables y PascalCase para componentes/clases.
- **Tipado**: Uso estricto de tipos (TypeScript/Type Hints) para evitar errores en la lógica de las cartas.

## Lógica de Juegos
- Todos los juegos de cartas deben heredar de la clase base o interfaz `BaseGame`.
- La validación de jugadas se hace exclusivamente en el backend.