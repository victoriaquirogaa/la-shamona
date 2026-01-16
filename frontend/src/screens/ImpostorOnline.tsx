import { useState, useEffect } from 'react';
import { Container, Button, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string }; 
  salir: () => void;
}

export const ImpostorOnline = ({ datos, salir }: Props) => {
  const { user } = useAuth();
  
  // ESTADOS
  const [sala, setSala] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [viendoRol, setViendoRol] = useState(false);
  const [miVoto, setMiVoto] = useState<string | null>(null);
  const [reiniciando, setReiniciando] = useState(false);

  // --- 1. SINCRONIZACIÓN (POLLING) ---
  useEffect(() => {
    const fetchSala = async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
        setLoading(false);
      } catch (e) {
        console.error("Error sync", e);
      }
    };

    fetchSala(); 
    const intervalo = setInterval(fetchSala, 2000); 
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  if (loading || !sala) return <Container className="d-flex justify-content-center pt-5"><Spinner animation="border" variant="light"/></Container>;

  // DESEMPAQUETAR DATOS
  const { fase, datos_juego, jugadores } = sala;
  const { palabra_secreta, impostor, categoria, votos, eliminados, ultimo_eliminado, ganador, mensaje_final } = datos_juego || {};
  
  const miNombre = datos.nombre;
  const soyImpostor = miNombre === impostor;
  const estoyVivo = !eliminados?.includes(miNombre);
  const soyHost = datos.soyHost;

  // --- FUNCIONES ---
  const handleVotar = async (acusado: string) => {
    if (miVoto) return; 
    setMiVoto(acusado);
    await api.votarImpostor(datos.codigo, miNombre, acusado);
  };

  const iniciarVotacion = async () => {
      await api.cambiarFaseImpostor(datos.codigo, 'VOTACION');
  };

  const siguienteRonda = async () => {
      await api.cambiarFaseImpostor(datos.codigo, 'RONDA');
      setMiVoto(null); 
  };

  // --- NUEVA FUNCIÓN: REINICIAR PARTIDA ---
  const handleReiniciar = async () => {
      setReiniciando(true);
      try {
        // Llamamos a iniciarJuegoOnline de nuevo. 
        // Nota: Si querés conservar la categoría exacta, necesitarías que el backend te devuelva el ID de categoría.
        // Por ahora reinicia con categoría aleatoria o la que decida el backend por defecto.
        await api.iniciarJuegoOnline(datos.codigo, 'impostor');
        setMiVoto(null);
      } catch (e) {
          console.error(e);
      }
      setReiniciando(false);
  };

  // ================= VISTAS SEGÚN FASE =================

  // --- FASE 1: RONDA (Ver rol y debatir) ---
  if (fase === 'RONDA' || fase === 'INICIO' || fase === 'JUGANDO') {
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center">
        <Badge bg="warning" text="dark" className="mb-3">EN JUEGO 🟢</Badge>
        
        {estoyVivo ? (
            <>
                <h3 className="text-info mb-4">{categoria}</h3>
                
                {/* BOTÓN VER ROL */}
                {!viendoRol ? (
                    <div className="mb-5">
                        <Button 
                            variant="outline-light" size="lg" className="px-5 py-5 rounded-circle fw-bold border-2 shadow-lg"
                            style={{width: '200px', height: '200px'}}
                            onMouseDown={() => setViendoRol(true)}
                            onTouchStart={() => setViendoRol(true)}
                            onMouseUp={() => setViendoRol(false)}
                            onTouchEnd={() => setViendoRol(false)}
                        >
                            MANTENÉ<br/>PARA VER<br/>TU ROL 👁️
                        </Button>
                    </div>
                ) : (
                    <div className="mb-5 animate-in zoom-in">
                        <Card className={`border-0 p-4 shadow-lg ${soyImpostor ? 'bg-danger' : 'bg-success'} text-white`} style={{width: '300px', margin: '0 auto'}}>
                            {soyImpostor ? (
                                <>
                                    <h1 className="display-1 mb-0">🤫</h1>
                                    <h3 className="fw-black">IMPOSTOR</h3>
                                </>
                            ) : (
                                <>
                                    <small className="ls-2 text-uppercase">PALABRA</small>
                                    <h2 className="fw-black mt-1">{palabra_secreta?.toUpperCase()}</h2>
                                </>
                            )}
                        </Card>
                    </div>
                )}

                <div className="mt-auto w-100" style={{maxWidth: '400px'}}>
                    <p className="text-muted">Debatan quién miente...</p>
                    {soyHost && (
                        <Button variant="danger" size="lg" className="w-100 fw-bold py-3 shadow" onClick={iniciarVotacion}>
                            📢 LLAMAR A VOTACIÓN
                        </Button>
                    )}
                </div>
            </>
        ) : (
            <Alert variant="danger" className="mt-5">👻 ESTÁS MUERTO (Shhh...)</Alert>
        )}
      </Container>
    );
  }

  // --- FASE 2: VOTACIÓN (Elegir culpable) ---
  if (fase === 'VOTACION') {
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center">
        <h2 className="text-danger fw-bold mb-4 animate-pulse">¿QUIÉN ES EL IMPOSTOR?</h2>
        
        {!estoyVivo && <Alert variant="secondary">Sos un fantasma 👻. No podés votar.</Alert>}

        <div className="d-grid gap-3 w-100" style={{maxWidth: '400px'}}>
            {jugadores.map((jugador: string) => {
                const yaMurio = eliminados?.includes(jugador);
                
                if (yaMurio) return null; 

                return (
                    <Button 
                        key={jugador}
                        variant={miVoto === jugador ? "danger" : "outline-light"}
                        size="lg"
                        className="py-3 text-start px-4 fw-bold d-flex justify-content-between align-items-center"
                        disabled={!estoyVivo || !!miVoto}
                        onClick={() => handleVotar(jugador)}
                    >
                        {jugador}
                        {miVoto === jugador && <span>👈 Votado</span>}
                    </Button>
                );
            })}
        </div>
        
        {miVoto && <p className="mt-4 text-info animate-in fade-in">Esperando a los demás...</p>}
      </Container>
    );
  }

  // --- FASE 3: RESULTADO (Eliminación y Final) ---
  if (fase === 'RESULTADO_VOTACION' || fase === 'FIN_PARTIDA') {
      const termino = fase === 'FIN_PARTIDA';
      
      return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center justify-content-center bg-dark text-white text-center">
            
            {/* ESCENA DEL CRIMEN */}
            <div className="mb-5 animate-in zoom-in">
                <h4 className="text-muted text-uppercase ls-2">El eliminado fue...</h4>
                <h1 className="display-3 fw-black text-danger my-3">{ultimo_eliminado}</h1>
                
                {termino ? (
                    // TERMINÓ LA PARTIDA
                    <Card className={`border-0 p-4 mt-4 shadow-lg ${ganador === 'CIUDADANOS' ? 'bg-success' : 'bg-danger'} text-white`}>
                        <h2 className="fw-bold">VICTORIA DE {ganador}</h2>
                        <p className="fs-5">{mensaje_final}</p>
                    </Card>
                ) : (
                    // SIGUE LA PARTIDA
                    <div className="mt-4">
                        <h3 className="text-white">NO ERA EL IMPOSTOR... 😱</h3>
                        <p className="text-muted">El impostor sigue entre nosotros.</p>
                    </div>
                )}
            </div>

            {/* BOTONES DE CONTINUAR */}
            {soyHost && (
                <div className="w-100 d-grid gap-3" style={{maxWidth: '400px'}}>
                    {termino ? (
                        <>
                            {/* BOTÓN JUGAR OTRA VEZ */}
                            <Button variant="success" size="lg" className="fw-bold py-3 shadow" onClick={handleReiniciar} disabled={reiniciando}>
                                {reiniciando ? "Mezclando..." : "🔄 JUGAR OTRA VEZ"}
                            </Button>
                            
                            {/* BOTÓN SALIR */}
                            <Button variant="outline-light" className="fw-bold" onClick={salir}>
                                Salir al Menú
                            </Button>
                        </>
                    ) : (
                        <Button variant="warning" size="lg" className="fw-bold py-3 shadow" onClick={siguienteRonda}>
                            CONTINUAR JUGANDO ➔
                        </Button>
                    )}
                </div>
            )}
            
            {!soyHost && (
                <div className="animate-pulse">
                    {termino ? <p className="text-info">Esperando que el Host reinicie...</p> : <p className="text-muted">Esperando al Host...</p>}
                </div>
            )}
            
        </Container>
      );
  }

  return <Container><h1 className="text-white">Cargando...</h1></Container>;
};