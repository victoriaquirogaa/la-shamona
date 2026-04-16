import { useState, useEffect, lazy, Suspense } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { Capacitor } from '@capacitor/core';
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Pantallas críticas (carga inmediata)
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';

// Pantallas secundarias (lazy)
const MenuOffline = lazy(() => import('./screens/MenuOffline').then(m => ({ default: m.MenuOffline })));
const MenuOnline = lazy(() => import('./screens/MenuOnline').then(m => ({ default: m.MenuOnline })));
const Store = lazy(() => import('./screens/Store').then(m => ({ default: m.Store })));
const BebidasScreen = lazy(() => import('./screens/Bebidas'));

// Juegos offline (lazy)
const LaJefa = lazy(() => import('./screens/LaJefa').then(m => ({ default: m.LaJefa })));
const Peaje = lazy(() => import('./screens/Peaje').then(m => ({ default: m.Peaje })));
const JuegoSimple = lazy(() => import('./screens/JuegoSimple').then(m => ({ default: m.JuegoSimple })));
const Impostor = lazy(() => import('./screens/Impostor').then(m => ({ default: m.Impostor })));

// Juegos online (lazy)
const LaJefaOnline = lazy(() => import('./screens/LaJefaOnline').then(m => ({ default: m.LaJefaOnline })));
const PiramideOnline = lazy(() => import('./screens/PiramideOnline').then(m => ({ default: m.PiramideOnline })));
const VotacionOnline = lazy(() => import('./screens/VotacionOnline').then(m => ({ default: m.VotacionOnline })));
const ImpostorOnline = lazy(() => import('./screens/ImpostorOnline').then(m => ({ default: m.ImpostorOnline })));

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
        if (sinAnuncios) {
            console.log("💎 Usuario VIP: Publicidad desactivada");
            await AdMob.hideBanner().catch(() => {});
            return;
        }

        if (Capacitor.getPlatform() === 'ios') {
            await AppTrackingTransparency.requestPermission();
        }

        await AdMob.initialize({ initializeForTesting: true });

        await AdMob.showBanner({
          adId: 'ca-app-pub-3940256099942544/6300978111',
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
  }, [user, sinAnuncios]);

  if (!user) return <Welcome />;

  const cargando = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111' }}><div className="spinner-border text-light" /></div>;

  // --- MANEJO DE RUTEO ONLINE ---
  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      console.log(`🚀 Entrando a partida online: ${juego} (Sala: ${codigo})`);
      setDatosOnline({ codigo, soyHost, nombre, juego });

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
      // ESTE BORRA TODO Y TE MANDA AL HOME (Desconecta)
      setDatosOnline(null);
      setVista('home');
  };

  // 👇 NUEVA FUNCIÓN: Vuelve al menú de juegos PERO MANTIENE LA CONEXIÓN 👇
  const volverAlLobby = () => {
      console.log("🔙 Volviendo al lobby (manteniendo datos)...");
      setVista('menu-online');
  };

  // --- RUTEADOR DE VISTAS ---
  const renderVista = () => {
    switch (vista) {
      // NAVEGACIÓN
      case 'home': return <Home irA={setVista} />;
      case 'store': return <Store volver={() => setVista('home')} />;
      case 'bebidas': return <BebidasScreen volver={() => setVista('home')} />;
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
        return <MenuOnline
            volver={() => setVista('home')}
            onJuegoIniciado={handleJuegoOnlineIniciado}
            datosSesion={datosOnline}
        />;

      case 'impostor-online':
        return datosOnline ?
          <ImpostorOnline datos={datosOnline} salir={salirOnline} volver={volverAlLobby} />
          : <Home irA={setVista}/>;

      case 'votacion-online':
        return datosOnline ?
          <VotacionOnline datos={datosOnline} salir={salirOnline} volver={volverAlLobby} />
          : <Home irA={setVista}/>;

      case 'piramide-online':
        return datosOnline ?
          <PiramideOnline datos={datosOnline} salir={salirOnline} volver={volverAlLobby} />
          : <Home irA={setVista}/>;

      case 'lajefa-online':
        return datosOnline ?
          <LaJefaOnline datos={datosOnline} salir={salirOnline} volver={volverAlLobby} />
          : <Home irA={setVista}/>;

      default: return <Home irA={setVista} />;
    }
  };

  return <Suspense fallback={cargando}>{renderVista()}</Suspense>;
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