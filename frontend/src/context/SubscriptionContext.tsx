import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'; 
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
      // 👇 1. Frenamos el código si estamos en la web para que no explote
      if (Capacitor.getPlatform() === 'web') {
        console.log("🌐 Modo Web detectado. Saltando inicialización de RevenueCat.");
        return; 
      }

      // 👇 2. Si es un celular (Android/iOS), lo intentamos cargar de forma segura
      try {
        const apiKey = Capacitor.getPlatform() === 'android' 
          ? API_KEYS.google 
          : API_KEYS.apple;

        console.log("🔧 Inicializando RevenueCat...");

        // @ts-ignore
        await Purchases.configure({ apiKey });
        
        // @ts-ignore
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG); 
      } catch (error) {
        console.warn("⚠️ Error inicializando RevenueCat:", error);
      }
    };
    
    initRC();
  }, []);

  // 2. CHECK SUBSCRIPTION (LÓGICA BLINDADA 🛡️)
  const checkSubscription = async () => {
    try {
      const idUsuario = user?.uid;
      let esPremiumPorTienda = false; 

      // 1. PREGUNTAR A REVENUECAT (Esto maneja los tiempos automáticamente)
      try {
          // @ts-ignore
          const info: any = await Purchases.getCustomerInfo();
          // Si RevenueCat dice que está activo, es porque NO pasaron las 24hs todavía
          if (info?.entitlements?.active?.['premium']) { 
              esPremiumPorTienda = true;
          }
      } catch (error) { console.warn("Error RC", error); }

      // 2. PREGUNTAR A BASE DE DATOS (Solo para regalos manuales)
      let perms = { es_amigo: false, acceso_vip: false, sin_anuncios: false, mix_sin_video: false };
      try {
           perms = await api.getPermisosUsuario(idUsuario);
      } catch (e) { console.warn("Error API"); }

      // 🚨 CAMBIO CLAVE AQUÍ 🚨
      // Antes: Sumábamos todo.
      // Ahora: Si pagó por tienda (24hs), manda la tienda.
      // La BD solo la usamos si es un "Amigo" o un "VIP Manual" (acceso_vip).
      
      const esVipManual = perms.acceso_vip || perms.es_amigo; 
      
      // EL VEREDICTO FINAL:
      const esPremiumFinal = esPremiumPorTienda || esVipManual;

      // ACTUALIZAR ESTADOS
      setIsPremium(esPremiumFinal);
      setSinAnuncios(esPremiumFinal || perms.sin_anuncios);
      setMixSinVideo(esPremiumFinal || perms.mix_sin_video);
      setAccesoVip(esPremiumFinal); 
      setEsAmigo(esVipManual);

    } catch (error) {
      console.error(error);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  // 3. COMPRAR PREMIUM (CORREGIDO)
  const comprarPremium = async (planId: string) => {
    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Conectando con la tienda...',
        didOpen: () => Swal.showLoading()
      });

      // @ts-ignore
      const offerings = await Purchases.getOfferings();
      
      // Buscamos el paquete en Current o en Default
      let paqueteAComprar = null;

      if (offerings.current) {
        paqueteAComprar = offerings.current.availablePackages.find(
          (pkg: any) => pkg.identifier === planId
        );
      } else if (offerings.all['default']) {
         paqueteAComprar = offerings.all['default'].availablePackages.find(
          (pkg: any) => pkg.identifier === planId
        );
      }

      if (!paqueteAComprar) {
        throw new Error(`No se encontró el plan '${planId}' en RevenueCat.`);
      }

      console.log("📦 Comprando:", paqueteAComprar);

      // 👇👇👇 AQUÍ ESTABA EL ERROR - SOLUCIÓN DEFINITIVA 👇👇👇
      // La versión nueva EXIGE poner llaves y la palabra clave 'aPackage'
      // @ts-ignore
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: paqueteAComprar }); 
      // 👆👆👆

      console.log("Compra exitosa:", customerInfo);
      
      // 👇👇👇 AGREGÁ ESTO PARA ACTUALIZAR TU BASE DE DATOS 👇👇👇
      try {
          console.log("Guardando en base de datos...");
          // Asumo que tu 'user.uid' es el ID del usuario
          // Y que tenés un endpoint para actualizar (si no, hay que crearlo)
          await api.actualizarUsuario(user.uid, { 
              es_premium: true,
              fecha_compra: new Date().toISOString(),
              plan_id: planId
          });
          console.log("✅ Base de datos actualizada!");
      } catch (errorBD) {
          console.error("⚠️ El usuario pagó, pero falló al guardar en la BD:", errorBD);
          // No bloqueamos al usuario, porque YA PAGÓ. 
          // RevenueCat lo va a dejar pasar igual gracias a checkSubscription.
      }
      // 👆👆👆 FIN DEL AGREGADO 👆👆👆

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
        const customerInfo: any = await Purchases.restorePurchases();
        await checkSubscription();
        
        Swal.close();
        
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

  // 👇 5. EL DESPERTADOR CLAVE (AGREGÁ ESTO) 👇
  useEffect(() => {
    if (user && user.uid) {
      console.log("👤 ¡Usuario detectado! Buscando permisos en BD para:", user.uid);
      checkSubscription();
    } else {
      console.log("⏳ Esperando que alguien inicie sesión...");
    }
  }, [user]); 
  // 👆 FIN DEL DESPERTADOR 👆

  return (
    <SubscriptionContext.Provider value={{ 
        sinAnuncios, mixSinVideo, accesoVip, isPremium, esAmigo,
        loading, checkSubscription, comprarPremium, restaurarCompras 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};