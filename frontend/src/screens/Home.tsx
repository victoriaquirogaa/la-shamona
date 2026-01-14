import { Container, Row, Col, Card } from 'react-bootstrap';

interface Props {
  navegar: (ruta: string) => void;
}

export const Home = ({ navegar }: Props) => {
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center bg-dark text-white" data-bs-theme="dark">
      <h1 className="display-1 fw-black mb-2" style={{ 
        background: '-webkit-linear-gradient(45deg, #ff00cc, #3333ff)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent' 
      }}>
        EL VIAJERO
      </h1>
      <p className="text-muted mb-5 fs-4">Tu compañero de joda</p>

      <Row className="g-4 w-100 justify-content-center" style={{ maxWidth: '600px' }}>
        
        {/* 1. MODO PREVIA (OFFLINE) */}
        <Col xs={12}>
          <Card 
            className="border-0 shadow-lg text-white mb-2" 
            style={{ cursor: 'pointer', background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)' }}
            onClick={() => navegar('menu-offline')}
          >
            <Card.Body className="p-5 d-flex align-items-center justify-content-between">
              <div className="text-start">
                <h2 className="fw-bold mb-0">🍺 MODO PREVIA</h2>
                <small className="opacity-75">Juegos Offline (Yo Nunca, La Jefa...)</small>
              </div>
              <span className="display-4">🚀</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 2. MODO ONLINE (ACTIVO) */}
        <Col xs={12}>
          <Card 
            className="border-0 shadow-lg text-white mb-2" 
            style={{ cursor: 'pointer', background: 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)' }}
            onClick={() => navegar('menu-online')}
          >
            <Card.Body className="p-5 d-flex align-items-center justify-content-between">
              <div className="text-start">
                <h2 className="fw-bold mb-0">🌎 MODO ONLINE</h2>
                <small className="opacity-75">Crea una sala o únete a tus amigos</small>
              </div>
              <span className="display-4">📶</span>
            </Card.Body>
          </Card>
        </Col>

        {/* 3. TRAGOS (Próximamente) */}
        <Col xs={12}>
          <Card className="bg-dark border-secondary text-secondary" style={{ opacity: 0.7 }}>
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div className="text-start">
                <h3 className="fw-bold mb-0">🍹 TRAGOS</h3>
                <small>Recetas y coctelería (Pronto)</small>
              </div>
              <span className="fs-1">🔒</span>
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  );
};