import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { api } from '../lib/api';

interface Props {
  volver: () => void;
  onJuegoIniciado: (juego: string, codigoSala: string, soyHost: boolean, miNombre: string) => void; // <--- Nueva función para cambiar de pantalla
}

export const MenuOnline = ({ volver, onJuegoIniciado }: Props) => {
  const [nombre, setNombre] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [salaActiva, setSalaActiva] = useState<{codigo: string, jugadores: string[], juego_actual?: string} | null>(null);

  // --- SINCRONIZACIÓN AUTOMÁTICA ---
  useEffect(() => {
    let intervalo: any;

    if (salaActiva) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.getSalaOnline(salaActiva.codigo);
          
          // 1. Actualizamos lista de jugadores
          if (data && data.jugadores) {
            setSalaActiva(prev => prev ? { ...prev, jugadores: data.jugadores, juego_actual: data.juego_actual } : null);
          }

          // 2. DETECTOR DE INICIO DE JUEGO (¡La Magia!)
          if (data && data.juego_actual) {
             // ¡El host inició el juego! Nos vamos todos.
             const soyHost = data.jugadores[0] === nombre;
             onJuegoIniciado(data.juego_actual, salaActiva.codigo, soyHost, nombre);
          }

        } catch (e) { console.error("Error sync"); }
      }, 2000);
    }
    return () => clearInterval(intervalo);
  }, [salaActiva, nombre]); // Agregamos 'nombre' a las dependencias

  // --- FUNCIONES ---
  const handleCrear = async () => {
    if (!nombre.trim()) return alert("¡Pone tu nombre primero!");
    setLoading(true);
    try {
        const data = await api.crearSalaOnline(nombre);
        if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { alert("Error al crear sala."); }
    setLoading(false);
  };

  const handleUnirse = async () => {
    if (!nombre.trim()) return alert("¡Pone tu nombre primero!");
    if (!codigoSala.trim()) return alert("¡Falta código!");
    setLoading(true);
    try {
        const data = await api.unirseSalaOnline(codigoSala, nombre);
        if (data.detail) alert(data.detail);
        else if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { alert("Error al unirse."); }
    setLoading(false);
  };

  const iniciarJuego = async (juego: string) => {
      if (!salaActiva) return;
      await api.iniciarJuegoOnline(salaActiva.codigo, juego);
      // El useEffect de arriba se encargará de redirigirnos cuando detecte el cambio en la BD
  };

  // --- VISTA: LOBBY DE ESPERA ---
  if (salaActiva) {
      const soyHost = salaActiva.jugadores[0] === nombre;

      return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center text-center bg-dark text-white" data-bs-theme="dark">
            <h2 className="text-muted mb-4">Sala de Espera</h2>
            
            <Card className="bg-dark border-success shadow-lg mb-4" style={{ width: '100%', maxWidth: '400px' }}>
                <Card.Body className="p-4">
                    <small className="text-uppercase text-secondary fw-bold ls-2">CÓDIGO DE SALA</small>
                    <h1 className="display-1 fw-black text-success my-2" style={{letterSpacing: '5px'}}>{salaActiva.codigo}</h1>
                </Card.Body>
            </Card>

            <h4 className="mb-3">Jugadores ({salaActiva.jugadores.length}):</h4>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
                {salaActiva.jugadores.map((j, i) => (
                    <Badge key={i} bg={i === 0 ? "warning" : "light"} text="dark" className="p-3 fs-5 border animate-in fade-in">
                        {i === 0 ? "👑 " : ""}{j}
                    </Badge>
                ))}
            </div>

            {/* ZONA DEL ANFITRIÓN */}
            {soyHost ? (
                <div className="w-100" style={{maxWidth: '400px'}}>
                    <Alert variant="info" className="fw-bold">👑 Eres el Host. Elige el juego:</Alert>
                    <div className="d-grid gap-3">
                        <Button variant="danger" size="lg" className="fw-bold py-3" onClick={() => iniciarJuego('la-jefa')}>
                            👠 JUGAR LA JEFA
                        </Button>
                        <Button variant="secondary" size="lg" disabled>
                            🍺 YO NUNCA (Pronto)
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-pulse">
                    <h3 className="text-info fw-light">Esperando al anfitrión...</h3>
                    <small className="text-muted">El juego iniciará automáticamente</small>
                </div>
            )}
        </Container>
      );
  }

  // --- VISTA: LOGIN (Igual que antes) ---
  return (
    <Container className="min-vh-100 py-4 d-flex flex-column bg-dark" data-bs-theme="dark">
      <div className="d-flex align-items-center mb-5">
        <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
        <h2 className="fw-bold m-0 text-white">Lobby Online 🌎</h2>
      </div>

      <div className="flex-grow-1 d-flex flex-column justify-content-center" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <Form.Group className="mb-5">
            <Form.Label className="text-white fw-bold fs-5">Tu Nombre:</Form.Label>
            <Form.Control size="lg" type="text" placeholder="Ej: Tincho" className="bg-dark text-white border-secondary fw-bold text-center"
                value={nombre} onChange={(e) => setNombre(e.target.value)}
            />
        </Form.Group>

        <Row className="g-4">
            <Col md={6}>
                <Card className="h-100 bg-dark border-success border-2 shadow text-white">
                    <Card.Body className="p-4 text-center d-flex flex-column justify-content-center">
                        <div className="mb-3 fs-1">👑</div>
                        <h4 className="fw-bold text-success">Anfitrión</h4>
                        <Button variant="success" size="lg" className="fw-bold w-100 mt-auto" onClick={handleCrear} disabled={loading}>
                            {loading ? "..." : "CREAR SALA"}
                        </Button>
                    </Card.Body>
                </Card>
            </Col>

            <Col md={6}>
                <Card className="h-100 bg-dark border-primary border-2 shadow text-white">
                    <Card.Body className="p-4 text-center d-flex flex-column justify-content-center">
                        <div className="mb-3 fs-1">👋</div>
                        <h4 className="fw-bold text-primary">Invitado</h4>
                        <Form.Control type="text" placeholder="CÓDIGO" className="mb-3 text-center text-uppercase fw-bold bg-secondary text-white border-0" maxLength={6}
                            value={codigoSala} onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                        />
                        <Button variant="primary" size="lg" className="fw-bold w-100 mt-auto" onClick={handleUnirse} disabled={loading}>
                            {loading ? "..." : "UNIRSE"}
                        </Button>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
      </div>
    </Container>
  );
};