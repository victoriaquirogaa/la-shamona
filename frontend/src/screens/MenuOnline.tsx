import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api } from '../lib/api';

// --- IMPORTS DE LOS JUEGOS ---
import { ImpostorOnline } from './ImpostorOnline'; // Asegurate de tener este
import { VotacionOnline } from './VotacionOnline'; // Y este nuevo

interface Props {
  volver: () => void;
  // Ya no dependemos tanto de esta prop si renderizamos acá mismo, pero la dejamos por compatibilidad
  onJuegoIniciado: (juego: string, codigoSala: string, soyHost: boolean, miNombre: string) => void; 
}

export const MenuOnline = ({ volver, onJuegoIniciado }: Props) => {
  const [nombre, setNombre] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [salaActiva, setSalaActiva] = useState<any>(null);

  // ESTADOS PARA EL MODAL DE IMPOSTOR
  const [showModalImpostor, setShowModalImpostor] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [catSeleccionada, setCatSeleccionada] = useState("");
  const [loadingCats, setLoadingCats] = useState(false);

  // --- SYNC MEJORADO ---
  useEffect(() => {
    let intervalo: any;
    if (salaActiva) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.getSalaOnline(salaActiva.codigo);
          
          // Actualizamos TODO el estado de la sala (importante para saber si jugamos)
          if (data) {
              setSalaActiva((prev: any) => ({
                  ...prev,
                  jugadores: data.jugadores,
                  estado: data.estado,           // <--- Agregamos esto
                  juego_actual: data.juego_actual // <--- Y esto
              }));

              // (Opcional) Avisar al padre, aunque ahora manejamos la vista acá
              if (data.estado === 'jugando') {
                  const soyHost = data.jugadores[0] === nombre;
                  onJuegoIniciado(data.juego_actual, salaActiva.codigo, soyHost, nombre);
              }
          }
        } catch (e) { console.error("Sync error"); }
      }, 2000);
    }
    return () => clearInterval(intervalo);
  }, [salaActiva?.codigo, nombre, onJuegoIniciado]); // Ojo con las dependencias

  // --- HELPERS ---
  const mostrarAlerta = (icono: any, titulo: string, texto: string) => {
      Swal.fire({ icon: icono, title: titulo, text: texto, background: '#212529', color: '#fff', confirmButtonColor: '#dc3545' });
  }
  
  const salirDeLaSala = () => {
      setSalaActiva(null); // Volvemos al lobby de crear/unirse
  };

  const handleCrear = async () => {
    if (!nombre.trim()) return mostrarAlerta('warning', '¡Falta el nombre!', 'Ponete un nombre.');
    setLoading(true);
    try {
        const data = await api.crearSalaOnline(nombre);
        if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { mostrarAlerta('error', 'Error', 'No se pudo crear la sala.'); }
    setLoading(false);
  };

  const handleUnirse = async () => {
    if (!nombre.trim()) return mostrarAlerta('warning', 'Nombre', 'Ponete un nombre.');
    if (!codigoSala.trim()) return mostrarAlerta('warning', 'Código', 'Falta el código.');
    setLoading(true);
    try {
        const data = await api.unirseSalaOnline(codigoSala, nombre);
        if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { mostrarAlerta('error', 'Error', 'Sala no encontrada o llena.'); }
    setLoading(false);
  };

  // --- LÓGICA DE INICIO DE JUEGOS ---
  
  // 1. LA JEFA
  const iniciarLaJefa = async () => {
      if (!salaActiva) return;
      await api.iniciarJuegoOnline(salaActiva.codigo, 'la-jefa');
  };

  // 2. IMPOSTOR
  const abrirConfigImpostor = async () => {
      if (salaActiva.jugadores.length < 3) {
          return mostrarAlerta('warning', 'Faltan jugadores', 'Para el Impostor necesitan ser mínimo 3 personas.');
      }
      setShowModalImpostor(true);
      setLoadingCats(true);
      const cats = await api.getCategoriasImpostor();
      setCategorias(cats);
      setLoadingCats(false);
  };

  const iniciarImpostorConfirmado = async () => {
      if (!salaActiva) return;
      setLoadingCats(true); 
      try {
          const catId = catSeleccionada === "" ? undefined : catSeleccionada;
          await api.iniciarJuegoOnline(salaActiva.codigo, 'impostor', catId);
          setShowModalImpostor(false); 
      } catch (e) {
          mostrarAlerta('error', 'Error al iniciar', 'Hubo un problema comunicando con el servidor.');
      }
      setLoadingCats(false);
  };

  // 3. RICO O POBRE (NUEVO)
  const iniciarRicoPobre = async () => {
      if (!salaActiva) return;
      await api.iniciarJuegoOnline(salaActiva.codigo, 'rico_pobre');
  };

  // 4. QUIEN ES MAS PROBABLE (NUEVO)
  const iniciarProbable = async () => {
      if (!salaActiva) return;
      if (salaActiva.jugadores.length < 2) {
          return mostrarAlerta('warning', 'Faltan jugadores', 'Necesitan ser mínimo 2 personas.');
      }
      await api.iniciarJuegoOnline(salaActiva.codigo, 'probable');
  };

  // --- VISTAS DEL JUEGO ACTIVO ---
  // Si la sala está en estado 'jugando', mostramos el componente del juego en vez del lobby
  // --- VISTAS DEL JUEGO ACTIVO ---
  // Si la sala está en estado 'jugando', el MenuOnline desaparece y muestra el juego

  // 👇 AGREGÁ ESTA FUNCIÓN NUEVA
  const volverAlLobby = async () => {
      if (!salaActiva) return;
      // Llamamos al backend para que resetee el estado a "esperando"
      await api.terminarJuego(salaActiva.codigo);
  };

 // --- VISTAS DEL JUEGO ACTIVO ---
  // Si la sala está en estado 'jugando', el MenuOnline desaparece y muestra el juego
  if (salaActiva?.estado === 'jugando') {
      const soyHost = salaActiva.jugadores[0] === nombre;
      const juego = salaActiva.juego_actual;

      // Definimos qué hace el botón salir:
      // Si soy Host -> Reseteo la sala para todos (volverAlLobby)
      // Si soy Invitado -> Me salgo yo solo (salirDeLaSala)
      const accionSalir = soyHost ? volverAlLobby : salirDeLaSala;

      // 1. Si es IMPOSTOR
      if (juego === 'impostor') {
          return <ImpostorOnline datos={{ codigo: salaActiva.codigo, soyHost, nombre }} salir={accionSalir} />;
      }
      
      // 2. Si es RICO/POBRE o PROBABLE
      if (juego === 'rico_pobre' || juego === 'probable') {
          return (
              <VotacionOnline 
                  datos={{
                      codigo: salaActiva.codigo,
                      soyHost,
                      nombre: nombre,
                      juego: juego 
                  }} 
                  salir={accionSalir} // <--- Acá usamos la acción inteligente
              />
          );
      }
      
      // 3. Error
      return (
          <Container className="pt-5 text-white text-center">
              <h1>⚠️ Error de Conexión</h1>
              <p>El juego "{juego}" no tiene pantalla asignada.</p>
              <Button onClick={salirDeLaSala}>Salir</Button>
          </Container>
      );
  }

  // --- VISTA LOBBY (SALA DE ESPERA) ---
  if (salaActiva) {
      const soyHost = salaActiva.jugadores[0] === nombre;
      const faltanJugadores = salaActiva.jugadores.length < 3;

      return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center text-center bg-dark text-white">
            <h2 className="text-muted mb-4">Sala de Espera</h2>
            
            <Card className="bg-dark border-success shadow-lg mb-4" style={{ width: '100%', maxWidth: '400px' }}>
                <Card.Body className="p-4">
                    <small className="text-uppercase text-secondary fw-bold ls-2">CÓDIGO</small>
                    <h1 className="display-1 fw-black text-success my-2" style={{letterSpacing: '5px'}}>{salaActiva.codigo}</h1>
                </Card.Body>
            </Card>

            <h4 className="mb-3">Jugadores ({salaActiva.jugadores.length}):</h4>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
                {salaActiva.jugadores.map((j: string, i: number) => (
                    <Badge key={i} bg={i === 0 ? "warning" : "light"} text="dark" className="p-3 fs-5 border">
                        {i === 0 ? "👑 " : ""}{j}
                    </Badge>
                ))}
            </div>

            {soyHost ? (
                <div className="w-100" style={{maxWidth: '400px'}}>
                    <Alert variant="info" className="fw-bold">👑 Host: Elige juego</Alert>
                    <div className="d-grid gap-3">
                        {/* BOTONES EXISTENTES */}
                        <Button variant="danger" size="lg" className="fw-bold py-3" onClick={iniciarLaJefa}>
                            👠 LA JEFA
                        </Button>

                        <Button 
                            variant="info" size="lg" className="fw-bold py-3 text-dark" 
                            onClick={abrirConfigImpostor}
                            style={faltanJugadores ? {opacity: 0.6} : {}}
                        >
                            🕵️‍♂️ IMPOSTOR
                            {faltanJugadores && <div className="small text-danger fw-bold">(Mínimo 3)</div>}
                        </Button>

                        {/* --- BOTONES NUEVOS --- */}
                        <Button variant="warning" size="lg" className="fw-bold py-3 text-dark" onClick={iniciarRicoPobre}>
                             💰 MUY DE RICO / POBRE
                        </Button>

                        <Button 
                            variant="primary" size="lg" className="fw-bold py-3" 
                            onClick={iniciarProbable}
                            style={salaActiva.jugadores.length < 2 ? {opacity: 0.6} : {}}
                        >
                             👉 QUIÉN ES MÁS PROBABLE
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-pulse">
                    <h3 className="text-info fw-light">Esperando al Host...</h3>
                </div>
            )}

            {/* MODAL SELECCIÓN CATEGORÍA (IMPOSTOR) */}
            <Modal show={showModalImpostor} onHide={() => setShowModalImpostor(false)} centered contentClassName="bg-dark text-white border-info">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title>Configurar Impostor 🕵️‍♂️</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Elegí la categoría:</Form.Label>
                        {loadingCats ? <div className="text-center"><Spinner animation="border" size="sm"/></div> : (
                            <Form.Select 
                                className="bg-secondary text-white border-0 fw-bold" 
                                value={catSeleccionada} 
                                onChange={(e) => setCatSeleccionada(e.target.value)}
                            >
                                <option value="">🎲 Aleatoria (Mix)</option>
                                {categorias.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.es_premium ? '⭐ ' : ''}{c.titulo}</option>
                                ))}
                            </Form.Select>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="link" className="text-white" onClick={() => setShowModalImpostor(false)}>Cancelar</Button>
                    <Button 
                        variant="info" className="fw-bold px-4" onClick={iniciarImpostorConfirmado} disabled={loadingCats}
                    >
                        {loadingCats ? "Iniciando..." : "¡COMENZAR PARTIDA!"}
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
      );
  }

  // VISTA LOGIN
  return (
    <Container className="min-vh-100 py-4 d-flex flex-column bg-dark text-white">
      <div className="d-flex align-items-center mb-5">
        <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
        <h2 className="fw-bold m-0">Lobby Online 🌎</h2>
      </div>
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <Form.Control 
            size="lg" type="text" placeholder="Ej: Tincho" 
            className="bg-dark text-white border-secondary fw-bold text-center"
            value={nombre} 
            onChange={(e) => {
                const val = e.target.value;
                setNombre(val.charAt(0).toUpperCase() + val.slice(1));
            }}
        />
        <Row className="g-4 w-100 mt-2" style={{maxWidth: '600px'}}>
            <Col md={6}>
                <Button variant="success" size="lg" className="w-100 py-5 fw-bold fs-4" onClick={handleCrear} disabled={loading}>
                    👑 CREAR SALA
                </Button>
            </Col>
            <Col md={6}>
                <div className="d-flex flex-column gap-2">
                    <Form.Control placeholder="CÓDIGO" className="text-center text-uppercase fw-bold bg-secondary text-white border-0 py-3" maxLength={6}
                        value={codigoSala} onChange={(e) => setCodigoSala(e.target.value.toUpperCase())} />
                    <Button variant="primary" size="lg" className="w-100 fw-bold" onClick={handleUnirse} disabled={loading}>
                        UNIRSE
                    </Button>
                </div>
            </Col>
        </Row>
      </div>
    </Container>
  );
};