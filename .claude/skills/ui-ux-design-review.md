---
name: ui-ux-design-review
description: Audita y mejora el diseño visual, UX y UI de interfaces en React, React Native/Expo, HTML/CSS y artifacts. Úsala siempre que el usuario comparta un componente, pantalla o archivo de estilos y pida feedback de diseño, mencione que algo no se ve bien, pida mejorar el diseño, hacerlo más lindo, profesional o moderno, o cuando comparta una captura o código y hable de colores, tipografía, espaciado, animaciones, accesibilidad o consistencia visual. También activar proactivamente cuando el usuario comparta código de UI sin tema específico pero con señales de que está iterando sobre el look and feel (ajustes de estilos, dudas sobre paleta, preguntas sobre si algo se ve raro). Flujo de tres pasos — auditar primero, mostrar reporte estructurado, aplicar cambios solo con aprobación explícita.
---

# UI/UX Design Review

Esta skill convierte a Claude en un revisor de diseño que audita interfaces y propone mejoras concretas antes de tocar código. El foco está en **paleta única y coherente, jerarquía visual, espaciado, microinteracciones y accesibilidad** — los cinco pilares que más impacto tienen en la percepción de calidad de una app.

## Cuándo activar

Activá la skill cuando se cumpla cualquiera de estos casos:

- El usuario comparte código de UI (JSX, TSX, StyleSheet, CSS, Tailwind, styled-components) y pide feedback.
- Menciona palabras como "diseño", "UI", "UX", "look", "estética", "se ve feo/raro/aburrido", "moderno", "profesional", "paleta", "colores", "animaciones".
- Pide "mejorar", "pulir", "refinar" una pantalla o componente.
- Comparte una captura de pantalla de su app y habla de cómo mejorarla.
- Está trabajando en Faculty Manager, apps educativas, pastelería, o cualquier proyecto suyo donde la UI sea protagonista.

## Flujo de trabajo

El flujo es **siempre el mismo**: auditar → reportar → aprobar → aplicar. No saltear pasos, incluso si el usuario parece apurado — la aprobación explícita evita que rompas un diseño que ya funciona.

### 1. Auditar

Antes de escribir una sola línea de código nuevo, leé lo que te pasaron y detectá problemas en estos ejes. Si algo no aplica a ese fragmento, saltearlo sin forzar.

**Paleta de colores**
- Contar cuántos colores distintos aparecen. Si hay más de ~5 tonos sin sistema, es una señal de alerta.
- Detectar colores "sueltos" (hex hardcodeados repartidos por el archivo) que deberían vivir en un objeto `colors` o variables CSS.
- Verificar que haya una lógica: primario, secundario, neutro (fondos/textos), semánticos (éxito/error/warning).
- Contraste: texto sobre fondo debería cumplir WCAG AA (4.5:1 para texto normal).

**Tipografía y jerarquía**
- ¿Hay más de 2-3 familias tipográficas? Usualmente es exceso.
- ¿Los tamaños siguen una escala (12, 14, 16, 20, 24, 32…) o son arbitrarios?
- ¿El peso (`fontWeight`) diferencia títulos de cuerpo de manera clara?
- ¿Hay un `lineHeight` razonable (1.4–1.6 para cuerpo)?

**Espaciado y layout**
- ¿Los márgenes/padding siguen una escala (4, 8, 12, 16, 24, 32)?
- ¿Hay aire suficiente entre elementos o está todo apretado?
- ¿Los elementos están alineados a una grilla mental coherente?
- En mobile (React Native): ¿se respeta safe area, hay padding horizontal consistente?

**Microinteracciones y animaciones**
- ¿Los botones tienen feedback al presionarse (`activeOpacity`, `Pressable` con scale, hover en web)?
- ¿Las transiciones de pantalla/modal son instantáneas (choque visual) o animadas?
- ¿Hay estados de carga (skeletons, spinners) o sólo aparece contenido de golpe?
- ¿Listas largas tienen animación de entrada escalonada?

**Accesibilidad**
- Contraste de color (mencionado arriba).
- Tamaños de toque mínimos (44x44 pt en iOS, 48x48 dp en Android).
- Labels en inputs, `accessibilityLabel` en React Native.
- Texto no debería estar a menos de 12-14px.

**Consistencia y componentes**
- ¿Hay botones con estilos distintos a lo largo del mismo archivo? Señal para extraer un componente.
- ¿Los bordes, radios y sombras son consistentes?

### 2. Reportar

Presentá el resultado de la auditoría como un reporte estructurado. **No uses viñetas sueltas** — agrupar por eje y priorizar por impacto. Formato sugerido:

