import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext'; // Necesitamos el user para saber el UID
import Swal from 'sweetalert2';

// 1. DEFINIMOS LA INTERFAZ COMPLETA
interface SubscriptionContextType {
  // --- Permisos finos ---
  sinAnuncios: boolean;
  mixSinVideo: boolean;
  accesoVip: boolean;
  
  // --- Estado general ---
  isPremium: boolean; 
  esAmigo: boolean; // 👈 AGREGADO: Para que Home.tsx no tire error
  loading: boolean;
  
  // --- Acciones ---
  checkSubscription: () => Promise<void>;
  comprarPremium: (planId: string) => Promise<void>;
  restaurarCompras: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({} as SubscriptionContextType);

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Traemos el usuario para chequear datos

  // Estados para los permisos
  const [sinAnuncios, setSinAnuncios] = useState(false);
  const [mixSinVideo, setMixSinVideo] = useState(false);
  const [accesoVip, setAccesoVip] = useState(false);
  
  // Estado general
  const [isPremium, setIsPremium] = useState(false); 
  const [esAmigo, setEsAmigo] = useState(false); // 👈 AGREGADO
  const [loading, setLoading] = useState(true);

  // 2. FUNCIÓN PRINCIPAL: CONSULTAR AL BACKEND
  // En src/context/SubscriptionContext.tsx

  // 2. FUNCIÓN PRINCIPAL: CONSULTAR AL BACKEND
  const checkSubscription = async () => {
    try {
      // 👇 ACÁ ESTÁ EL CAMBIO MÁGICO
      // Si existe 'user' (logueado), usamos su UID. Si no, pasamos undefined y la API usa el device_id.
      const idUsuario = user?.uid; 
      
      const perms = await api.getPermisosUsuario(idUsuario); 
      
      console.log("🎟️ Permisos recibidos:", perms); // Mirá esto en la consola (F12)

      setSinAnuncios(perms.sin_anuncios);
      setMixSinVideo(perms.mix_sin_video);
      setAccesoVip(perms.acceso_vip);
      
      const premiumReal = perms.es_premium || false; 
      setIsPremium(premiumReal);

      if (perms.acceso_vip && !premiumReal) {
          setEsAmigo(true);
      } else {
          setEsAmigo(perms.es_amigo || false);
      }

    } catch (error) {
      console.error("Error validando suscripción:", error);
      setSinAnuncios(false);
      setMixSinVideo(false);
      setAccesoVip(false);
      setIsPremium(false);
      setEsAmigo(false);
    } finally {
      setLoading(false);
    }
  };

  // 3. EFECTO INICIAL (Se dispara cuando cambia el usuario)
  useEffect(() => {
    checkSubscription();
  }, [user]); // Agregamos 'user' como dependencia para que re-chequee al loguearse

  // 4. FUNCIONES DE COMPRA
  const comprarPremium = async (planId: string) => {
    console.log("Iniciando compra de:", planId);
    Swal.fire({
        title: 'Procesando...',
        text: 'Conectando con la tienda...',
        didOpen: () => Swal.showLoading()
    });

    setTimeout(async () => {
        Swal.fire('Info', 'La integración de pagos real requiere RevenueCat SDK.', 'info');
    }, 1000);
  };

  const restaurarCompras = async () => {
      Swal.fire({ title: 'Restaurando...', didOpen: () => Swal.showLoading() });
      setTimeout(() => {
          checkSubscription(); 
          Swal.close();
          Swal.fire('Listo', 'Se verificaron tus compras.', 'success');
      }, 1000);
  };

  return (
    <SubscriptionContext.Provider value={{ 
        sinAnuncios, 
        mixSinVideo, 
        accesoVip, 
        isPremium, 
        esAmigo, // 👈 AGREGADO AL VALUE
        loading, 
        checkSubscription, 
        comprarPremium, 
        restaurarCompras 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};