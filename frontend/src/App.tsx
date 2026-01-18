import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Capacitor } from '@capacitor/core'; // 👈 Importante para detectar si es iOS

// 👇 Importamos el plugin que instalaste para el permiso de rastreo en iOS
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

// JUEGOS OFFLINE
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';
import { JuegoSimple } from './screens/JuegoSimple'; 
import { Impostor } from './screens/Impostor';

const AppController = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState("home");

  // --- 💸 CONFIGURACIÓN DE PUBLICIDAD (ADMOB) 💸 ---
  useEffect(() => {
    const iniciarPublicidad = async () => {
      try {
        
        // 1. SOLO PARA IOS: Pedir permiso de rastreo (Cartelito de Apple)
        if (Capacitor.getPlatform() === 'ios') {
            const status = await AppTrackingTransparency.requestPermission();
            console.log("Permiso iOS Tracking:", status);
        }

        // 2. Inicializar AdMob (Sin la línea roja que daba error)
        await AdMob.initialize({
          initializeForTesting: true,
        });

        // 3. Mostrar Banner Abajo
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
  }, [user]);
  // ---------------------------------------------------

  if (!user) return <Welcome />;

  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      console.log("Juego iniciado. MenuOnline se encarga de mostrarlo.");
  };

  switch (vista) {
    // --- NAVEGACIÓN BÁSICA ---
    case 'home': return <Home irA={setVista} />;
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
      <AppController />
    </AuthProvider>
  );
}

export default App;