```
## Auditoría de diseño

### 🎨 Paleta — [estado: OK / mejorable / crítico]
[observaciones concretas con ejemplos del código]

### 🔤 Tipografía
[...]

### 📐 Espaciado
[...]

### ✨ Animaciones
[...]

### ♿ Accesibilidad
[...]

### 🧩 Consistencia
[...]

## Propuesta de mejoras

**Prioridad alta** (mayor impacto visual):
1. [mejora concreta con el antes/después]
2. ...

**Prioridad media**:
...

**Nice-to-have** (animaciones, pulido):
...
```

Al final del reporte preguntá explícitamente: **"¿Aplico estos cambios? Puedo hacer todos, solo los de prioridad alta, o los que elijas."**

### 3. Aplicar

Solo después de una respuesta afirmativa del usuario, aplicá los cambios. Reglas al aplicar:

- **Centralizar la paleta**: extraer colores a un objeto `theme.colors` / `constants/colors.ts` / variables CSS. No hardcodear hex en los componentes.
- **Mantener la identidad existente**: si el proyecto ya tiene una onda (dark mode en La Shamona), respetarla — mejorar no es reescribir.
- **Explicar qué cambió antes de mostrar el código**.
- **Mostrar diff conceptual** cuando el archivo sea largo: "modifiqué X, Y, Z" antes del bloque completo.
- **Usar tokens, no magic numbers**: `spacing.md` en vez de `16`, `colors.primary` en vez de `#3B82F6`.

## Paleta de La Shamona (referencia)

```
primario     #66fcf1  (cyan/turquesa)
fondo        #111 / #1a1a2e / #0f0f23
superficie   #1a1a2e
texto        #ffffff
texto suave  #cccccc
tema         dark mode siempre
```

## Animaciones: qué sugerir y cuándo

- **Siempre sugerir** animar: aparición de modales, feedback de tap en botones, cambios de pantalla, skeletons en listas que cargan desde Firebase, check de tarea completada.
- **A veces sugerir**: animación de entrada escalonada en listas (stagger), parallax sutil en headers con scroll, transiciones compartidas entre pantallas.
- **Rara vez sugerir**: animaciones decorativas que no responden a acción del usuario, loops infinitos, partículas.
- **Duraciones**: 150-250ms para microinteracciones, 300-400ms para transiciones de pantalla. Más que eso se siente lento.

### Patrones de animación web (React + CSS)

**Feedback de hover y tap:**
```css
.button {
  transition: transform 150ms ease, background-color 150ms ease;
}
.button:hover { background-color: var(--primary-hover); }
.button:active { transform: scale(0.98); }
```

**Keyframes para entrada:**
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeInUp 300ms ease-out both; }
```

**Respetar preferencias del sistema:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Curvas de ease recomendadas

- **`ease-out`** — default para entrada. Se siente natural.
- **`ease-in`** — para salidas.
- **`ease-in-out`** — para cambios de estado (expandir/contraer).
- **`cubic-bezier(0.16, 1, 0.3, 1)`** — "ease-out-expo", se siente premium.
- **Evitar** `linear` para casi todo menos progress bars.

### Duraciones de referencia

| Tipo | Duración |
|---|---|
| Hover, tap, toggle | 100–150ms |
| Aparición de elementos pequeños | 200–300ms |
| Transición de pantalla / modal | 300–400ms |
| Stagger entre items de lista | 30–60ms de delay |

## Antipatrones frecuentes

- Más de 3 familias tipográficas en una pantalla.
- Usar `#000` puro para texto (preferir `#18181B`/`#1F2937`).
- Usar `#FFF` puro para fondos de app móvil (preferir `#FAFAFA`/`#F9FAFB`).
- Botones sin feedback visual al presionar.
- `marginTop` + `marginBottom` mezclados sin sistema.
- Sombras random que no siguen una escala de elevación.
- Textos con `opacity: 0.5` en vez de un color de texto secundario real.
- **Paletas paralelas compitiendo**: config de Tailwind + variables CSS + hex hardcodeados.
- **Clases de animación referenciadas pero no definidas**: `animate-in`, `fade-in` usadas en JSX sin CSS definido.
- **Stacks de estilos mezclados sin criterio**: Bootstrap + Tailwind + inline styles en el mismo componente.

## Cuando NO auditar a ciegas

Si el usuario comparte un fragmento muy chico (5-10 líneas), preguntá si querés ver más contexto antes de auditar.

Si el usuario ya dio restricciones claras ("tiene que ser azul", "usa los colores del logo"), respetar y auditar dentro de ese marco.
