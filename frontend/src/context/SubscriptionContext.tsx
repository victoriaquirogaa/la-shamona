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
  const checkSubscription = async () => {
    try {
      // A. Obtenemos permisos calculados (Vip, Anuncios, etc)
      const perms = await api.getPermisosUsuario(); 
      
      setSinAnuncios(perms.sin_anuncios);
      setMixSinVideo(perms.mix_sin_video);
      setAccesoVip(perms.acceso_vip);
      
      // B. Determinamos si es Premium vs Amigo
      // Si el backend devuelve 'es_premium' explícito, lo usamos. Si no, asumimos por los permisos.
      // (Ajustá esto según tu backend response, por ahora lo hago seguro)
      const premiumReal = perms.es_premium || false; 
      setIsPremium(premiumReal);

      // Si tiene acceso VIP pero NO es premium pagando, entonces es Amigo
      if (perms.acceso_vip && !premiumReal) {
          setEsAmigo(true);
      } else {
          // También podemos chequear explícitamente si el backend manda 'es_amigo'
          setEsAmigo(perms.es_amigo || false);
      }

    } catch (error) {
      console.error("Error validando suscripción:", error);
      // Ante error, bloqueamos todo
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