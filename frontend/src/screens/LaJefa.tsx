import { useState } from 'react';
import { Container, Card, Form, Button, Badge, Row, Col, Modal, ListGroup } from 'react-bootstrap';
import { api } from '../lib/api';

interface Props { volver: () => void; }

export const LaJefa = ({ volver }: Props) => {
  // --- ESTADOS ---
  const [jugadores, setJugadores] = useState<string[]>([]);
  const [inputNombre, setInputNombre] = useState("");
  const [sala, setSala] = useState<string | null>(null);
  const [carta, setCarta] = useState<any>(null);
  
  // ESTADO DEDITO
  const [hayDeditoPendiente, setHayDeditoPendiente] = useState(false);
  const [showModalDedito, setShowModalDedito] = useState(false);

  // ESTADO RESULTADOS
  const [showResultado, setShowResultado] = useState(false);
  const [mensajeResultado, setMensajeResultado] = useState<{titulo: string, cuerpo: any, tipo: string}>({ titulo: "", cuerpo: "", tipo: "info" });

  // --- LÓGICA LOBBY ---
  const agregarJugador = () => {
    if (inputNombre.trim()) {
      setJugadores([...jugadores, inputNombre.trim()]);
      setInputNombre("");
    }
  };

  // Reemplaza esto dentro de LaJefa.tsx
  const iniciar = async () => {
    // 1. Validación visual
    if (jugadores.length < 2) {
       return alert("¡Faltan jugadores! Escribe el nombre y toca 'AGREGAR' antes de Comenzar.");
    }

    try {
      // 2. Intentamos conectar
      const data = await api.crearPartidaLaJefa(jugadores);
      console.log("Respuesta Backend:", data); // Mira la consola (F12) si falla

      if (data && data.id_sala) {
        setSala(data.id_sala);
      } else {
        alert("Error: El servidor respondió, pero no envió la sala. Revisa la terminal de Python.");
      }
    } catch (error) {
      console.error(error);
      alert("ERROR DE CONEXIÓN: \n1. Revisa que el backend esté corriendo.\n2. Revisa que hayas agregado 'la_puta' en main.py.\n3. Mira la consola (F12) para más detalles.");
    }
  };
  // --- LÓGICA JUEGO ---
  const sacar = async () => {
    const data = await api.sacarCartaLaJefa(sala!);
    
    if (data.terminado) {
      setMensajeResultado({ titulo: "¡Fin del Mazo!", cuerpo: "Mezclen y vuelvan a jugar.", tipo: "info" });
      setShowResultado(true);
    } else {
      // 1. Manejo de Dedito
      if (data.accion_requerida === 'INICIAR_DEDITO') {
          setHayDeditoPendiente(true); 
          data.accion_requerida = 'NINGUNA'; 
      }

      setCarta(data);
      
      // 2. CORRECCIÓN IMPORTANTE AQUÍ:
      // Primero verificamos si existe la lista "detalle_toman_todos"
      if (data.datos_extra?.detalle_toman_todos) {
         const listaVisual = (
           <ListGroup variant="flush" className="text-start bg-transparent w-100">
             {data.datos_extra.detalle_toman_todos.map((p: any, idx: number) => (
               <ListGroup.Item key={idx} className="bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-2">
                  <span className="fs-5 fw-bold">{p.nombre}</span>
                  <Badge bg="danger" pill className="fs-6 shadow-sm">
                    {p.tragos} {p.tragos === 1 ? 'Trago' : 'Tragos'}
                  </Badge>
               </ListGroup.Item>
             ))}
           </ListGroup>
         );
         setMensajeResultado({ titulo: "🍻 ¡TOMAN TODOS!", cuerpo: listaVisual, tipo: "warning" });
         setShowResultado(true);
      }
      // Si no es lista, vemos si hay un mensaje simple (ej: Regla 1)
      else if (data.datos_extra?.mensaje_trago) {
         setMensajeResultado({ titulo: "¡ATENCIÓN!", cuerpo: data.datos_extra.mensaje_trago, tipo: "warning" });
         setShowResultado(true);
      }
    }
  };

  // Resolver Carta Normal
  const resolverAccionCarta = async (objetivo: string) => {
    await procesarCastigo(objetivo, carta.accion_requerida === 'ELEGIR_PUTA');
    setCarta({ ...carta, accion_requerida: 'NINGUNA' });
  };

  // Resolver Dedito
  const resolverDedito = async (perdedor: string) => {
    setShowModalDedito(false); 
    setHayDeditoPendiente(false); 
    await procesarCastigo(perdedor, false);
  };

  // Lógica común de castigos
  const procesarCastigo = async (objetivo: string, esMascota: boolean) => {
    let res;
    if (esMascota) {
      res = await api.asignarPuta(sala!, carta.jugador, objetivo);
      setMensajeResultado({ titulo: "👠 Nueva Mascota", cuerpo: res.mensaje, tipo: "success" });
    } else {
      res = await api.registrarTrago(sala!, objetivo);
      if (res.toman && res.toman.length > 1) {
          setMensajeResultado({ 
            titulo: "⛓️ ¡CADENA DE TRAGOS!", 
            cuerpo: (
              <div>
                <p className="mb-3">Perdió <strong>{objetivo}</strong>, pero arrastra a:</p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {res.toman.map((nombre: string, i: number) => (
                     <Badge key={i} bg="danger" className="p-2 fs-6">{nombre}</Badge>
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
  }

  // --- VISTA 1: LOBBY ---
  if (!sala) {
    return (
      <Container className="min-vh-100 d-flex flex-column justify-content-center align-items-center" data-bs-theme="dark">
        <h2 className="text-danger fw-bold mb-4">Lobby La Jefa 👠</h2>
        <Card className="bg-dark text-white border-secondary w-100" style={{ maxWidth: '400px' }}>
          <Card.Body>
            <Form.Group className="d-flex gap-2 mb-3">
              <Form.Control 
                placeholder="Nombre (ej: Tincho)" 
                value={inputNombre} 
                onChange={e => setInputNombre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarJugador()}
              />
              <Button variant="danger" onClick={agregarJugador}>+</Button>
            </Form.Group>
            <div className="mb-4 d-flex flex-wrap gap-2">
              {jugadores.map((j, i) => (
                <Badge key={i} bg="light" text="dark" className="p-2 border" style={{cursor:'pointer'}} onClick={() => setJugadores(jugadores.filter((_, idx) => idx !== i))}>
                  {j} ✕
                </Badge>
              ))}
              {jugadores.length === 0 && <small className="text-muted">Agrega jugadores...</small>}
            </div>
            <Button className="w-100 fw-bold" variant={jugadores.length >= 2 ? "danger" : "secondary"} onClick={iniciar} disabled={jugadores.length < 2}>
              COMENZAR
            </Button>
            <Button variant="link" className="text-muted w-100 mt-2" onClick={volver}>Volver</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // --- VISTA 2: MESA DE JUEGO ---
  return (
    <Container className="min-vh-100 d-flex flex-column align-items-center py-4 text-center position-relative" data-bs-theme="dark">
      
      {/* Header */}
      <div className="w-100 d-flex justify-content-between align-items-center mb-4" style={{maxWidth: '500px'}}>
        <h3 className="text-danger fw-bold m-0">La Jefa 👠</h3>
        <Button variant="outline-secondary" size="sm" onClick={() => setSala(null)}>Salir</Button>
      </div>

      {/* CARTA CENTRAL */}
      {carta ? (
        <Card className="shadow-lg border-4 border-light mb-4 position-relative bg-white text-dark" style={{ width: '280px', height: '400px' }}>
          <Card.Body className="d-flex flex-column justify-content-between p-4">
            <div className="d-flex justify-content-between">
                <h2 className="fw-bold">{carta.carta.split(" ")[0]}</h2>
                <h2 className="fw-bold">{['Oro','Copa','Basto'].some((x:string) => carta.carta.includes(x)) ? '🪙' : '⚔️'}</h2>
            </div>
            
            <div>
              <h6 className="text-danger fw-bold text-uppercase ls-2" style={{letterSpacing: '2px'}}>REGLA</h6>
              <h2 className="fw-black text-uppercase lh-1">{carta.regla}</h2>
              {carta.regla.includes("Dedito") && <small className="text-dark d-block mt-2 fw-bold animate-pulse">¡Botón activado abajo!</small>}
            </div>

            <div className="bg-light rounded p-2 border-top border-2">
              <small className="text-muted text-uppercase fw-bold">Le toca a</small>
              <h3 className="fw-bold m-0 text-danger">{carta.jugador}</h3>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4 bg-dark border-secondary border-dashed d-flex align-items-center justify-content-center text-muted" style={{ width: '280px', height: '400px' }}>
          <h3>Toca Sacar</h3>
        </Card>
      )}

      {/* ZONA DE ACCIONES */}
      {carta && carta.accion_requerida !== 'NINGUNA' && carta.accion_requerida !== 'INICIAR_DEDITO' ? (
        <div style={{maxWidth: '500px'}} className="w-100 animate-in fade-in slide-in-from-bottom-5">
          <Badge bg="warning" text="dark" className="mb-3 w-100 p-3 fs-6 fw-bold shadow-sm">
            {carta.accion_requerida === 'ELEGIR_PUTA' ? '👉 ELIGE A TU NUEVA MASCOTA' : '👇 ¿QUIÉN PERDIÓ?'}
          </Badge>
          <Row className="g-2">
            {(carta.datos_extra?.opciones || jugadores).map((nombre: string) => (
              <Col xs={6} key={nombre}>
                <Button variant="light" className="w-100 py-3 fw-bold border-2 text-dark" onClick={() => resolverAccionCarta(nombre)}>
                    {nombre}
                </Button>
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <Button variant="gradient" className="btn-lg w-100 fw-bold bg-danger text-white py-3 shadow" style={{maxWidth: '400px'}} onClick={sacar}>
          🃏 SACAR CARTA
        </Button>
      )}

      {/* === BOTÓN FLOTANTE DEDITO === */}
      {hayDeditoPendiente && (
        <Button 
          variant="warning" 
          className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg border-4 border-white fw-bold fs-1"
          style={{width: '80px', height: '80px', zIndex: 1050}}
          onClick={() => setShowModalDedito(true)}
        >
          👆
        </Button>
      )}

      {/* === MODAL RESOLVER DEDITO === */}
      <Modal show={showModalDedito} onHide={() => setShowModalDedito(false)} centered contentClassName="bg-dark text-white border-warning border-3">
        <Modal.Header closeButton closeVariant="white" className="border-0">
          <Modal.Title className="fw-bold text-warning">👆 ¿Quién fue el último?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <p className="text-center text-muted mb-4">Elige al lento que se comió el amague.</p>
           <Row className="g-2">
            {jugadores.map((nombre) => (
              <Col xs={6} key={nombre}>
                <Button variant="light" className="w-100 py-3 fw-bold text-dark" onClick={() => resolverDedito(nombre)}>
                    {nombre}
                </Button>
              </Col>
            ))}
           </Row>
        </Modal.Body>
      </Modal>

      {/* === MODAL RESULTADO GENERAL === */}
      <Modal show={showResultado} onHide={() => setShowResultado(false)} centered contentClassName="bg-dark text-white border-0">
        <Modal.Header closeButton closeVariant="white" className={`border-0 bg-${mensajeResultado.tipo === 'danger' ? 'danger' : (mensajeResultado.tipo === 'warning' ? 'warning' : 'dark')}`}>
          <Modal.Title className={`fw-bold ${mensajeResultado.tipo === 'warning' ? 'text-dark' : 'text-white'}`}>{mensajeResultado.titulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4 d-flex flex-column align-items-center">
          <div className="fw-light fs-5 w-100">{mensajeResultado.cuerpo}</div>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="light" size="lg" className="px-5 fw-bold" onClick={() => setShowResultado(false)}>OK, SIGUIENTE</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};