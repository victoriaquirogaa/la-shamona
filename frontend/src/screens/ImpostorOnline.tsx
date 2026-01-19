import { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext'; // 👈 1. IMPORTAR
import '../App.css'; 

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string }; 
  salir: () => void;
}

export const ImpostorOnline = ({ datos, salir }: Props) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription(); // 👈 2. OBTENER ESTADO PREMIUM
  
  // ESTADOS
  const [sala, setSala] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [viendoRol, setViendoRol] = useState(false);
  const [miVoto, setMiVoto] = useState<string | null>(null);
  const [reiniciando, setReiniciando] = useState(false);

  // --- SYNC ---
  useEffect(() => {
    const fetchSala = async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
        setLoading(false);

        // SOLUCIÓN AL EMPATE
        const votosServer = data.datos_juego?.votos || {};
        const miNombre = datos.nombre;
        
            if (!votosServer[miNombre]) {
                setMiVoto(null); 
            }

      } catch (e) { console.error("Error sync", e); }
    };
    
    fetchSala(); 
    const intervalo = setInterval(fetchSala, 2000); 
    return () => clearInterval(intervalo);
  }, [datos.codigo, datos.nombre]); 

  if (loading || !sala) return <Container className="d-flex justify-content-center pt-5 min-vh-100 bg-dark"><Spinner animation="border" variant="info"/></Container>;

  // DESEMPAQUETAR
  const { fase, datos_juego } = sala;
  const { impostor, categoria, eliminados, ultimo_eliminado, ganador, mensaje_final, palabra_secreta } = datos_juego || {};
  
  const miNombre = datos.nombre;
  const soyImpostor = miNombre === impostor;
  const estoyVivo = !eliminados?.includes(miNombre);
  const soyHost = datos.soyHost;

  // --- ACCIONES ---
  const handleVotar = async (acusado: string) => {
    if (miVoto) return; 
    setMiVoto(acusado); 
    await api.votarImpostor(datos.codigo, miNombre, acusado);
  };

  const iniciarVotacion = async () => await api.cambiarFaseImpostor(datos.codigo, 'VOTACION');
  
  const siguienteRonda = async () => {
      await api.cambiarFaseImpostor(datos.codigo, 'RONDA');
      setMiVoto(null); 
  };

  const handleReiniciar = async () => {
      setReiniciando(true);
      try {
        // 🚀 3. ENVIAR PREMIUM STATUS AL REINICIAR
        // Si no pasamos categoría (undefined), es Mix. El backend usará isPremium para filtrar.
        await api.iniciarJuegoOnline(datos.codigo, 'impostor', undefined, isPremium); 
        setMiVoto(null);
      } catch (e) { console.error(e); }
       setReiniciando(false);
  };

  const handleSalir = async () => {
      salir();
  };

  // ================= VISTAS =================

  // --- FASE 1: RONDA (Ver rol) ---
  if (fase === 'RONDA' || fase === 'INICIO' || fase === 'JUGANDO') {
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center">
        
        {/* HEADER */}
        <div className="w-100 d-flex justify-content-between align-items-center mb-4 px-2" style={{maxWidth: '600px'}}>
             <div className="badge bg-dark border border-secondary text-white px-3 py-2 rounded-pill">RONDA DE DEBATE</div>
             {estoyVivo ? <span className="text-success small fw-bold">VIVO 🟢</span> : <span className="text-secondary small fw-bold">ESPECTADOR 👻</span>}
        </div>

        {estoyVivo ? (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100">
                <h3 className="text-white-50 mb-5 fw-light text-uppercase ls-2">TEMÁTICA: <span className="text-info fw-bold">{categoria}</span></h3>
                
                {/* BOTÓN MÁGICO DE ROL */}
                {!viendoRol ? (
                    <button 
                        className="rounded-circle fw-bold shadow-lg position-relative animate-pulse"
                        style={{
                            width: '220px', height: '220px',
                            background: 'radial-gradient(circle, #2a2a2a 0%, #000 100%)',
                            border: '4px solid var(--neon-cyan)',
                            color: 'var(--neon-cyan)',
                            fontSize: '1.2rem',
                            textShadow: '0 0 10px var(--neon-cyan)'
                        }}
                        onMouseDown={() => setViendoRol(true)}
                        onTouchStart={() => setViendoRol(true)}
                        onMouseUp={() => setViendoRol(false)}
                        onTouchEnd={() => setViendoRol(false)}
                    >
                        <div className="position-absolute top-50 start-50 translate-middle text-center lh-sm">
                            <div style={{fontSize: '3rem', marginBottom: '10px'}}>👁️</div>
                            MANTENÉ<br/>PARA VER<br/>TU ROL
                        </div>
                    </button>
                ) : (
                    <div className="card-shamona p-4 shadow-lg animate-in zoom-in d-flex flex-column justify-content-center align-items-center text-center"
                         style={{
                             width: '280px', height: '280px',
                             border: `3px solid ${soyImpostor ? 'var(--neon-pink)' : '#00ff9d'}`,
                             background: soyImpostor ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 157, 0.1)'
                         }}>
                        {soyImpostor ? (
                            <>
                                <div style={{fontSize: '4rem'}} className="mb-2">🤫</div>
                                <h2 className="fw-black text-danger display-4 mb-2" style={{textShadow: '0 0 20px red'}}>IMPOSTOR</h2>
                                <p className="text-white small lh-sm">Engañalos a todos.</p>
                            </>
                        ) : (
                            <>
                                <small className="text-white-50 ls-2 text-uppercase mb-2">LA PALABRA ES</small>
                                <h2 className="fw-black text-white display-4 mb-3 text-wrap text-uppercase" style={{textShadow: '0 0 20px white'}}>
                                    {palabra_secreta?.toUpperCase()}
                                </h2>
                            </>
                        )}
                    </div>
                )}

                <div className="mt-auto w-100 mb-4 animate-in slide-up" style={{maxWidth: '400px'}}>
                    {soyHost ? (
                        <button className="btn-neon-main py-3 w-100 fw-bold fs-5" 
                                style={{borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)'}}
                                onClick={iniciarVotacion}>
                            📢 LLAMAR A VOTACIÓN
                        </button>
                    ) : (
                        <p className="text-white-50 small animate-pulse">Esperando que el Host llame a votación...</p>
                    )}
                </div>
            </div>
        ) : (
            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
                <div style={{fontSize: '4rem'}} className="mb-3">👻</div>
                <h2 className="text-secondary fw-bold">ESTÁS MUERTO</h2>
                <p className="text-muted">Shhh... los muertos no hablan.</p>
            </div>
        )}
      </Container>
    );
  }

  // --- FASE 2: VOTACIÓN ---
  if (fase === 'VOTACION') {
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center">
        <h2 className="titulo-neon mb-4 text-danger animate-pulse" style={{textShadow: '0 0 10px red'}}>¿QUIÉN ES EL CULPABLE?</h2>
        
        {!estoyVivo && <div className="badge bg-secondary mb-4">MODO ESPECTADOR 👻</div>}

        <div className="d-grid gap-3 w-100 px-3" style={{maxWidth: '450px'}}>
            {sala.jugadores.map((jugador: string) => {
                const yaMurio = eliminados?.includes(jugador);
                if (yaMurio) return null; 

                const esMiVoto = miVoto === jugador;

                return (
                    <button 
                        key={jugador}
                        className={`btn d-flex justify-content-between align-items-center py-3 px-4 fw-bold border-2 ${esMiVoto ? 'bg-danger text-white border-danger' : 'btn-outline-light text-white'}`}
                        style={{
                            borderRadius: '50px', 
                            transition: 'all 0.2s',
                            opacity: !estoyVivo ? 0.5 : 1
                        }}
                        disabled={!estoyVivo || !!miVoto}
                        onClick={() => handleVotar(jugador)}
                    >
                        <span>{jugador}</span>
                        {esMiVoto && <span>👈 VOTADO</span>}
                    </button>
                );
            })}
        </div>
        
        {miVoto && <p className="mt-5 text-info animate-pulse small">Esperando al resto...</p>}
      </Container>
    );
  }

  // --- FASE 3: RESULTADO ---
  if (fase === 'RESULTADO_VOTACION' || fase === 'FIN_PARTIDA') {
      const termino = fase === 'FIN_PARTIDA';
      const colorNombre = (ganador === 'CIUDADANOS') ? 'text-success' : 'text-danger';
      const sombraNombre = (ganador === 'CIUDADANOS') ? '0 0 30px #00ff9d' : '0 0 30px red';

      return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center justify-content-center bg-dark text-white text-center p-3">
            
            <div className="mb-5 animate-in zoom-in w-100" style={{maxWidth: '500px'}}>
                <h5 className="text-white-50 text-uppercase ls-2 mb-3">El eliminado fue...</h5>
                
                <h1 className={`display-2 fw-black mb-4 ${colorNombre}`} style={{textShadow: sombraNombre}}>
                    {ultimo_eliminado?.toUpperCase()}
                </h1>
                
                {termino ? (
                    <div className={`card-shamona p-4 mt-4 shadow-lg ${ganador === 'CIUDADANOS' ? 'border-success' : 'border-danger'}`}
                         style={{background: ganador === 'CIUDADANOS' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'}}>
                        <h2 className={`fw-bold mb-3 ${ganador === 'CIUDADANOS' ? 'text-success' : 'text-danger'}`}>
                            VICTORIA {ganador}
                        </h2>
                        <p className="fs-5 text-white">{mensaje_final}</p>
                    </div>
                ) : (
                    <div className="mt-5 animate-in slide-up">
                        <h3 className="text-white fw-bold mb-2">NO ERA EL IMPOSTOR... 😱</h3>
                        <p className="text-white-50">El peligro sigue entre nosotros.</p>
                    </div>
                )}
            </div>

            {soyHost && (
                <div className="w-100 d-grid gap-3 animate-in slide-up" style={{maxWidth: '400px', animationDelay: '0.2s'}}>
                    {termino ? (
                        <>
                            <button className="btn-neon-main bg-success border-success text-white py-3 fw-bold" onClick={handleReiniciar} disabled={reiniciando}>
                                {reiniciando ? <Spinner size="sm"/> : "🔄 JUGAR OTRA VEZ"}
                            </button>
                            
                            <button className="btn btn-outline-secondary py-3 fw-bold rounded-pill" onClick={handleSalir}>
                                ❌ SALIR AL MENÚ
                            </button>
                        </>
                    ) : (
                        <button className="btn-neon-secondary py-3 fw-bold" style={{color: '#ffd700', borderColor: '#ffd700'}} onClick={siguienteRonda}>
                            CONTINUAR LA CACERÍA ➔
                        </button>
                    )}
                </div>
            )}
            
            {!soyHost && (
                <div className="animate-pulse mt-4 w-100" style={{maxWidth: '400px'}}>
                    <p className="text-white-50 small">{termino ? "Esperando al Host..." : "El juego continúa..."}</p>
                    {termino && (
                        <button className="btn btn-outline-secondary w-100 py-2 rounded-pill mt-3" onClick={handleSalir}>
                            ❌ Salir
                        </button>
                    )}
                </div>
            )}
            
        </Container>
      );
  }

  return <Container><Spinner animation="border" variant="light" className="mt-5"/></Container>;
};