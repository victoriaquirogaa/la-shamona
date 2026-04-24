# Skill: Usar Firebase Firestore

## Cuándo usar
Cuando se necesite leer/escribir datos en tiempo real o persistentes.

## Configuración
Firebase ya está configurado en `frontend/src/lib/firebase.ts`:
```tsx
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
```

## Patrones comunes

### Leer un documento
```tsx
const docRef = doc(db, "coleccion", "documentoId");
const snap = await getDoc(docRef);
if (snap.exists()) {
  const datos = snap.data();
}
```

### Escuchar cambios en tiempo real (salas online)
```tsx
useEffect(() => {
  const unsub = onSnapshot(doc(db, "salas", codigo), (snap) => {
    if (snap.exists()) {
      setEstadoSala(snap.data());
    }
  });
  return () => unsub();
}, [codigo]);
```

### Escribir/actualizar documento
```tsx
await setDoc(doc(db, "coleccion", "id"), { campo: valor }, { merge: true });
```

## Reglas
- Siempre usar `onSnapshot` para datos que cambian en tiempo real (juegos online)
- Siempre limpiar el listener en el `return` del `useEffect`
- Para datos estáticos (cartas, preguntas), usar el backend FastAPI
- El auth de Firebase está en `AuthContext.tsx`, no crear instancias nuevas
