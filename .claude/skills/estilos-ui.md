# Skill: Estilos y UI

## Cuándo usar
Cuando se necesite estilizar componentes o crear interfaces.

## Sistemas de estilos disponibles
La app usa **3 sistemas que coexisten** (NO remover ninguno):

1. **CSS Custom** (`frontend/src/App.css`) — Estilos principales y globales
2. **TailwindCSS 4** — Clases utilitarias inline
3. **Bootstrap 5** — Componentes y grid system (`react-bootstrap`)

## Prioridad de uso
1. Para layouts y componentes complejos → **Bootstrap** (`Container`, `Row`, `Col`, `Modal`, `Button`)
2. Para estilos rápidos/inline → **Tailwind** (`className="flex items-center gap-2"`)
3. Para estilos específicos de la app → **App.css** (con clases como `.topbar-container`, `.topbar-btn-back`)

## Paleta de colores de la app
- Fondo principal: `#111`, `#1a1a2e`, `#0f0f23`
- Acento principal: `#66fcf1` (cyan/turquesa)
- Texto: `#ffffff`, `#cccccc`
- Tema general: **Dark mode**

## Componentes de Bootstrap usados
```tsx
import { Modal, Button, Form, Container, Row, Col } from 'react-bootstrap';
```

## Reglas
- La app es **dark mode siempre** — no hay light mode
- Los gradientes y colores neón (cyan, púrpura) son parte de la identidad visual
- Usar emojis como iconos (🎮, 🍺, 👑, etc.) — no se usa una librería de iconos
- Responsive: la app se diseña mobile-first (se usa en celulares)
