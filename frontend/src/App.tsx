import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';
// 👇 Importamos el Provider y el Hook
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext'; 
import { Capacitor } from '@capacitor/core'; 
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';

import { 
  AdMob, 
  BannerAdSize, 
  BannerAdPosition 
} from '@capacitor-community/admob';

// PANTALLAS PRINCIPALES
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { MenuOffline } from './screens/MenuOffline';
import { MenuOnline } from './screens/MenuOnline';
import { Store } from './screens/Store'; // 👈 Importamos la Tienda

// JUEGOS OFFLINE
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';
import { JuegoSimple } from './screens/JuegoSimple'; 
import { Impostor } from './screens/Impostor';

const AppController = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription(); // 👈 Leemos si es VIP
  const [vista, setVista] = useState("home");

  // --- 💸 CONFIGURACIÓN DE PUBLICIDAD (ADMOB) 💸 ---
  useEffect(() => {
    const iniciarPublicidad = async () => {
      try {
        // 🚫 SI ES PREMIUM, NO MOSTRAMOS NADA Y OCULTAMOS BANNER EXISTENTE
        if (isPremium) {
            console.log("💎 Usuario Premium: Publicidad desactivada");
            await AdMob.hideBanner().catch(() => {}); // Ocultar por si acaso
            return; 
        }

        // 1. SOLO PARA IOS: Pedir permiso de rastreo
        if (Capacitor.getPlatform() === 'ios') {
            const status = await AppTrackingTransparency.requestPermission();
            console.log("Permiso iOS Tracking:", status);
        }

        // 2. Inicializar AdMob
        await AdMob.initialize({
          initializeForTesting: true,
        });

        // 3. Mostrar Banner Abajo (Solo si NO es premium)
        await AdMob.showBanner({
          adId: 'ca-app-pub-3940256099942544/6300978111', 
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER, 
          margin: 0, 
          isTesting: true 
        });
        
        console.log('Publicidad iniciada correctamente');
      } catch (e) {
        console.error('Error al iniciar publicidad:', e);
      }
    };

    if (user) {
      iniciarPublicidad();
    }
  }, [user, isPremium]); // 👈 Se ejecuta si el usuario cambia o si compra el Premium
  // ---------------------------------------------------

  if (!user) return <Welcome />;

  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      console.log("Juego iniciado. MenuOnline se encarga de mostrarlo.");
  };

  switch (vista) {
    // --- NAVEGACIÓN BÁSICA ---
    case 'home': return <Home irA={setVista} />;
    case 'store': return <Store volver={() => setVista('home')} />; // 👈 RUTA TIENDA
    case 'menu-offline': return <MenuOffline irA={setVista} volver={() => setVista('home')} />;

    // --- JUEGOS OFFLINE ---
    case 'lajefa': return <LaJefa volver={() => setVista('menu-offline')} />;
    case 'peaje': return <Peaje volver={() => setVista('menu-offline')} />;
    case 'juego-simple': return <JuegoSimple juego="yo-nunca" volver={() => setVista('menu-offline')} />;
    case 'preguntas': return <JuegoSimple juego="preguntas" volver={() => setVista('menu-offline')} />;
    case 'rico-pobre':
    case 'mas-probable': return <JuegoSimple juego="votacion" volver={() => setVista('menu-offline')} />;
    case 'impostor': return <Impostor volver={() => setVista('menu-offline')} />;

    // --- ONLINE ---
    case 'menu-online':
      return <MenuOnline volver={() => setVista('home')} onJuegoIniciado={handleJuegoOnlineIniciado} />;
      
    default:
      return <Home irA={setVista} />;
  }
};

function App() {
  return (
    <AuthProvider>
      {/* 👇 4. ENVOLVEMOS LA APP CON EL PROVIDER DE SUSCRIPCIÓN */}
      <SubscriptionProvider>
         <AppController />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;