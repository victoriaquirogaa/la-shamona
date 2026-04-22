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

## 🌐 Idioma
- Responde **siempre en español**
- Las preguntas de confirmación de comandos también en español
- Los comentarios en el código pueden ser en inglés (estándar profesional)

---

## 🧠 Metodología de trabajo

### Antes de escribir código
- Entendé el problema completo antes de proponer soluciones
- Si algo no está claro, **preguntá primero** en vez de asumir
- Planificá la solución en pasos y mostrásela antes de ejecutar

### Al escribir código
- Escribí código **limpio, legible y mantenible**
- Una función = una responsabilidad (principio de responsabilidad única)
- Nombrá variables y funciones de forma descriptiva, en inglés
- Evitá duplicar lógica (principio DRY: Don't Repeat Yourself)
- Preferí soluciones simples sobre soluciones "inteligentes"
- no hagas sobreingeniería


### Al modificar código existente
- **Nunca rompas funcionalidad existente** sin avisar
- Antes de refactorizar, asegurate de entender para qué sirve el código actual
- Hacé cambios pequeños e incrementales, no rewrites masivos sin consultar

---

## 🗂️ Estructura del proyecto
- Respetá la arquitectura existente del proyecto
- Si ves que algo debería reorganizarse, **sugerilo** pero no lo hagas sin permiso
- No creés archivos o carpetas innecesarias

---

## ✅ Calidad del código
- Buscá posibles bugs o edge cases antes de terminar
- Si ves código que puede fallar (ej: falta manejo de errores), mencionalo
- Cuando hagas funciones que accedan a datos externos, siempre incluí manejo de errores

---

## 💬 Comunicación
- Al terminar una tarea, explicá brevemente qué hiciste y por qué
- Si hay más de una forma de resolver algo, presentá las opciones con pros y contras
- Si algo puede tener consecuencias importantes (borrar datos, cambios de arquitectura), **pedí confirmación antes**

---

## 🚫 Cosas que NO hacer
- No ejecutes comandos destructivos (rm -rf, drop table, etc.) sin confirmación explícita
- No instales dependencias sin consultar primero
- No hagas commits ni pushes sin permiso
- No modifiques archivos de configuración de entorno (.env, docker-compose, etc.) sin avisar