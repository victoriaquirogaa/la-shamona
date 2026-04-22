import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { api } from '../lib/api';
import '../App.css';
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext';
import TopBar from '../components/TopBar';

interface Props { volver: () => void; }

export const Peaje = ({ volver }: Props) => {
  // 👇 CAMBIO: Usamos 'sinAnuncios' (Premium + Amigos)
  const { sinAnuncios } = useSubscription(); 
  
  const [sala, setSala] = useState<string | null>(null);
  const [carta, setCarta] = useState<number>(1);
  const [pos, setPos] = useState(0);
  const [mensaje, setMensaje] = useState("¿Mayor o Menor?");

  // --- INICIO DEL JUEGO ---
  useEffect(() => {
    api.crearPartidaPeaje().then(d => {
      setSala(d.id_sala);
      setCarta(d.carta_visible);
      setPos(d.posicion);
    });
  }, []);

  // --- LÓGICA DE JUGADA ---
  const jugar = async (pred: string) => {
    if (!sala) return;
    
    try {
        const d = await api.jugarTurnoPeaje(sala, pred);
        
        // 🚨 DETECTAR SI PERDIÓ (Volvió al principio)
        if (d.nueva_posicion === 0 && pos > 0) {
            console.log("💥 ¡Choque! Volviste al principio");
            
            // 👈 PUBLICIDAD AL CHOCAR (SOLO SI NO TIENE BENEFICIO)
            if (!sinAnuncios) {
                await AdService.mostrarIntersticial();
            }
        }

        setCarta(d.carta_nueva);
        setPos(d.nueva_posicion);
        setMensaje(d.mensaje);
    } catch (e) {
        console.error("Error jugando", e);
    }
  };

  // --- SALIR CON ANUNCIO ---
  const handleSalir = async () => {
      // 👈 PUBLICIDAD AL SALIR
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      volver();
  };

  // --- REINICIAR ---
  const handleReiniciar = async () => {
      // 👈 PUBLICIDAD AL REINICIAR
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      window.location.reload();
  };

  // --- RENDERIZADO DE LAS CASILLAS DEL CAMINO ---
  const renderCasilla = (num: number, tipo: 'normal' | 'peaje' | 'meta') => {
    const active = pos === num;
    
    let borderColor = 'rgba(255,255,255,0.2)';
    let bgColor = 'rgba(0,0,0,0.3)';
    let icon: string | number = num + 1;

    if (tipo === 'peaje') {
        borderColor = 'var(--neon-pink)';
        icon = '🛑'; 
    }
    if (tipo === 'meta') {
        borderColor = '#00ff9d';
        icon = '🏆';
    }

    if (active) {
        borderColor = '#ffd700'; 
        bgColor = 'rgba(255, 215, 0, 0.2)';
        icon = '🏎️';
    }

    return (
      <div 
        className={`d-flex align-items-center justify-content-center rounded fw-bold position-relative ${active ? 'animate-bounce' : ''}`}
        style={{ 
            width: '55px', height: '55px', 
            border: `2px solid ${borderColor}`,
            background: bgColor,
            color: active ? '#ffd700' : 'white',
            boxShadow: active ? `0 0 15px ${borderColor}` : 'none',
            fontSize: active ? '1.5rem' : '1rem',
            transition: 'all 0.3s ease'
        }}
      >
        {icon}
      </div>
    );
  };

  return (
    <Container className="min-vh-100 d-flex flex-column align-items-center py-0 text-center">
      <TopBar titulo="EL PEAJE" icono="🚧" color="#ffd700" onVolver={handleSalir} />
      <div className="topbar-spacer" />
      <div className="w-100 d-flex flex-column align-items-center px-3">

      {/* TABLERO (Roadmap) */}
      <div className="card-shamona p-3 mb-4 w-100 animate-in slide-up" style={{maxWidth: '500px'}}>
        
        {/* PISO 1 */}
        <div className="d-flex justify-content-center gap-3 mb-3">
          {renderCasilla(0, 'normal')}
          {renderCasilla(1, 'normal')}
          {renderCasilla(2, 'peaje')}
        </div>
        
        {/* PISO 2 */}
        <div className="d-flex justify-content-center gap-3 mb-3">
          {renderCasilla(3, 'normal')}
          {renderCasilla(4, 'normal')}
          {renderCasilla(5, 'peaje')}
        </div>
        
        {/* PISO 3 (META) */}
        <div className="d-flex justify-content-center gap-3 align-items-center">
          {renderCasilla(6, 'normal')}
          <span className="text-white-50 h4 m-0">➔</span>
          {renderCasilla(7, 'meta')}
        </div>

      </div>

      {/* CARTA CENTRAL */}
      <div className="mb-4 d-flex justify-content-center w-100">
        <div className="card-shamona bg-white text-dark position-relative shadow-lg animate-in flip-in-y" 
             style={{ width: '160px', height: '240px', borderRadius: '10px', border: '5px solid white' }}>
             
             <div className="d-flex flex-column justify-content-between h-100 p-2">
                <h2 className="text-start fw-black m-0 lh-1 text-danger">{carta}</h2>
                <h1 className="display-3 fw-bold m-0 lh-1">{carta}</h1>
                <h2 className="text-end fw-black m-0 lh-1 text-danger" style={{transform: 'rotate(180deg)'}}>{carta}</h2>
             </div>
        </div>
      </div>

      {/* MENSAJE DE ESTADO */}
      <h3 className="fw-bold mb-4 text-white" style={{textShadow: '0 0 10px rgba(0,0,0,0.5)', minHeight: '30px'}}>
         {mensaje}
      </h3>

      {/* CONTROLES */}
      {pos > 6 ? (
        <button className="btn-neon-main py-3 px-5 fw-bold bg-success border-success text-white" onClick={handleReiniciar}>
            🏆 JUGAR OTRA VEZ
        </button>
      ) : (
        <div className="d-flex gap-2 w-100 justify-content-center px-3" style={{maxWidth: '450px'}}>
          <button 
            className="btn-neon-main flex-grow-1 py-3 fw-bold" 
            style={{borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)'}}
            onClick={() => jugar('menor')}
          >
            👇 MENOR
          </button>
          
          <button 
            className="btn-neon-secondary flex-grow-1 py-3 fw-bold" 
            style={{borderColor: 'white', color: 'white'}}
            onClick={() => jugar('igual')}
          >
            = IGUAL
          </button>
          
          <button 
            className="btn-neon-main flex-grow-1 py-3 fw-bold" 
            style={{borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)'}}
            onClick={() => jugar('mayor')}
          >
            MAYOR 👆
          </button>
        </div>
      )}
      </div>
    </Container>
  );
};