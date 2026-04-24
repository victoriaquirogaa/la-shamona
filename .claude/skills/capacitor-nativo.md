# Skill: Trabajar con funcionalidades nativas (Capacitor)

## Cuándo usar
Cuando se necesite usar funcionalidades del dispositivo (cámara, vibración, notificaciones, etc.) o diferenciar comportamiento web vs móvil.

## Detectar plataforma
```tsx
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Estamos en Android/iOS
} else {
  // Estamos en navegador web
}
```

## Plugins ya instalados
- `@capacitor/core` — Core de Capacitor
- `@capacitor/android` / `@capacitor/ios` — Plataformas
- `@capacitor/haptics` — Vibración
- `@capacitor-community/admob` — Publicidad (banners)
- `@codetrix-studio/capacitor-google-auth` — Login Google nativo
- `@revenuecat/purchases-capacitor` — Suscripciones/compras
- `capacitor-plugin-app-tracking-transparency` — Tracking iOS (ATT)

## Flujo para agregar un plugin nuevo
1. `cd frontend && npm install @capacitor/plugin-name`
2. `npx cap sync android` (y/o `ios`)
3. Importar y usar en el código con detección de plataforma
4. Si requiere permisos Android, editar `android/app/src/main/AndroidManifest.xml`

## Reglas
- SIEMPRE envolver llamadas nativas en `try/catch`
- SIEMPRE verificar `Capacitor.isNativePlatform()` antes de usar plugins nativos
- Los plugins nativos NO funcionan en el navegador web
- Después de instalar plugins, ejecutar `npx cap sync`
