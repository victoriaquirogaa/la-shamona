import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { Capacitor } from '@capacitor/core';
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// PANTALLAS PRINCIPALES
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { MenuOffline } from './screens/MenuOffline';
import { MenuOnline } from './screens/MenuOnline';
import { Store } from './screens/Store';

// JUEGOS OFFLINE
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';
import { JuegoSimple } from './screens/JuegoSimple';
import { Impostor } from './screens/Impostor';

// 👇 JUEGOS ONLINE (Agregados para que funcione el ruteo)
import { LaJefaOnline } from './screens/LaJefaOnline';
import { PiramideOnline } from './screens/PiramideOnline';
import { VotacionOnline } from './screens/VotacionOnline';
import { ImpostorOnline } from './screens/ImpostorOnline';

const AppController = () => {
  const { user } = useAuth();
  
  // Usamos 'sinAnuncios' para ocultar banner a Premium Y Amigos
  const { sinAnuncios } = useSubscription();
  
  const [vista, setVista] = useState("home");
  
  // Estado para guardar datos de la partida online en curso
  const [datosOnline, setDatosOnline] = useState<{codigo: string, soyHost: boolean, nombre: string, juego: string} | null>(null);

  // --- 💸 CONFIGURACIÓN DE PUBLICIDAD (ADMOB) 💸 ---
  useEffect(() => {
    const iniciarPublicidad = async () => {
      try {
        // Si tiene el beneficio 'sinAnuncios', ocultamos y salimos.
        if (sinAnuncios) {
            console.log("💎 Usuario VIP/Amigo: Publicidad desactivada");
            await AdMob.hideBanner().catch(() => {});
            return;
        }

        // Permisos iOS
        if (Capacitor.getPlatform() === 'ios') {
            await AppTrackingTransparency.requestPermission();
        }

        await AdMob.initialize({ initializeForTesting: true });

        // Mostrar Banner
        await AdMob.showBanner({
          adId: 'ca-app-pub-3940256099942544/6300978111', // ID de prueba Android
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true
        });
        
      } catch (e) {
        console.error('Error al iniciar publicidad:', e);
      }
    };

    if (user) {
      iniciarPublicidad();
    }
  }, [user, sinAnuncios]); // Se ejecuta al loguear o al canjear código

  if (!user) return <Welcome />;

  // --- MANEJO DE RUTEO ONLINE ---
  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      console.log(`🚀 Entrando a partida online: ${juego} (Sala: ${codigo})`);
      
      // Guardamos los datos para pasarlos al componente
      setDatosOnline({ codigo, soyHost, nombre, juego });

      // Redirigimos a la vista correcta según el ID del juego
      switch (juego) {
          case 'impostor': setVista('impostor-online'); break;
          case 'votacion': 
          case 'rico_pobre': 
          case 'probable': setVista('votacion-online'); break;
          case 'piramide': setVista('piramide-online'); break;
          case 'la-jefa': setVista('lajefa-online'); break;
          default: console.warn("Juego desconocido:", juego);
      }
  };

  const salirOnline = () => {
      setDatosOnline(null);
      setVista('home');
  };

  // --- RUTEADOR DE VISTAS ---
  switch (vista) {
    // NAVEGACIÓN
    case 'home': return <Home irA={setVista} />;
    case 'store': return <Store volver={() => setVista('home')} />;
    case 'menu-offline': return <MenuOffline irA={setVista} volver={() => setVista('home')} />;
    
    // OFFLINE
    case 'lajefa': return <LaJefa volver={() => setVista('menu-offline')} />;
    case 'peaje': return <Peaje volver={() => setVista('menu-offline')} />;
    case 'juego-simple': return <JuegoSimple juego="yo-nunca" volver={() => setVista('menu-offline')} />;
    case 'preguntas': return <JuegoSimple juego="preguntas" volver={() => setVista('menu-offline')} />;
    case 'rico-pobre':
    case 'mas-probable': return <JuegoSimple juego="votacion" volver={() => setVista('menu-offline')} />;
    case 'impostor': return <Impostor volver={() => setVista('menu-offline')} />;

    // ONLINE (MENÚ)
    case 'menu-online': 
      return <MenuOnline volver={() => setVista('home')} onJuegoIniciado={handleJuegoOnlineIniciado} />;

    // ONLINE (PANTALLAS DE JUEGO)
    case 'impostor-online': 
      return datosOnline ? <ImpostorOnline datos={datosOnline} salir={salirOnline} /> : <Home irA={setVista}/>;
    
    case 'votacion-online': 
      return datosOnline ? <VotacionOnline datos={datosOnline} salir={salirOnline} /> : <Home irA={setVista}/>;
    
    case 'piramide-online': 
      return datosOnline ? <PiramideOnline datos={datosOnline} salir={salirOnline} /> : <Home irA={setVista}/>;
    
    case 'lajefa-online': 
      return datosOnline ? <LaJefaOnline datos={datosOnline} salir={salirOnline} /> : <Home irA={setVista}/>;

    default: return <Home irA={setVista} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
         <AppController />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;