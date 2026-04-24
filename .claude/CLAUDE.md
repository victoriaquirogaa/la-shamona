# La Shamona — Instrucciones para Claude Code

## 📋 Descripción del Proyecto

**La Shamona** es una app de juegos para beber (drinking games), diseñada como app híbrida (web + móvil Android/iOS) usando **Capacitor**. Los usuarios pueden jugar juegos de previa en modo offline o crear salas online en tiempo real.

---

## 🏗️ Arquitectura General

```
la-shamona/
├── frontend/          ← App React + Vite + Capacitor (TypeScript)
├── backend/           ← API FastAPI (Python)
├── docs/              ← Documentación del proyecto
└── capacitor.config.json
```

### Frontend (`frontend/`)
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Estilos**: TailwindCSS 4 + Bootstrap 5 + CSS custom (`App.css`)
- **Plataforma nativa**: Capacitor 8 (Android/iOS)
- **Auth**: Firebase Auth (Google, Email, Anónimo)
- **DB tiempo real**: Firebase Firestore
- **Monetización**: AdMob (banners) + RevenueCat (suscripciones)

### Backend (`backend/`)
- **Framework**: FastAPI (Python)
- **Base de datos**: Firebase Firestore (acceso directo)
- **Routers**: Un archivo por juego en `backend/routers/`

---

## 📁 Estructura Frontend

```
frontend/src/
├── App.tsx              ← Router principal (switch manual con estado `vista`)
├── App.css              ← Estilos globales
├── main.tsx             ← Entry point
├── types.ts             ← Tipos TypeScript (Cocktail, AppScreen)
├── constants.ts         ← Constantes de la app
├── screens/             ← Pantallas principales
│   ├── Welcome.tsx      ← Login (Google, Email, Anónimo)
│   ├── Home.tsx         ← Menú principal
│   ├── MenuOffline.tsx  ← Selector de juegos offline
│   ├── MenuOnline.tsx   ← Lobby online (crear/unirse a salas)
│   ├── Store.tsx        ← Tienda de suscripciones
│   ├── Bebidas.tsx      ← Recetas de tragos
│   ├── LaJefa.tsx       ← Juego "La Jefa" (offline)
│   ├── LaJefaOnline.tsx ← Juego "La Jefa" (online)
│   ├── Peaje.tsx        ← Juego "Peaje"
│   ├── JuegoSimple.tsx  ← Juego genérico (yo-nunca, preguntas, votación)
│   ├── Impostor.tsx     ← Juego "Impostor" (offline)
│   ├── ImpostorOnline.tsx ← Juego "Impostor" (online)
│   ├── PiramideOnline.tsx ← Juego "Pirámide" (online)
│   └── VotacionOnline.tsx ← Juego "Votación" (online)
├── components/          ← Componentes reutilizables
│   ├── TopBar.tsx       ← Barra superior unificada (título, back, avatar)
│   ├── CocktailCard.tsx
│   ├── CommentsOverlay.tsx
│   ├── FavoritesView.tsx
│   ├── ModalCanje.tsx
│   ├── RecipeDetail.tsx
│   └── TopView.tsx
├── context/             ← Contextos React
│   ├── AuthContext.tsx   ← Autenticación (Google nativo + web, email, anónimo)
│   ├── SoundContext.tsx  ← Sonido y vibración
│   └── SubscriptionContext.tsx ← Suscripciones RevenueCat
└── lib/                 ← Utilidades
    ├── api.ts           ← Cliente HTTP para el backend FastAPI
    ├── firebase.ts      ← Config Firebase (app, db, auth)
    ├── AdMobUtils.ts    ← Helpers de publicidad
    ├── BillingUtils.ts  ← Helpers de facturación
    └── global.d.ts      ← Declaraciones TypeScript globales
```

---

## 🧭 Navegación

La app **NO usa React Router**. Usa un sistema manual de navegación con `useState`:

```tsx
const [vista, setVista] = useState("home");
// setVista("menu-offline") → cambia de pantalla
```

Cada pantalla recibe una prop `volver` o `irA` para navegar.

---

## 🎮 Juegos Disponibles

| Juego | Offline | Online | Archivo |
|-------|---------|--------|---------|
| Yo Nunca | ✅ | ❌ | `JuegoSimple.tsx` (juego="yo-nunca") |
| Preguntas | ✅ | ❌ | `JuegoSimple.tsx` (juego="preguntas") |
| Votación | ✅ | ✅ | `JuegoSimple.tsx` / `VotacionOnline.tsx` |
| La Jefa | ✅ | ✅ | `LaJefa.tsx` / `LaJefaOnline.tsx` |
| Impostor | ✅ | ✅ | `Impostor.tsx` / `ImpostorOnline.tsx` |
| Peaje | ✅ | ❌ | `Peaje.tsx` |
| Pirámide | ❌ | ✅ | `PiramideOnline.tsx` |

---

## 🔑 Convenciones de Código

### General
- Idioma del código: **Español** (nombres de variables, comentarios, UI)
- Los comentarios usan emojis para indicar importancia (🚨, 👇, 💎, 📱, etc.)
- Las props se definen con interfaces TypeScript
- Lazy loading para pantallas secundarias con `React.lazy()`

### Componente TopBar
Todas las pantallas usan el componente `TopBar` para la barra superior:
```tsx
<TopBar titulo="Nombre" icono="🎮" color="#66fcf1" onVolver={volver} />
```

### Contextos
- `useAuth()` → usuario, login, logout, avatar
- `useSubscription()` → plan premium, sinAnuncios
- Siempre usar `Capacitor.isNativePlatform()` para diferenciar web vs móvil

### API Backend
- Todas las llamadas al backend pasan por `lib/api.ts`
- El backend corre en FastAPI con prefix por juego: `/juegos/yo-nunca`, `/impostor`, etc.
- CORS configurado con regex para cualquier origen

---

## 🛠️ Comandos Útiles

```bash
# Frontend - Desarrollo
cd frontend && npm run dev

# Frontend - Build para producción
cd frontend && npm run build

# Backend - Iniciar servidor
cd backend && uvicorn main:app --reload

# Capacitor - Sincronizar con Android
cd frontend && npx cap sync android

# Capacitor - Abrir Android Studio
cd frontend && npx cap open android
```

---

## ⚠️ Notas Importantes

1. **Firebase keys están en el código** (`firebase.ts`). No son secretas (son client-side) pero tenerlo en cuenta.
2. **El package.json de la raíz NO es el principal**. El frontend tiene su propio `package.json` en `frontend/`.
3. **No usar React Router** — mantener el sistema de navegación con `useState`.
4. **Capacitor 8** — Asegurar compatibilidad con plugins nativos al agregar dependencias.
5. **Bootstrap + Tailwind coexisten** — No remover ninguno, ambos se usan.
6. **AdMob está en modo testing** — Los IDs de anuncios son de prueba.
