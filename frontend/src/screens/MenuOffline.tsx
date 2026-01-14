import { Container, Row, Col, Card, Button } from 'react-bootstrap';

interface Props {
  jugar: (juego: string) => void;
  volver: () => void;
}

export const MenuOffline = ({ jugar, volver }: Props) => {
  return (
    <Container className="min-vh-100 py-4" data-bs-theme="dark">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
        <h2 className="fw-bold m-0">Juegos Offline</h2>
      </div>

      <Row className="g-3">
        {/* YO NUNCA */}
        <Col xs={6} md={6}>
          <Card className="h-100 bg-dark text-white border-0 shadow-sm" onClick={() => jugar('yo-nunca')} style={{cursor:'pointer'}}>
            <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
              <span className="display-4 mb-2">🍺</span>
              <h5 className="fw-bold">Yo Nunca</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* LA JEFA */}
        <Col xs={6} md={6}>
          <Card className="h-100 bg-dark text-white border-0 shadow-sm" onClick={() => jugar('la-jefa')} style={{cursor:'pointer'}}>
            <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
              <span className="display-4 mb-2">👠</span>
              <h5 className="fw-bold">La Jefa</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* VOTACIÓN */}
        <Col xs={6} md={6}>
          <Card className="h-100 bg-dark text-white border-0 shadow-sm" onClick={() => jugar('votacion')} style={{cursor:'pointer'}}>
            <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
              <span className="display-4 mb-2">👉</span>
              <h5 className="fw-bold">Votación</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* PREGUNTAS */}
        <Col xs={6} md={6}>
          <Card className="h-100 bg-dark text-white border-0 shadow-sm" onClick={() => jugar('preguntas')} style={{cursor:'pointer'}}>
            <Card.Body className="d-flex flex-column justify-content-center text-center p-4">
              <span className="display-4 mb-2">🤔</span>
              <h5 className="fw-bold">Preguntas</h5>
            </Card.Body>
          </Card>
        </Col>

        {/* EL PEAJE (Destacado) */}
        <Col xs={12}>
          <Card className="bg-warning text-dark border-0 shadow" onClick={() => jugar('peaje')} style={{cursor:'pointer'}}>
            <Card.Body className="d-flex align-items-center justify-content-between p-4">
              <div className="text-start">
                <h3 className="fw-black m-0">🚧 EL PEAJE</h3>
                <small className="fw-bold">Carrera de azar</small>
              </div>
              <span className="display-3">🚗</span>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};