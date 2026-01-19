import { useState } from 'react';
import { Container, Badge, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; 
import { useSubscription } from '../context/SubscriptionContext'; // 👈 1. IMPORTAR CONTEXTO
import '../App.css'; 

interface Props {
  irA: (pantalla: string) => void; 
}

export const Home = ({ irA }: Props) => {
  const { user, settings, updateSettings, logout } = useAuth();
  const { isPremium } = useSubscription(); // 👈 2. LEER SI ES VIP
  const [showConfig, setShowConfig] = useState(false);

  return (
    <Container className="d-flex flex-column min-vh-100 p-4">
      
      {/* --- HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-5 animate-in fade-in">
        <div>
            {/* Título con efecto neón */}
            <h2 className="titulo-neon m-0 lh-1">VIAJERO</h2>
            <small className="text-white-50 fst-italic" style={{letterSpacing: '1px'}}>Tu compañero de gira 🚌</small>
        </div>
        
        {/* GRUPO DERECHA: TIENDA + PERFIL */}
        <div className="d-flex align-items-center gap-2">
            
            {/* 👇 3. BOTÓN TIENDA (NUEVO) */}
            <button 
                className={`btn btn-sm rounded-pill fw-bold border-0 animate-pulse ${isPremium ? 'bg-warning text-dark' : 'btn-outline-warning'}`}
                style={{ height: '38px' }} // Misma altura que el perfil
                onClick={() => irA('store')}
            >
                {isPremium ? '👑 VIP' : '💎 TIENDA'}
            </button>

            {/* --- PERFIL (Pill Style) --- */}
            <div 
                className="profile-pill d-flex align-items-center ps-3 pe-1 py-1" 
                style={{cursor: 'pointer'}}
                onClick={() => setShowConfig(true)}
            >
                <span className="fw-bold me-2 small text-info text-uppercase d-none d-sm-block">{user?.nombre}</span>
                <div 
                  className="rounded-circle overflow-hidden border border-info d-flex align-items-center justify-content-center bg-dark" 
                  style={{width: '38px', height: '38px'}}
                >
                    {user?.avatar?.startsWith('http') ? (
                        <img src={user.avatar} alt="User" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                        <span style={{fontSize: '1.2rem'}}>{user?.avatar || '😎'}</span>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- MENÚ PRINCIPAL --- */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center gap-4 w-100">
        
        {/* 1. ONLINE (Destacado) */}
        <button 
            className="btn-neon-main py-4 position-relative"
            style={{maxWidth: '350px'}} 
            onClick={() => irA('menu-online')}
        >
            🌎 JUGAR ONLINE
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle badge rounded-pill">
              NUEVO
            </Badge>
            <div className="small fw-normal text-white-50 mt-1" style={{fontSize: '0.75rem', textTransform: 'none'}}>
              Conectate con amigos a distancia
            </div>
        </button>
        
        {/* 2. OFFLINE */}
        <button 
            className="btn-neon-secondary py-3"
            style={{maxWidth: '350px'}} 
            onClick={() => irA('menu-offline')} 
        >
            📱 JUEGOS OFFLINE
            <div className="small fw-normal text-white-50 mt-1" style={{fontSize: '0.75rem', textTransform: 'none'}}>
               Para jugar en la previa, acá y ahora
            </div>
        </button>

        {/* 3. TRAGOS (Deshabilitado pero fachero) */}
        <div className="w-100 text-center opacity-50" style={{maxWidth: '350px'}}>
            <button className="btn-neon-secondary w-100 py-3" style={{borderColor: '#444', color: '#888', cursor: 'not-allowed'}}>
                🍹 RECETAS DE TRAGOS
            </button>
            <small className="text-muted mt-1 d-block">Próximamente...</small>
        </div>

      </div>
      
      <p className="text-center text-secondary small mt-4 opacity-25">v2.3 - Córdoba</p>

      {/* --- MODAL CONFIGURACIÓN (Estilo Dark) --- */}
      <Modal 
        show={showConfig} 
        onHide={() => setShowConfig(false)} 
        centered 
        dialogClassName="modal-glass" // Clase mágica del CSS
      >
        <Modal.Header closeButton closeVariant="white">
            <Modal.Title className="text-info fw-bold">PERFIL DE JUGADOR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="text-center mb-4">
                <div className="display-1 mb-2">{user?.avatar || '😎'}</div>
                <h3 className="fw-bold text-white">{user?.nombre}</h3>
                
                {/* Etiqueta VIP en el perfil también */}
                {isPremium && <Badge bg="warning" text="dark" className="mb-3">👑 MIEMBRO VIP</Badge>}

                <br/>
                <button className="btn btn-outline-danger btn-sm rounded-pill mt-2 px-4" onClick={logout}>
                    Cerrar Sesión
                </button>
            </div>
            
            <hr className="border-secondary opacity-50" />
            
            <Form.Group className="mb-3">
                <Form.Label className="text-info small fw-bold">VOLUMEN DE EFECTOS ({settings.volumen}%)</Form.Label>
                <Form.Range 
                    value={settings.volumen} 
                    onChange={(e) => updateSettings({ volumen: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--neon-cyan)' }} 
                />
            </Form.Group>
        </Modal.Body>
      </Modal>

    </Container>
  );
};