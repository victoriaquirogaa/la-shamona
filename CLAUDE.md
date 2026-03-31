# Instrucciones
- Responde siempre en español
- Haz las preguntas de confirmación en español
# Instrucciones para Claude Code

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

## 🔒 Seguridad
- **Nunca hardcodees** credenciales, API keys o contraseñas en el código
- Usá variables de entorno (.env) para datos sensibles
- Si encontrás una vulnerabilidad de seguridad, reportala inmediatamente

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

