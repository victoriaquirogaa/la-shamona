import { useState } from 'react';
import { Home } from './screens/Home';
import { MenuOffline } from './screens/MenuOffline';
import { JuegoSimple } from './screens/JuegoSimple';
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';

function App() {
  const [vista, setVista] = useState('home');

  // 1. HOME (Raíz)
  if (vista === 'home') {
    return <Home navegar={setVista} />;
  }

  // 2. MENÚ OFFLINE (Sub-menú)
  if (vista === 'menu-offline') {
    return <MenuOffline jugar={setVista} volver={() => setVista('home')} />;
  }
  
  // 3. JUEGOS (Botón volver lleva al menú offline)
  const volverAlMenu = () => setVista('menu-offline');

  if (['yo-nunca', 'votacion', 'preguntas'].includes(vista)) {
    return <JuegoSimple juego={vista as any} volver={volverAlMenu} />;
  }

  if (vista === 'la-jefa') return <LaJefa volver={volverAlMenu} />;
  if (vista === 'peaje') return <Peaje volver={volverAlMenu} />;

  return <div className="text-white text-center mt-5">Cargando...</div>;
}

export default App;