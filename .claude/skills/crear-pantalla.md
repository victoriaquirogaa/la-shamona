# Skill: Crear una nueva pantalla

## Cuándo usar
Cuando se necesite agregar una nueva pantalla/vista a la app.

## Pasos

1. **Crear el archivo** en `frontend/src/screens/NombrePantalla.tsx`
2. **Exportar el componente** como named export:
   ```tsx
   export const NombrePantalla = ({ volver }: { volver: () => void }) => {
     return (
       <div>
         <TopBar titulo="Nombre" icono="🎮" color="#66fcf1" onVolver={volver} />
         {/* contenido */}
       </div>
     );
   };
   ```
3. **Agregar lazy import** en `App.tsx`:
   ```tsx
   const NombrePantalla = lazy(() => import('./screens/NombrePantalla').then(m => ({ default: m.NombrePantalla })));
   ```
4. **Agregar la ruta** en el switch de `renderVista()` en `App.tsx`:
   ```tsx
   case 'nombre-pantalla': return <NombrePantalla volver={() => setVista('home')} />;
   ```
5. **Agregar navegación** desde el menú correspondiente usando `setVista('nombre-pantalla')` o `irA('nombre-pantalla')`.

## Reglas
- Siempre usar el componente `TopBar` para la barra superior
- Siempre recibir `volver` como prop para navegación
- Usar lazy loading para pantallas secundarias
- Los estilos van en `App.css` o con Tailwind/Bootstrap inline
