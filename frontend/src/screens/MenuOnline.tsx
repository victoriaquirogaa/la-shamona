import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api } from '../lib/api';

interface Props {
  volver: () => void;
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

  // --- SYNC ---
  useEffect(() => {
    let intervalo: any;
    if (salaActiva) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.getSalaOnline(salaActiva.codigo);
          if (data?.jugadores) setSalaActiva((prev: any) => prev ? { ...prev, jugadores: data.jugadores } : null);
          
          if (data?.juego_actual && data.estado === 'jugando') {
             const soyHost = data.jugadores[0] === nombre;
             onJuegoIniciado(data.juego_actual, salaActiva.codigo, soyHost, nombre);
          }
        } catch (e) { console.error("Sync error"); }
      }, 2000);
    }
    return () => clearInterval(intervalo);
  }, [salaActiva, nombre, onJuegoIniciado]);

  // --- HELPERS ---
  const mostrarAlerta = (icono: any, titulo: string, texto: string) => {
      Swal.fire({ icon: icono, title: titulo, text: texto, background: '#212529', color: '#fff', confirmButtonColor: '#dc3545' });
  }

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
  
  // 1. LA JEFA (Directo)
  const iniciarLaJefa = async () => {
      if (!salaActiva) return;
      await api.iniciarJuegoOnline(salaActiva.codigo, 'la-jefa');
  };

  // 2. IMPOSTOR (Abre Modal)
  const abrirConfigImpostor = async () => {
      if (salaActiva.jugadores.length < 3) {
          return mostrarAlerta('warning', 'Faltan jugadores', 'Para el Impostor necesitan ser mínimo 3 personas.');
      }
      setShowModalImpostor(true);
      setLoadingCats(true);
      // Cargamos categorías
      const cats = await api.getCategoriasImpostor();
      setCategorias(cats);
      setLoadingCats(false);
  };

  const iniciarImpostorConfirmado = async () => {
      if (!salaActiva) return;
      
      // 1. Activamos spinner de carga (reutilizamos loadingCats o creamos uno local si querés)
      setLoadingCats(true); 

      try {
          const catId = catSeleccionada === "" ? undefined : catSeleccionada;
          
          // 2. Enviamos la orden
          await api.iniciarJuegoOnline(salaActiva.codigo, 'impostor', catId);
          
          // 3. ¡IMPORTANTE! Cerramos el modal para que veas el cambio de pantalla
          setShowModalImpostor(false); 
          
      } catch (e) {
          mostrarAlerta('error', 'Error al iniciar', 'Hubo un problema comunicando con el servidor.');
      }
      
      setLoadingCats(false);
  };
  // --- VISTAS ---
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
                        <Button variant="danger" size="lg" className="fw-bold py-3" onClick={iniciarLaJefa}>
                            👠 LA JEFA
                        </Button>

                        <Button 
                            variant="info" size="lg" className="fw-bold py-3 text-dark" 
                            onClick={abrirConfigImpostor}
                            style={faltanJugadores ? {opacity: 0.6} : {}}
                        >
                            🕵️‍♂️ IMPOSTOR
                            {faltanJugadores && <div className="small text-danger fw-bold">(Mínimo 3 jugadores)</div>}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-pulse">
                    <h3 className="text-info fw-light">Esperando al Host...</h3>
                </div>
            )}

            {/* MODAL SELECCIÓN CATEGORÍA */}
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
                    {/* BOTÓN MEJORADO */}
                    <Button 
                        variant="info" 
                        className="fw-bold px-4" 
                        onClick={iniciarImpostorConfirmado}
                        disabled={loadingCats} // Se bloquea al tocar
                    >
                        {loadingCats ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                                Iniciando...
                            </>
                        ) : (
                            "¡COMENZAR PARTIDA!"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
      );
  }

  // VISTA LOGIN (IGUAL QUE ANTES)
  return (
    <Container className="min-vh-100 py-4 d-flex flex-column bg-dark text-white">
      <div className="d-flex align-items-center mb-5">
        <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
        <h2 className="fw-bold m-0">Lobby Online 🌎</h2>
      </div>
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <Form.Control 
            size="lg" 
            type="text" 
            placeholder="Ej: Tincho" 
            className="bg-dark text-white border-secondary fw-bold text-center"
            value={nombre} 
            // AGREGÁ ESTA MAGIA 👇
            onChange={(e) => {
                const val = e.target.value;
                // Pone la primera mayúscula automáticamente
                setNombre(val.charAt(0).toUpperCase() + val.slice(1));
            }}
        />
        <Row className="g-4 w-100" style={{maxWidth: '600px'}}>
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