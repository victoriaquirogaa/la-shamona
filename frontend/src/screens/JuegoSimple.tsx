import { useState } from 'react';
import { Container, Button, Card, ButtonGroup, Badge } from 'react-bootstrap';
import { api } from '../lib/api';

interface Props {
  juego: 'yo-nunca' | 'votacion' | 'preguntas';
  volver: () => void;
}

export const JuegoSimple = ({ juego, volver }: Props) => {
  const [modo, setModo] = useState<string | null>(null);
  const [frase, setFrase] = useState("Presiona Siguiente");
  const [loading, setLoading] = useState(false);

  // Configuración según juego
  const config = {
    'yo-nunca': { titulo: 'Yo Nunca 🍺', color: 'primary', opciones: [{id: 'gratis', label: 'Gratis'}] },
    'votacion': { titulo: 'Votación 👉', color: 'info', opciones: [{id: 'gratis', label: '¿Quién es?'}, {id: 'rico_pobre', label: 'Rico/Pobre'}] },
    'preguntas': { titulo: 'Preguntas 🤔', color: 'warning', opciones: [{id: 'polemicas', label: 'Polémicas'}, {id: 'profundas', label: 'Profundas'}] }
  }[juego];

  const sacarCarta = async (categoria: string) => {
    setLoading(true);
    let data;
    if (juego === 'yo-nunca') data = await api.getFraseYoNunca(categoria);
    else if (juego === 'votacion') data = await api.getFraseVotacion(categoria);
    else if (juego === 'preguntas') data = await api.getPregunta(categoria);
    
    setFrase(data?.texto || "Error de conexión");
    setLoading(false);
  };

  // VISTA 1: Elegir Modo
  if (!modo) {
    return (
      <Container className="d-flex flex-col justify-content-center align-items-center min-vh-100 text-center" data-bs-theme="dark">
        <h1 className={`text-${config.color} mb-5`}>{config.titulo}</h1>
        <div className="d-grid gap-3 col-10 col-md-6 mx-auto">
          {config.opciones.map(op => (
            <Button key={op.id} variant={`outline-${config.color}`} size="lg" onClick={() => { setModo(op.id); sacarCarta(op.id); }}>
              {op.label}
            </Button>
          ))}
          <Button variant="link" className="text-muted mt-3" onClick={volver}>Volver</Button>
        </div>
      </Container>
    );
  }

  // VISTA 2: Tarjeta
  return (
    <Container className="d-flex flex-col justify-content-center align-items-center min-vh-100 text-center" data-bs-theme="dark">
      <div className="d-flex justify-content-between w-100 px-3 mb-4 absolute top-0 mt-4">
         <Badge bg={config.color} className="text-dark">{config.titulo}</Badge>
         <Button variant="link" size="sm" className="text-muted" onClick={() => setModo(null)}>Cambiar Modo</Button>
      </div>

      <Card className={`w-100 shadow-lg border-${config.color} bg-dark text-white`} style={{ maxWidth: '500px', minHeight: '300px' }}>
        <Card.Body className="d-flex align-items-center justify-content-center p-5">
           <h2 className="fw-bold">{loading ? 'Cargando...' : frase}</h2>
        </Card.Body>
      </Card>

      <div className="d-flex gap-3 mt-5 w-100 justify-content-center" style={{ maxWidth: '500px' }}>
        <Button variant="secondary" onClick={() => setModo(null)}>Atrás</Button>
        <Button variant={config.color} size="lg" className="flex-grow-1 fw-bold" onClick={() => sacarCarta(modo)}>
           SIGUIENTE
        </Button>
      </div>
    </Container>
  );
};