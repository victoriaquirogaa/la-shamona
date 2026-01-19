// src/context/SubscriptionContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Swal from 'sweetalert2';

interface SubscriptionContextType {
  isPremium: boolean;
  comprarPremium: (planId: string) => Promise<void>;
  restaurarCompras: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({} as SubscriptionContextType);

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);

  // 1. CHEQUEAR AL INICIO SI LA SUSCRIPCIÓN SIGUE VIGENTE
  useEffect(() => {
    const vencimiento = localStorage.getItem('premium_vencimiento');
    if (vencimiento) {
        const ahora = Date.now();
        // Si la fecha actual es MENOR a la de vencimiento, sigue siendo VIP
        if (ahora < parseInt(vencimiento)) {
            setIsPremium(true);
        } else {
            // Ya venció
            setIsPremium(false);
            localStorage.removeItem('premium_vencimiento');
        }
    }
  }, []);

  // 2. COMPRAR (Simulado)
  const comprarPremium = async (planId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const ahora = Date.now();
        let nuevoVencimiento = 0;

        // CALCULAMOS CUÁNDO VENCE SEGÚN EL PLAN
        if (planId === '24hs') {
            nuevoVencimiento = ahora + (24 * 60 * 60 * 1000); // 1 día en milisegundos
        } else if (planId === '10dias') {
            nuevoVencimiento = ahora + (10 * 24 * 60 * 60 * 1000); // 10 días
        } else if (planId === 'lifetime') {
            nuevoVencimiento = ahora + (100 * 365 * 24 * 60 * 60 * 1000); // 100 años (Para siempre)
        }

        // GUARDAMOS
        localStorage.setItem('premium_vencimiento', nuevoVencimiento.toString());
        setIsPremium(true);
        
        Swal.fire({
            title: '¡Bienvenido al Club VIP! 💎',
            text: 'Ya no verás anuncios y tenés acceso total.',
            icon: 'success',
            background: '#212529',
            color: '#fff',
            confirmButtonColor: '#ffd700',
            confirmButtonText: '¡A DISFRUTAR!'
        });
        resolve();
      }, 1500);
    });
  };

  const restaurarCompras = async () => {
      setTimeout(() => {
          // Acá chequearíamos contra RevenueCat en el futuro
          const vencimiento = localStorage.getItem('premium_vencimiento');
          if (vencimiento && Date.now() < parseInt(vencimiento)) {
              setIsPremium(true);
              Swal.fire({ title: 'Restaurado', text: 'Tu pase VIP está activo.', icon: 'success' });
          } else {
              Swal.fire({ title: 'Sin compras activas', text: 'No encontramos suscripciones vigentes.', icon: 'info' });
          }
      }, 1000);
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, comprarPremium, restaurarCompras }}>
      {children}
    </SubscriptionContext.Provider>
  );
};