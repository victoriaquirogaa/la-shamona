import { useState } from 'react';
import { Container, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; 

interface Props {
    irA: (pantalla: string) => void; 
}

export const Home = ({ irA }: Props) => {
  const { user, settings, updateSettings, logout } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <Container className="min-vh-100 py-4 d-flex flex-column bg-dark text-white position-relative">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
            <h3 className="fw-black text-warning m-0 fst-italic display-6">EL VIAJERO</h3>
            <small className="text-muted">Tu compañero de gira 🚌</small>
        </div>
        
        {/* PERFIL */}
        <div 
            className="d-flex align-items-center bg-secondary bg-opacity-25 rounded-pill ps-3 pe-1 py-1 border border-secondary" 
            style={{cursor: 'pointer'}}
            onClick={() => setShowConfig(true)}
        >
            <span className="fw-bold me-2 small">{user?.nombre}</span>
            <div className="bg-dark rounded-circle overflow-hidden border border-white d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                {user?.avatar?.startsWith('http') ? (
                    <img src={user.avatar} alt="User" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                    <span style={{fontSize: '1.2rem'}}>{user?.avatar || '😎'}</span>
                )}
            </div>
        </div>
      </div>

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center gap-4">
        
        {/* BOTÓN OFFLINE -> Manda al App.tsx la orden 'menu-offline' */}
        <Button 
            variant="outline-light" size="lg" className="py-4 w-100 fw-bold border-2" style={{maxWidth: '350px'}} 
            onClick={() => irA('menu-offline')} 
        >
            📱 JUEGOS OFFLINE
            <div className="small fw-normal text-muted">Para jugar acá y ahora</div>
        </Button>
        
        {/* BOTÓN ONLINE -> Manda al App.tsx la orden 'menu-online' */}
        <Button 
            variant="warning" size="lg" className="py-4 w-100 fw-bold shadow-lg text-dark" style={{maxWidth: '350px'}} 
            onClick={() => irA('menu-online')}
        >
            🌎 JUGAR ONLINE
            <Badge bg="danger" text="white" className="ms-2 small">Nuevo</Badge>
            <div className="small fw-normal opacity-75">Conectar con amigos lejos</div>
        </Button>

        {/* TRAGOS (Deshabilitado por ahora) */}
        <Button variant="secondary" size="lg" className="py-4 w-100 fw-bold opacity-50" style={{maxWidth: '350px'}} disabled>
            🍹 RECETAS DE TRAGOS
            <div className="small fw-normal opacity-75">Próximamente...</div>
        </Button>
      </div>
      
      <p className="text-center text-muted small mt-4">v2.3 - El Viajero</p>

      {/* MODAL CONFIGURACIÓN */}
      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered contentClassName="bg-dark text-white border-secondary">
        <Modal.Header closeButton closeVariant="white"><Modal.Title>Perfil</Modal.Title></Modal.Header>
        <Modal.Body>
            <div className="text-center mb-4">
                <h3>{user?.nombre}</h3>
                <Button variant="outline-danger" size="sm" onClick={logout}>Cerrar Sesión</Button>
            </div>
            <Form.Group className="mb-3">
                <Form.Label>🔊 Volumen ({settings.volumen}%)</Form.Label>
                <Form.Range value={settings.volumen} onChange={(e) => updateSettings({ volumen: parseInt(e.target.value) })} />
            </Form.Group>
        </Modal.Body>
      </Modal>
    </Container>
  );
};