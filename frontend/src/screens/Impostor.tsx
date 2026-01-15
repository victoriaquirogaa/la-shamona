import { useState, useEffect } from 'react';
import { Container, Button, Card, Form, Badge, ListGroup, CloseButton, Spinner } from 'react-bootstrap';
import { api } from '../lib/api'; 
import Swal from 'sweetalert2';

interface Categoria {
    id: string;
    titulo: string;
    es_premium: boolean;
}

interface Props {
  volver: () => void;
}

export const Impostor = ({ volver }: Props) => {
  // FASES: setup -> ronda -> final
  const [fase, setFase] = useState<'setup' | 'ronda' | 'final'>('setup');
  
  // DATOS SETUP
  const [nombres, setNombres] = useState<string[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  
  // CATEGORÍAS
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catSeleccionada, setCatSeleccionada] = useState<string>(""); // Vacío = Aleatoria
  const [cargandoCats, setCargandoCats] = useState(true);

  // ESTADO JUEGO
  const [loading, setLoading] = useState(false);
  const [distribucion, setDistribucion] = useState<any[]>([]);
  const [categoriaTitulo, setCategoriaTitulo] = useState("");
  const [turno, setTurno] = useState(0); 
  const [viendo, setViendo] = useState(false);

  // --- 1. CARGAR CATEGORÍAS AL INICIO ---
  useEffect(() => {
    const cargar = async () => {
        const data = await api.getCategoriasImpostor();
        setCategorias(data);
        setCargandoCats(false);
    };
    cargar();
  }, []);

  // --- 2. AGREGAR NOMBRES ---
  const agregar = () => {
    if(!nuevoNombre.trim()) return;
    if(nombres.includes(nuevoNombre.trim())) return;
    setNombres([...nombres, nuevoNombre.trim()]);
    setNuevoNombre("");
  }

  // --- 3. INICIAR PARTIDA ---
  const repartir = async () => {
    if (nombres.length < 3) return Swal.fire('Faltan jugadores', 'Mínimo 3 personas.', 'warning');
    
    setLoading(true);
    try {
        // Le mandamos la categoría seleccionada (o null si es aleatoria)
        const catId = catSeleccionada === "" ? undefined : catSeleccionada;
        
        const data = await api.crearPartidaImpostorLocal(nombres, catId);
        
        setDistribucion(data.distribucion);
        setCategoriaTitulo(data.categoria);
        
        // Reset de estado de ronda
        setTurno(0);
        setViendo(false);
        setFase('ronda');
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'Hubo un error al conectar. Probá de nuevo.', 'error');
    }
    setLoading(false);
  };

  // --- 4. CONTROL DE RONDA ---
  const siguiente = () => {
    setViendo(false);
    if (turno + 1 < distribucion.length) setTurno(turno + 1);
    else setFase('final');
  }

  // ================= VISTAS =================

  // --- VISTA 1: SETUP ---
  if (fase === 'setup') {
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column bg-dark text-white text-center">
        <div className="d-flex align-items-center mb-3">
            <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
            <h2 className="m-0 fw-bold">Impostor 🕵️‍♂️</h2>
        </div>
        
        <Card className="bg-secondary bg-opacity-10 border-0 p-3 mb-3">
            {/* SELECTOR DE CATEGORÍA */}
            <Form.Group className="mb-3 text-start">
                <Form.Label className="text-info fw-bold small">CATEGORÍA:</Form.Label>
                {cargandoCats ? (
                    <div className="text-muted small"><Spinner size="sm" animation="border"/> Cargando temas...</div>
                ) : (
                    <Form.Select 
                        className="bg-dark text-white border-secondary fw-bold"
                        value={catSeleccionada}
                        onChange={(e) => setCatSeleccionada(e.target.value)}
                    >
                        <option value="">🎲 Aleatoria (Mix)</option>
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.es_premium ? '⭐ ' : ''}{c.titulo}
                            </option>
                        ))}
                    </Form.Select>
                )}
            </Form.Group>

            {/* INPUT NOMBRES */}
            <div className="d-flex gap-2 mb-3">
                <Form.Control value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} 
                    placeholder="Nombre jugador..." className="bg-dark text-white border-secondary" 
                    onKeyDown={e => e.key === 'Enter' && agregar()} />
                <Button variant="info" onClick={agregar}>➕</Button>
            </div>

            {/* LISTA JUGADORES */}
            <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                <ListGroup variant="flush">
                    {nombres.map((n, i) => (
                        <ListGroup.Item key={i} className="bg-transparent text-white d-flex justify-content-between py-1 px-0 border-secondary">
                            <span>{i+1}. {n}</span>
                            <CloseButton variant="white" onClick={() => setNombres(nombres.filter((_, idx) => idx !== i))} />
                        </ListGroup.Item>
                    ))}
                    {nombres.length === 0 && <span className="text-muted small fst-italic">Agreguen nombres para jugar...</span>}
                </ListGroup>
            </div>
        </Card>

        <Button variant="success" size="lg" className="w-100 fw-bold mt-auto py-3 shadow" onClick={repartir} disabled={loading || nombres.length < 3}>
            {loading ? "Mezclando..." : "REPARTIR ROLES 🃏"}
        </Button>
      </Container>
    );
  }

  // --- VISTA 2: PASAMANOS ---
  if (fase === 'ronda') {
    const jugador = distribucion[turno];
    return (
      <Container className="min-vh-100 py-4 d-flex flex-column align-items-center justify-content-center bg-dark text-white text-center">
        <Badge bg="secondary" className="mb-4">JUGADOR {turno + 1}/{distribucion.length}</Badge>

        {!viendo ? (
            <div className="animate-in fade-in">
                <h3 className="text-muted mb-4">Dale el celular a:</h3>
                <h1 className="display-1 fw-black text-info mb-5">{jugador.nombre}</h1>
                <Button variant="outline-info" size="lg" className="px-5 rounded-pill shadow" onClick={() => setViendo(true)}>
                    SOY YO 👁️
                </Button>
            </div>
        ) : (
            <div className="animate-in zoom-in w-100" style={{maxWidth: '400px'}}>
                <Card className={`border-0 p-5 mb-4 shadow-lg ${jugador.rol === 'IMPOSTOR' ? 'bg-danger' : 'bg-success'} text-white`}>
                    {jugador.rol === 'IMPOSTOR' ? (
                        <>
                            <h1 className="display-1 mb-0">🤫</h1>
                            <h2 className="fw-black">IMPOSTOR</h2>
                            <p>Tu misión es mentir.<br/>No sabés la palabra.</p>
                        </>
                    ) : (
                        <>
                            <small className="ls-2">LA PALABRA ES</small>
                            <h1 className="display-3 fw-black mt-2 text-wrap">{jugador.palabra.toUpperCase()}</h1>
                        </>
                    )}
                    <div className="mt-3 p-1 bg-black bg-opacity-25 rounded"><small>{categoriaTitulo}</small></div>
                </Card>
                <Button variant="light" size="lg" className="w-100 fw-bold shadow" onClick={siguiente}>OK, SIGUIENTE 🙈</Button>
            </div>
        )}
      </Container>
    );
  }

  // --- VISTA 3: FINAL ---
  return (
    <Container className="min-vh-100 py-4 d-flex flex-column align-items-center justify-content-center bg-dark text-white text-center">
        <h1 className="display-1 mb-2">🔥</h1>
        <h2 className="display-4 fw-bold text-warning mb-4">¡A DEBATIR!</h2>
        
        <div className="bg-secondary bg-opacity-10 p-3 rounded mb-5 border border-secondary w-100" style={{maxWidth: '400px'}}>
            <p className="fs-5 mb-1 text-muted">La categoría era:</p>
            <h3 className="text-info fw-bold">{categoriaTitulo}</h3>
        </div>

        <div className="d-grid gap-3 col-10 col-md-6 mx-auto">
            {/* BOTÓN ARREGLADO: Ahora llama a repartir() directamente, usando los nombres y categoría actuales */}
            <Button variant="outline-light" size="lg" className="py-3 fw-bold" onClick={repartir} disabled={loading}>
                {loading ? "Cargando..." : "🔄 MISMA CONFIGURACIÓN"}
            </Button>
            
            <Button variant="link" className="text-muted" onClick={() => setFase('setup')}>
                Cambiar nombres o categoría
            </Button>
            
            <Button variant="link" className="text-danger text-decoration-none" onClick={volver}>
                Salir al Menú
            </Button>
        </div>
    </Container>
  );
};