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
import { JuegoSimple } from './screens/JuegoSimple'; 
import { LaJefaOnline } from './screens/LaJefaOnline';
import { Impostor } from './screens/Impostor';
import { ImpostorOnline } from './screens/ImpostorOnline'; // <--- Importaste esto bien

const AppController = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState("home");
  const [datosOnline, setDatosOnline] = useState<any>(null);

  if (!user) return <Welcome />;

  // --- CORRECCIÓN 1: Guardamos el tipo de juego ('impostor' o 'la-jefa') ---
  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      setDatosOnline({ codigo, soyHost, nombre, juego }); // <--- AGREGUÉ 'juego' ACÁ
      setVista('juego-online-activo');
  };

  switch (vista) {
    // --- NAVEGACIÓN BÁSICA ---
    case 'home':
      return <Home irA={setVista} />;
      
    case 'menu-offline':
       return <MenuOffline irA={setVista} volver={() => setVista('home')} />;

    // --- JUEGOS OFFLINE ---
    case 'lajefa':
       return <LaJefa volver={() => setVista('menu-offline')} />;
       
    case 'peaje':
       return <Peaje volver={() => setVista('menu-offline')} />;
       
    case 'juego-simple': 
       return <JuegoSimple juego="yo-nunca" volver={() => setVista('menu-offline')} />;

    case 'preguntas': 
       return <JuegoSimple juego="preguntas" volver={() => setVista('menu-offline')} />;

    case 'rico-pobre':
    case 'mas-probable':
       return <JuegoSimple juego="votacion" volver={() => setVista('menu-offline')} />;

    case 'impostor':
       return <Impostor volver={() => setVista('menu-offline')} />;

    // --- ONLINE ---
    case 'menu-online':
      return <MenuOnline volver={() => setVista('home')} onJuegoIniciado={handleJuegoOnlineIniciado} />;
      
    case 'juego-online-activo':
      // --- CORRECCIÓN 2: Elegimos qué pantalla mostrar ---
      
      if (datosOnline?.juego === 'impostor') {
          // Si el juego es Impostor, mostramos esa pantalla
          // Le pasamos todo 'datosOnline' para que tenga el código de sala y el nombre
          return <ImpostorOnline datos={datosOnline} salir={() => setVista('home')} />;
      }

      // Si no es Impostor, asumimos que es La Jefa (por defecto)
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