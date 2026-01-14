import { useState, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import { api } from '../lib/api';

interface Props { volver: () => void; }

export const Peaje = ({ volver }: Props) => {
  const [sala, setSala] = useState<string | null>(null);
  const [carta, setCarta] = useState<number>(1);
  const [pos, setPos] = useState(0);
  const [mensaje, setMensaje] = useState("¿Mayor o Menor?");

  useEffect(() => {
    api.crearPartidaPeaje().then(d => {
      setSala(d.id_sala);
      setCarta(d.carta_visible);
      setPos(d.posicion);
    });
  }, []);

  const jugar = async (pred: string) => {
    if (!sala) return;
    const d = await api.jugarTurnoPeaje(sala, pred);
    setCarta(d.carta_nueva);
    setPos(d.nueva_posicion);
    setMensaje(d.mensaje);
  };

  const renderCasilla = (num: number, tipo: 'normal' | 'peaje' | 'meta') => {
    const active = pos === num;
    let bg = active ? 'warning' : 'secondary';
    if (!active && tipo === 'peaje') bg = 'danger';
    if (!active && tipo === 'meta') bg = 'success';
    
    return (
      <div className={`d-flex align-items-center justify-content-center rounded border border-2 border-dark text-white fw-bold shadow ${active ? 'scale-up' : ''}`}
           style={{ width: '60px', height: '60px', background: `var(--bs-${bg})`, transform: active ? 'scale(1.2)' : 'scale(1)' }}>
        {active ? '🚗' : (tipo === 'peaje' ? '🛑' : (tipo === 'meta' ? '🏆' : num + 1))}
      </div>
    );
  };

  return (
    <Container className="min-vh-100 d-flex flex-column align-items-center py-4 text-center" data-bs-theme="dark">
      <div className="w-100 d-flex justify-content-between align-items-center mb-4" style={{maxWidth: '600px'}}>
        <h3 className="text-warning fw-bold m-0">🚧 El Peaje</h3>
        <Button variant="outline-secondary" size="sm" onClick={volver}>Salir</Button>
      </div>

      {/* TABLERO 3 PISOS */}
      <Card className="bg-dark border-secondary p-3 mb-4 w-100" style={{maxWidth: '500px'}}>
        {/* Piso 1 */}
        <div className="d-flex justify-content-center gap-3 mb-3">
          {renderCasilla(0, 'normal')}
          {renderCasilla(1, 'normal')}
          {renderCasilla(2, 'peaje')}
        </div>
        {/* Piso 2 */}
        <div className="d-flex justify-content-center gap-3 mb-3">
          {renderCasilla(3, 'normal')}
          {renderCasilla(4, 'normal')}
          {renderCasilla(5, 'peaje')}
        </div>
        {/* Piso 3 */}
        <div className="d-flex justify-content-center gap-3 align-items-center">
          {renderCasilla(6, 'normal')}
          <span className="h2 text-muted m-0">➔</span>
          {renderCasilla(7, 'meta')}
        </div>
      </Card>

      {/* CARTA CENTRAL */}
      <Card className="bg-white text-dark mb-4 border-4 border-light shadow" style={{ width: '180px', height: '260px' }}>
        <Card.Body className="d-flex flex-column justify-content-between p-2">
          <h4 className="text-start text-secondary">{carta}</h4>
          <h1 className="display-1 fw-bold m-0">{carta}</h1>
          <h4 className="text-end text-secondary" style={{transform: 'rotate(180deg)'}}>{carta}</h4>
        </Card.Body>
      </Card>

      <h4 className="text-warning mb-4" style={{minHeight: '30px'}}>{mensaje}</h4>

      {pos > 6 ? (
        <Button size="lg" variant="success" onClick={() => window.location.reload()}>JUGAR OTRA VEZ</Button>
      ) : (
        <div className="d-flex gap-2 w-100 justify-content-center" style={{maxWidth: '400px'}}>
          <Button variant="primary" className="flex-grow-1 py-3 fw-bold" onClick={() => jugar('menor')}>👇 MENOR</Button>
          <Button variant="primary" className="flex-grow-1 py-3 fw-bold" onClick={() => jugar('igual')}>= IGUAL</Button>
          <Button variant="primary" className="flex-grow-1 py-3 fw-bold" onClick={() => jugar('mayor')}>MAYOR 👆</Button>
        </div>
      )}
    </Container>
  );
};