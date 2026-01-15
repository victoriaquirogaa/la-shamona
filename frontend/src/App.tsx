import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// PANTALLAS PRINCIPALES
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { MenuOffline } from './screens/MenuOffline';
import { MenuOnline } from './screens/MenuOnline';

// JUEGOS
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';
import { JuegoSimple } from './screens/JuegoSimple'; // El comodín para Yo Nunca, Votación y Preguntas
import { LaJefaOnline } from './screens/LaJefaOnline';
import { Impostor } from './screens/Impostor';

const AppController = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState("home");
  const [datosOnline, setDatosOnline] = useState<any>(null);

  if (!user) return <Welcome />;

  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      setDatosOnline({ codigo, soyHost, nombre });
      setVista('juego-online-activo');
  };

  switch (vista) {
    // --- NAVEGACIÓN BÁSICA ---
    case 'home':
      return <Home irA={setVista} />;
      
    case 'menu-offline':
       return <MenuOffline irA={setVista} volver={() => setVista('home')} />;

    // --- JUEGOS OFFLINE (Acá está la magia) ---

    // 1. LA JEFA (Tiene su propio archivo)
    case 'lajefa':
       return <LaJefa volver={() => setVista('menu-offline')} />;
       
    // 2. PEAJE (Tiene su propio archivo)
    case 'peaje':
       return <Peaje volver={() => setVista('menu-offline')} />;
       
    // 3. YO NUNCA (Usa JuegoSimple modo 'yo-nunca')
    case 'juego-simple': 
       return <JuegoSimple juego="yo-nunca" volver={() => setVista('menu-offline')} />;

    // 4. PREGUNTAS (Usa JuegoSimple modo 'preguntas')
    case 'preguntas': 
       return <JuegoSimple juego="preguntas" volver={() => setVista('menu-offline')} />;

    // 5. VOTACIÓN (Rico/Pobre y Más Probable)
    // Como tu archivo JuegoSimple maneja ambos bajo "votacion", los mandamos ahí.
    case 'rico-pobre':
    case 'mas-probable':
       return <JuegoSimple juego="votacion" volver={() => setVista('menu-offline')} />;

    // 6. IMPOSTOR (Como no me pasaste archivo de este, uso Peaje de relleno para que no explote)
    case 'impostor':
   return <Impostor volver={() => setVista('menu-offline')} />;

    // --- ONLINE ---
    case 'menu-online':
      return <MenuOnline volver={() => setVista('home')} onJuegoIniciado={handleJuegoOnlineIniciado} />;
      
    case 'juego-online-activo':
      return <LaJefaOnline datos={datosOnline} salir={() => setVista('home')} />;
      
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