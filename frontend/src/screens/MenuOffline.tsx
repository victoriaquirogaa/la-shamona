import { useState } from 'react';
import { Container } from 'react-bootstrap';
import '../App.css'; // 👈 Asegurate de importar los estilos

interface Props {
  irA: (pantalla: string) => void;
  volver: () => void;
}

export const MenuOffline = ({ irA, volver }: Props) => {
  const [modoVotacion, setModoVotacion] = useState(false);

  return (
    <Container className="min-vh-100 d-flex flex-column p-4">
      
      {/* --- HEADER --- */}
      <div className="d-flex align-items-center mb-5 animate-in fade-in">
        <button 
            className="btn btn-outline-light rounded-circle me-3 d-flex align-items-center justify-content-center" 
            style={{width: '40px', height: '40px', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)'}}
            onClick={volver}
        >
            🡠
        </button>
        <div>
            <h2 className="titulo-neon m-0 lh-1">OFFLINE</h2>
            <small className="text-white-50" style={{letterSpacing: '1px'}}>Para jugar acá y ahora</small>
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column gap-3 align-items-center w-100">
        
        {/* --- LISTA PRINCIPAL --- */}
        {!modoVotacion ? (
            <div className="d-grid gap-3 w-100 animate-in zoom-in" style={{maxWidth: '400px'}}>
                
                {/* 1. LA JEFA (Botón Neón Rojo/Rosa) */}
                <button 
                    className="btn-neon-secondary text-start ps-4 py-3 fw-bold"
                    style={{color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)'}}
                    onClick={() => irA('lajefa')}
                >
                    👠 LA PUT@
                </button>

                {/* 2. PEAJE (Botón Neón Naranja/Amarillo) */}
                <button 
                    className="btn-neon-main text-start ps-4 py-3 fw-bold"
                    style={{color: '#ffd700', borderColor: '#ffd700'}}
                    onClick={() => irA('peaje')}
                >
                    🚧 PEAJE
                </button>

                {/* 3. YO NUNCA (Botón Neón Azul/Cian - Default) */}
                <button 
                    className="btn-neon-main text-start ps-4 py-3 fw-bold"
                    onClick={() => irA('juego-simple')}
                >
                    🍺 YO NUNCA
                </button>

                {/* 4. PREGUNTAS (Botón Neón Verde) */}
                <button 
                    className="btn-neon-main text-start ps-4 py-3 fw-bold"
                    style={{color: '#00ff9d', borderColor: '#00ff9d'}}
                    onClick={() => irA('preguntas')}
                >
                    ❓ PREGUNTAS
                </button>

                {/* 5. IMPOSTOR (Botón Neón Violeta) */}
                <button 
                    className="btn-neon-secondary text-start ps-4 py-3 fw-bold"
                    style={{color: '#bd00ff', borderColor: '#bd00ff'}}
                    onClick={() => irA('impostor')}
                >
                    🕵️ IMPOSTOR
                </button>

                {/* 6. VOTACIÓN (Estilo Neón Platino) */}
                <button 
                    className="btn-neon-main w-100 py-3 text-start ps-4 fw-bold position-relative animate-in slide-up"
                    style={{
                        borderColor: '#fff', 
                        color: '#fff',
                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)', // Glow blanco suave
                        animationDelay: '0.3s' // Para que aparezca último con estilo
                    }}
                    onClick={() => setModoVotacion(true)}
                >
                    🗳️ VOTACIÓN 
                    {/* Flecha animada */}
                    <span className="position-absolute end-0 me-4 opacity-75">➔</span>
                </button>
            </div>
        ) : (
            /* --- SUB-MENÚ VOTACIÓN --- */
            <div className="w-100 d-flex flex-column gap-3 align-items-center animate-in slide-in-right" style={{maxWidth: '400px'}}>
                
                <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                    <h4 className="m-0 text-white fw-bold text-uppercase" style={{textShadow: '0 0 10px rgba(255,215,0,0.5)'}}>
                        VOTACIÓN
                    </h4>
                    <button className="btn btn-sm text-white-50" onClick={() => setModoVotacion(false)}>
                        🡠 Volver
                    </button>
                </div>

                {/* 6.1 RICO O POBRE */}
                <button 
                    className="btn-neon-main w-100 py-4 fw-bold"
                    style={{color: '#ffd700', borderColor: '#ffd700', background: 'rgba(255, 215, 0, 0.05)'}}
                    onClick={() => irA('rico-pobre')}
                >
                    💸 MUY RICO O MUY POBRE
                </button>

                {/* 6.2 MÁS PROBABLE */}
                <button 
                    className="btn-neon-main w-100 py-4 fw-bold"
                    style={{color: '#ff9900', borderColor: '#ff9900', background: 'rgba(255, 153, 0, 0.05)'}}
                    onClick={() => irA('mas-probable')}
                >
                    🤔 MÁS PROBABLE QUE...
                </button>
            </div>
        )}

      </div>
      
      {/* Footer decorativo */}
      <div className="text-center mt-4 opacity-25 small">
        Seleccioná un juego para empezar
      </div>
    </Container>
  );
};