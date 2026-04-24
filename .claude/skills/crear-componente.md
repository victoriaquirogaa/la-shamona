# Skill: Crear un componente reutilizable

## Cuándo usar
Cuando se necesite un componente UI que se use en múltiples pantallas.

## Pasos

1. **Crear archivo** en `frontend/src/components/NombreComponente.tsx`
2. **Definir interface de props**:
   ```tsx
   interface NombreComponenteProps {
     // props tipadas
   }
   ```
3. **Exportar como named export Y default export**:
   ```tsx
   export const NombreComponente = ({ ... }: NombreComponenteProps) => {
     return ( /* JSX */ );
   };
   export default NombreComponente;
   ```
4. **Estilos**: Agregar clases en `App.css` con prefijo del componente, o usar Tailwind/Bootstrap inline.

## Convenciones
- PascalCase para el nombre del componente y archivo
- Props tipadas con interface (no type)
- Los componentes existentes: `TopBar`, `CocktailCard`, `CommentsOverlay`, `FavoritesView`, `ModalCanje`, `RecipeDetail`, `TopView`
- Importar contextos con hooks: `useAuth()`, `useSubscription()`
