import { useState } from 'react';
import { Container, Row, Col, Modal, ListGroup, Form } from 'react-bootstrap';
import { api } from '../lib/api';
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext'; // 👈 1. Importamos el contexto
import '../App.css';

interface Props { volver: () => void; }

interface MensajeEstado {
  titulo: string;
  cuerpo: React.ReactNode;
  tipo: 'info' | 'success' | 'warning' | 'danger';
}

export const LaJefa = ({ volver }: Props) => {
  // 👇 CAMBIO 1: Usamos 'sinAnuncios' (para Amigos y Premium)
  const { sinAnuncios } = useSubscription(); 
  
  // --- ESTADOS ---
  const [jugadores, setJugadores] = useState<string[]>([]);
  const [inputNombre, setInputNombre] = useState("");
  const [sala, setSala] = useState<string | null>(null);
  const [carta, setCarta] = useState<any>(null);
  
  // 👇 CAMBIO 2: Lógica de Dedito por Dueño (antes era boolean hayDeditoPendiente)
  const [dueñoDedito, setDueñoDedito] = useState<string | null>(null);
  const [showModalDedito, setShowModalDedito] = useState(false);
  
  const [showResultado, setShowResultado] = useState(false);
  const [mensajeResultado, setMensajeResultado] = useState<MensajeEstado>({ titulo: "", cuerpo: "", tipo: "info" });

  // 📺 ESTADOS DE PUBLICIDAD
  const [contadorTurnos, setContadorTurnos] = useState(0);
  const FRECUENCIA_ADS = 5; 

  // --- LÓGICA ---
  const agregarJugador = () => {
    if (inputNombre.trim()) {
      setJugadores([...jugadores, inputNombre.trim()]);
      setInputNombre("");
    }
  };

  const iniciar = async () => {
    if (jugadores.length < 2) return alert("¡Faltan jugadores! Agrega al menos 2 nombres.");
    try {
      const data = await api.crearPartidaLaJefa(jugadores); 
      if (data && data.id_sala) setSala(data.id_sala);
      else alert("Error: El servidor no devolvió una ID de sala válida.");
    } catch (error) { console.error(error); alert("ERROR DE CONEXIÓN"); }
  };

  const sacar = async () => {
    if (!sala) return;

    // 2️⃣ PUBLICIDAD (PEAJE) - Solo si NO tiene 'sinAnuncios'
    if (!sinAnuncios) {
        const turnosJugados = contadorTurnos + 1; 
        if (turnosJugados >= FRECUENCIA_ADS) {
            console.log("🛑 ¡ALTO AHÍ! Momento de publicidad.");
            await AdService.mostrarIntersticial();
            setContadorTurnos(0);
        } else {
            setContadorTurnos(turnosJugados);
        }
    }

    // 3️⃣ SACAR CARTA (API)
    try {
        const data = await api.sacarCartaLaJefa(sala);
        
        if (data.terminado) {
          setMensajeResultado({ titulo: "¡Fin del Mazo!", cuerpo: "Mezclen y vuelvan a jugar.", tipo: "info" });
          setShowResultado(true);
          return;
        }

        // 👇 CAMBIO 3: Lógica de Vencimiento del Dedito
        // Antes se vencía siempre. Ahora solo se vence si el turno volvió al dueño original.
        if (dueñoDedito && data.jugador === dueñoDedito) {
            setDueñoDedito(null); // Se le borra el poder
            setMensajeResultado({ 
                titulo: "😴 DEDITO VENCIDO", 
                cuerpo: `La ronda volvió a ${dueñoDedito} y no usó el poder. ¡Se anula!`, 
                tipo: "info" 
            });
            setShowResultado(true);
        }

        // Si la nueva carta es Dedito, asignamos el nuevo dueño
        if (data.accion_requerida === 'INICIAR_DEDITO') {
            setDueñoDedito(data.jugador); 
            data.accion_requerida = 'NINGUNA';
        }

        setCarta(data);
        
        // Lógica de "Toman Todos" y mensajes extra (Tu código original)
        if (data.datos_extra?.detalle_toman_todos) {
             const listaVisual = (
               <ListGroup variant="flush" className="text-start w-100">
                 {data.datos_extra.detalle_toman_todos.map((p: any, idx: number) => (
                   <ListGroup.Item key={idx} className="bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-2">
                      <span className="fw-bold">{p.nombre}</span>
                      <span className="badge rounded-pill bg-danger">{p.tragos} {p.tragos === 1 ? 'Trago' : 'Tragos'}</span>
                   </ListGroup.Item>
                 ))}
               </ListGroup>
             );
             setMensajeResultado({ titulo: "🍻 ¡TOMAN TODOS!", cuerpo: listaVisual, tipo: "warning" });
             setShowResultado(true);
        } else if (data.datos_extra?.mensaje_trago) {
             setMensajeResultado({ titulo: "¡ATENCIÓN!", cuerpo: data.datos_extra.mensaje_trago, tipo: "warning" });
             setShowResultado(true);
        }
    } catch (error) { console.error("Error al sacar carta:", error); }
  };

  const resolverAccionCarta = async (objetivo: string) => {
    await procesarCastigo(objetivo, carta.accion_requerida === 'ELEGIR_PUTA');
    setCarta({ ...carta, accion_requerida: 'NINGUNA' });
  };

  const resolverDedito = async (perdedor: string) => {
    setShowModalDedito(false); 
    setDueñoDedito(null); // Al usarlo, se consume
    await procesarCastigo(perdedor, false);
  };

  const procesarCastigo = async (objetivo: string, esMascota: boolean) => {
    if (!sala) return;
    try {
        let res;
        if (esMascota) {
          res = await api.asignarPuta(sala, carta.jugador, objetivo);
          setMensajeResultado({ titulo: "👠 Nueva Mascota", cuerpo: res.mensaje, tipo: "success" });
        } else {
          res = await api.registrarTrago(sala, objetivo);
          if (res.toman && res.toman.length > 1) {
             setMensajeResultado({ 
                titulo: "⛓️ ¡CADENA DE TRAGOS!", 
                cuerpo: (
                  <div>
                    <p className="mb-3">Perdió <strong>{objetivo}</strong>, pero arrastra a:</p>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {res.toman.map((nombre: string, i: number) => (
                          <span key={i} className="badge bg-danger p-2 fs-6">{nombre}</span>
                      ))}
                    </div>
                  </div>
                ), 
                tipo: "danger" 
             });
          } else {
             setMensajeResultado({ titulo: "🍺 ¡FONDO BLANCO!", cuerpo: `Perdió ${objetivo}.`, tipo: "danger" });
          }
        }
        setShowResultado(true);
    } catch (e) { console.error(e); }
  }

  // --- HELPER PARA SALIR (PROTEGIDO) ---
  const manejarSalida = async () => {
      // 👇 CAMBIO: Usamos sinAnuncios
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      volver();
  };

  const manejarSalidaJuego = async () => {
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      setSala(null);
  };

  // --- VISTA 1: LOBBY ---
  if (!sala) {
    return (
      <Container className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-3">
        <h1 className="titulo-neon mb-4">LA JEFA 👠</h1>
        
        <div className="card-shamona p-4 w-100 animate-in zoom-in" style={{ maxWidth: '400px' }}>
            <h5 className="text-white-50 mb-3 text-uppercase small fw-bold">Armá la ronda</h5>
            
            <div className="d-flex gap-2 mb-3">
              <Form.Control 
                placeholder="Nombre (ej: Tincho)" 
                value={inputNombre} 
                className="bg-dark text-white border-secondary rounded-pill px-3"
                style={{border: '1px solid var(--neon-cyan)'}}
                onChange={e => setInputNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarJugador()}
              />
              <button className="btn-neon-main py-1 px-3" style={{width: 'auto'}} onClick={agregarJugador}>+</button>
            </div>

            <div className="mb-4 d-flex flex-wrap gap-2 justify-content-center" style={{minHeight: '50px'}}>
              {jugadores.map((j, i) => (
                <div key={i} className="px-3 py-1 rounded-pill bg-secondary text-white small fw-bold d-flex align-items-center gap-2" 
                     style={{cursor:'pointer', border: '1px solid rgba(255,255,255,0.3)'}} 
                     onClick={() => setJugadores(jugadores.filter((_, idx) => idx !== i))}>
                  {j} <span className="text-danger fw-bold">×</span>
                </div>
              ))}
              {jugadores.length === 0 && <small className="text-white-50 fst-italic mt-2">Agregá jugadores para empezar...</small>}
            </div>

            <button 
                className="btn-neon-secondary w-100 py-3 fw-bold mb-3" 
                style={{color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)'}}
                onClick={iniciar} 
                disabled={jugadores.length < 2}
            >
              COMENZAR PARTIDA
            </button>
            
            <button className="btn btn-link text-white-50 text-decoration-none w-100 small" 
                onClick={manejarSalida}>
                Volver al menú
            </button>
        </div>
      </Container>
    );
  }

  // --- VISTA 2: MESA DE JUEGO ---
  return (
    <Container className="min-vh-100 d-flex flex-column align-items-center py-4 text-center position-relative">
      
      <div className="w-100 d-flex justify-content-between align-items-center mb-4 px-3" style={{maxWidth: '500px'}}>
        <div className="titulo-neon fs-4 m-0">LA JEFA</div>
        <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={manejarSalidaJuego}>SALIR</button>
      </div>

      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center w-100">
          {carta ? (
            <div className="card-shamona bg-white text-dark mb-4 position-relative shadow-lg animate-in flip-in-y" 
                 style={{ 
                    width: 'min(85vw, 320px)', // Ocupa el 85% del ancho del celu, pero máximo 320px
                    height: 'auto',            // Altura automática
                    aspectRatio: '2/3',        // Mantiene forma de carta
                    borderRadius: '15px', 
                    border: '8px solid white' 
                }}>
              <div className="d-flex flex-column justify-content-between h-100 p-3">
                
                <div className="d-flex justify-content-between align-items-start">
                    {/* 👇 CAMBIO 4: Texto dinámico para que entre '10 de Espada' sin romperse */}
                    <h1 className="fw-black m-0 lh-1" style={{fontSize: 'clamp(2.5rem, 15vw, 3.5rem)'}}>
                        {carta.carta.split(" ")[0]}
                    </h1>
                    <div style={{fontSize: '3rem'}}>{['Oro','Copa','Basto'].some((x:string) => carta.carta.includes(x)) ? '🪙' : '⚔️'}</div>
                </div>
                
                <div className="my-2">
                  <div className="text-danger fw-bold text-uppercase small ls-2 mb-1" style={{letterSpacing: '2px'}}>REGLA</div>
                  <h3 className="fw-black text-uppercase lh-sm" style={{fontSize: '1.8rem'}}>{carta.regla}</h3>
                  {carta.regla.includes("Dedito") && <div className="badge bg-warning text-dark mt-2 animate-pulse">¡BOTÓN ACTIVADO!</div>}
                </div>

                <div className="bg-light rounded p-2 border-top border-2">
                  <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>TURNO DE</small>
                  <h4 className="fw-bold m-0 text-danger text-uppercase">{carta.jugador}</h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 d-flex align-items-center justify-content-center text-white-50" 
                 style={{ 
                    width: '280px', height: '420px', borderRadius: '15px', 
                    border: '2px dashed rgba(255,255,255,0.2)', 
                    background: 'rgba(0,0,0,0.2)' 
                 }}>
              <div className="text-center">
                <div className="display-1 mb-2">🃏</div>
                <h3>TOCA SACAR</h3>
              </div>
            </div>
          )}

          {/* ZONA DE ACCIONES */}
          {carta && carta.accion_requerida !== 'NINGUNA' && carta.accion_requerida !== 'INICIAR_DEDITO' ? (
            <div style={{maxWidth: '500px'}} className="w-100 px-3 animate-in slide-up">
              <div className="badge bg-warning text-dark mb-3 w-100 p-3 fs-6 fw-bold shadow">
                {carta.accion_requerida === 'ELEGIR_PUTA' ? '👉 ELIGE A TU NUEVA MASCOTA' : '👇 ¿QUIÉN PERDIÓ?'}
              </div>
              <Row className="g-2">
                {(carta.datos_extra?.opciones || jugadores).map((nombre: string) => (
                  <Col xs={6} key={nombre}>
                    <button className="btn-neon-main py-3 fw-bold bg-dark text-white border-secondary" onClick={() => resolverAccionCarta(nombre)}>
                        {nombre}
                    </button>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <button 
                className="btn-neon-main py-3 px-5 fw-bold fs-5 shadow-lg" 
                style={{maxWidth: '300px', background: 'var(--neon-pink)', color: 'white', borderColor: 'var(--neon-pink)'}} 
                onClick={sacar}
            >
              🃏 SACAR CARTA
            </button>
          )}
      </div>

      {/* === BOTÓN FLOTANTE DEDITO (Se muestra si dueñoDedito no es null) === */}
      {dueñoDedito && (
        <button 
          className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg fw-bold d-flex align-items-center justify-content-center animate-bounce"
          style={{ width: '80px', height: '80px', zIndex: 1050, fontSize: '2rem', background: '#ffd700', color: 'black', border: '4px solid white' }}
          onClick={() => setShowModalDedito(true)}
        >👆</button>
      )}

      {/* === MODAL RESOLVER DEDITO === */}
      <Modal show={showModalDedito} onHide={() => setShowModalDedito(false)} centered dialogClassName="modal-glass">
        <Modal.Header closeButton closeVariant="white" className="border-0">
          <Modal.Title className="fw-bold text-warning w-100 text-center">👆 ¿QUIÉN SE DURMIÓ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <p className="text-center text-white-50 mb-4 small">Elegí al último en poner el dedo.</p>
           <Row className="g-2">
            {jugadores.map((nombre) => (
              <Col xs={6} key={nombre}>
                <button className="btn btn-outline-light w-100 py-3 fw-bold" onClick={() => resolverDedito(nombre)}>
                    {nombre}
                </button>
              </Col>
            ))}
           </Row>
        </Modal.Body>
      </Modal>

      {/* === MODAL RESULTADO GENERAL === */}
      <Modal show={showResultado} onHide={() => setShowResultado(false)} centered dialogClassName="modal-glass">
        <Modal.Body className="text-center py-5 d-flex flex-column align-items-center">
          <h2 className={`fw-black mb-4 ${mensajeResultado.tipo === 'danger' ? 'text-danger' : (mensajeResultado.tipo === 'success' ? 'text-success' : 'text-info')}`}>
              {mensajeResultado.titulo}
          </h2>
          <div className="fw-light fs-5 w-100 text-white mb-4">{mensajeResultado.cuerpo}</div>
          <button className="btn-neon-secondary px-5" onClick={() => setShowResultado(false)}>CONTINUAR</button>
        </Modal.Body>
      </Modal>

    </Container>
  );
};