import { useState } from 'react';
import { Home } from './screens/Home';
import { MenuOffline } from './screens/MenuOffline';
import { JuegoSimple } from './screens/JuegoSimple';
import { LaJefa } from './screens/LaJefa';
import { Peaje } from './screens/Peaje';
import { MenuOnline } from './screens/MenuOnline'; // <--- NUEVO IMPORT

function App() {
  interface DatosOnline {
    juego: string;
    codigo: string;
    soyHost: boolean;
    nombre: string;
  }
  const [vista, setVista] = useState('home');
  const [datosOnline, setDatosOnline] = useState<DatosOnline | null>(null);

  // 1. HOME (Raíz)
  if (vista === 'home') {
    return <Home navegar={setVista} />;
  }

  // 2. MENÚ OFFLINE (Sub-menú)
  if (vista === 'menu-offline') {
    return <MenuOffline jugar={setVista} volver={() => setVista('home')} />;
  }

  // ...
  
  // 3. MENÚ ONLINE
  if (vista === 'menu-online') {
    return <MenuOnline 
      volver={() => setVista('home')} 
      onJuegoIniciado={(juego, codigo, soyHost, nombre) => {
          // Guardamos los datos clave
          setDatosOnline({ juego, codigo, soyHost, nombre });
          // Cambiamos la vista a la pantalla del juego
          setVista('juego-online-activo'); 
      }} 
    />;
  }

  // 4. PANTALLA DE JUEGO ONLINE (Placeholder por ahora)
  if (vista === 'juego-online-activo') {
      return (
          <div className="min-vh-100 bg-dark text-white d-flex flex-column items-center justify-center text-center p-5">
              <h1 className="text-success animate-bounce">🚀 ¡JUEGO INICIADO!</h1>
              <h3>Estamos jugando: {datosOnline?.juego}</h3>
              <p>Sala: {datosOnline?.codigo} | Soy: {datosOnline?.soyHost ? 'HOST' : 'INVITADO'}</p>
              <button className="btn btn-outline-light mt-4" onClick={() => setVista('menu-online')}>Volver al Lobby</button>
          </div>
      )
  }
  // ... (sigue el resto de juegos)
  
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