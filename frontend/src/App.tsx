import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';

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

// NOTA: Ya no necesitamos importar los juegos ONLINE acá (ImpostorOnline, VotacionOnline, etc.)
// porque ahora los maneja el MenuOnline internamente.

const AppController = () => {
  const { user } = useAuth();
  const [vista, setVista] = useState("home");
  
  // No necesitamos guardar datosOnline acá, porque el MenuOnline se encarga.
  
  if (!user) return <Welcome />;

  // Esta función queda solo para cumplir con lo que pide el componente, 
  // pero ya no cambia la vista principal.
  const handleJuegoOnlineIniciado = (juego: string, codigo: string, soyHost: boolean, nombre: string) => {
      console.log("Juego iniciado. MenuOnline se encarga de mostrarlo.");
  };

  switch (vista) {
    // --- NAVEGACIÓN BÁSICA ---
    case 'home': return <Home irA={setVista} />;
    case 'menu-offline': return <MenuOffline irA={setVista} volver={() => setVista('home')} />;

    // --- JUEGOS OFFLINE (Estos sí se quedan acá) ---
    case 'lajefa': return <LaJefa volver={() => setVista('menu-offline')} />;
    case 'peaje': return <Peaje volver={() => setVista('menu-offline')} />;
    case 'juego-simple': return <JuegoSimple juego="yo-nunca" volver={() => setVista('menu-offline')} />;
    case 'preguntas': return <JuegoSimple juego="preguntas" volver={() => setVista('menu-offline')} />;
    case 'rico-pobre':
    case 'mas-probable': return <JuegoSimple juego="votacion" volver={() => setVista('menu-offline')} />;
    case 'impostor': return <Impostor volver={() => setVista('menu-offline')} />;

    // --- ONLINE ---
    // Acá está la clave: Solo mostramos el menú. El menú decide si muestra el lobby o el juego.
    case 'menu-online':
      return <MenuOnline volver={() => setVista('home')} onJuegoIniciado={handleJuegoOnlineIniciado} />;
      
    // BORRAMOS TODO LO DEMÁS QUE DABA ERROR
    
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