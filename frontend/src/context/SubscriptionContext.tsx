import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor'; 
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

// --- CONFIGURACIÓN DE REVENUECAT ---
const API_KEYS = {
  apple: "appl_TuClaveDeAppleAqui",
  google: "goog_JdVFnPRWKpBTBOnxWVdfsyFILZz" // Tu clave real
};

interface SubscriptionContextType {
  sinAnuncios: boolean;
  mixSinVideo: boolean;
  accesoVip: boolean;
  isPremium: boolean;
  esAmigo: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  comprarPremium: (planId: string) => Promise<void>;
  restaurarCompras: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({} as SubscriptionContextType);

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [sinAnuncios, setSinAnuncios] = useState(false);
  const [mixSinVideo, setMixSinVideo] = useState(false);
  const [accesoVip, setAccesoVip] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [esAmigo, setEsAmigo] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. INICIALIZAR REVENUECAT
  useEffect(() => {
    const initRC = async () => {
      const apiKey = Capacitor.getPlatform() === 'android' 
        ? API_KEYS.google 
        : API_KEYS.apple;

      console.log("🔧 Inicializando RevenueCat con:", apiKey);

      // @ts-ignore
      await Purchases.configure({ apiKey });
      
      // @ts-ignore
      await Purchases.setLogLevel("DEBUG"); 
    };
    
    initRC();
  }, []);

  // 2. CHECK SUBSCRIPTION
  const checkSubscription = async () => {
    try {
      const idUsuario = user?.uid;
      
      if (idUsuario) {
        // @ts-ignore
        await Purchases.logIn(idUsuario);
      }

      const perms = await api.getPermisosUsuario(idUsuario);
      console.log("🎟️ Permisos recibidos:", perms);

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

  useEffect(() => {
    checkSubscription();
  }, [user]);

  // 3. COMPRAR PREMIUM
  const comprarPremium = async (planId: string) => {
    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Conectando con la tienda...',
        didOpen: () => Swal.showLoading()
      });

      // @ts-ignore
      const offerings = await Purchases.getOfferings();
      
      // @ts-ignore
      const paqueteAComprar = offerings.current?.availablePackages.find(
        (pkg: any) => pkg.identifier === planId
      );

      if (!paqueteAComprar) {
        throw new Error(`No se encontró el plan: ${planId}. Revisá RevenueCat.`);
      }

      // @ts-ignore
      // 👇 ACÁ AGREGUÉ EL : any PARA QUE NO CHILLE
      const { customerInfo }: any = await Purchases.purchasePackage(paqueteAComprar);

      console.log("Compra exitosa:", customerInfo);
      
      Swal.close();
      await checkSubscription(); 

      Swal.fire({
        icon: 'success',
        title: '¡Bienvenida!',
        text: 'Tu suscripción ya está activa.'
      });

    } catch (e: any) {
      Swal.close();
      if (!e.userCancelled) {
        console.error(e);
        Swal.fire('Error', e.message || 'Hubo un problema con la compra', 'error');
      }
    }
  };

  // 4. RESTAURAR COMPRAS
  const restaurarCompras = async () => {
      try {
        Swal.fire({ title: 'Restaurando...', didOpen: () => Swal.showLoading() });
        
        // @ts-ignore
        // 👇 ACÁ TAMBIÉN AGREGUÉ : any
        const customerInfo: any = await Purchases.restorePurchases();
        
        await checkSubscription();
        
        Swal.close();
        
        // Ahora como es 'any', TypeScript deja pasar 'entitlements'
        if (customerInfo?.entitlements?.active && Object.keys(customerInfo.entitlements.active).length > 0) {
            Swal.fire('Listo', 'Se recuperaron tus compras anteriores.', 'success');
        } else {
            Swal.fire('Info', 'No se encontraron compras activas para restaurar.', 'info');
        }

      } catch (e: any) {
        Swal.close();
        console.error(e);
        Swal.fire('Error', 'No se pudieron restaurar las compras.', 'error');
      }
  };

  return (
    <SubscriptionContext.Provider value={{ 
        sinAnuncios, mixSinVideo, accesoVip, isPremium, esAmigo,
        loading, checkSubscription, comprarPremium, restaurarCompras 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};