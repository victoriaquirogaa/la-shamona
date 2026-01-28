import { useState } from 'react';
import { Container, Modal, Form, Badge, Button, InputGroup } from 'react-bootstrap';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSound } from '../context/SoundContext';
import { updateProfile } from 'firebase/auth'; // Import for updating Firebase profile
import { auth } from '../lib/firebase'; // Import auth instance
import { api } from '../lib/api';
import '../App.css';

interface Props {
  irA: (pantalla: string) => void;
}

export const Home = ({ irA }: Props) => {
  const { user, logout } = useAuth();
  const { isPremium, esAmigo, accesoVip } = useSubscription();
  const { sonidoHabilitado, vibracionHabilitada, toggleSonido, toggleVibracion } = useSound();

  const [showConfig, setShowConfig] = useState(false);
  
  // States for name editing
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  // Function to save the new name
  const guardarNombre = async () => {
    if (!nuevoNombre.trim() || !auth.currentUser) return;
    setGuardandoNombre(true);
    try {
        // 1. Update in Firebase Auth
        await updateProfile(auth.currentUser, { displayName: nuevoNombre });
        
        // 2. Update in your Backend Database
        if (user?.uid) {
            await api.actualizarNombreUsuario(user.uid, nuevoNombre);
        }
        
        // 3. Force a reload to reflect changes (simple way)
        window.location.reload(); 
        
    } catch (e) {
        console.error(e);
        alert("Error al cambiar nombre");
    }
    setGuardandoNombre(false);
    setEditandoNombre(false);
  };

  const activarEdicion = () => {
      setNuevoNombre(user?.nombre || "");
      setEditandoNombre(true);
  };

  return (
    <Container className="d-flex flex-column min-vh-100 p-4 justify-content-center align-items-center text-center">
      
      {/* --- HEADER (Perfil + Tienda) --- */}
      <div className="position-absolute top-0 end-0 m-3 d-flex gap-2 align-items-center" style={{ zIndex: 10 }}>
           
           {/* BOTÓN TIENDA */}
           <button 
                className={`btn btn-sm rounded-pill fw-bold border-0 animate-pulse d-flex align-items-center gap-1 ${accesoVip ? 'bg-warning text-dark' : 'btn-outline-warning'}`}
                style={{ height: '38px', paddingLeft: '12px', paddingRight: '12px' }} 
                onClick={() => irA('store')}
            >
                {accesoVip ? '👑 VIP' : '💎 TIENDA'}
            </button>

           {/* BOTÓN PERFIL (Avatar) */}
           <div onClick={() => setShowConfig(true)} style={{cursor: 'pointer'}}>
                {user?.photoURL ? (
                    <img 
                        src={user.photoURL} 
                        alt="Perfil" 
                        className="rounded-circle border border-2 border-info shadow"
                        style={{width: '40px', height: '40px', objectFit: 'cover'}} 
                    />
                ) : (
                    <div className="btn btn-dark rounded-circle border border-secondary d-flex align-items-center justify-content-center" 
                         style={{width: '40px', height: '40px'}}>
                        👤
                    </div>
                )}
           </div>
      </div>

      {/* --- LOGO PRINCIPAL --- */}
      <div className="mb-5 animate-in zoom-in">
       <div className="d-flex align-items-center justify-content-center mb-2 animate-in zoom-in">
        
        {/* Imagen del Logo */}
        <img 
            src={logo} 
            alt="Logo" 
            className="me-0 animate-pulse"
            style={{ 
                // 👇 CAMBIÁ ESTE VALOR 👇
            height: '100px',  // Probá 90px, 100px o 110px
            width: 'auto',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.5))' 
            }} 
        />

        {/* Título */}
        <h1 className="titulo-neon display-3 fw-bold mb-0">VIAJERO</h1>
    </div>
        <p className="text-white-50 fs-5 ls-2 fst-italic">Tu compañero de gira 🍻</p>
      </div>
      
      {/* --- MENÚ DE JUEGOS --- */}
      <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '350px'}}>
        
        {/* 1. ONLINE */}
        <button 
            className="btn-neon-secondary py-3 fs-5 fw-bold position-relative" 
            onClick={() => irA('menu-online')}
        >
            🌐 JUGAR ONLINE
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-dark">
               NUEVO
            </Badge>
        </button>
        
        {/* 2. OFFLINE */}
        <button 
            className="btn-neon-main py-3 fs-5 fw-bold" 
            onClick={() => irA('menu-offline')} 
        >
            📱 JUGAR EN ESTE CELU
        </button>

        {/* 3. TRAGOS (Próximamente) */}
        <div className="opacity-50 mt-2">
            <button className="btn btn-outline-secondary w-100 py-2 border-dashed" style={{cursor: 'not-allowed'}}>
                🍹 Recetas de Tragos (Pronto)
            </button>
        </div>

      </div>
      
      <p className="text-secondary small mt-5 opacity-25">v2.4 - Córdoba</p>

      {/* --- MODAL DE PERFIL (Rediseñado con Edición) --- */}
      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered dialogClassName="modal-glass">
        <Modal.Header closeButton closeVariant="white" className="border-0">
            <Modal.Title className="text-info fw-bold w-100 text-center">MI PERFIL</Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center px-4 pb-4">
            
            {/* 1. FOTO GRANDE */}
            <div className="position-relative d-inline-block mb-3">
                {user?.photoURL ? (
                    <img 
                        src={user.photoURL} 
                        alt="Avatar" 
                        className="rounded-circle border border-2 border-white shadow-lg"
                        style={{width: '90px', height: '90px', objectFit: 'cover'}}
                    />
                ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center border border-2 border-white mx-auto" 
                         style={{width: '90px', height: '90px', fontSize: '2.5rem'}}>
                        👤
                    </div>
                )}
                {/* Coronita si es VIP */}
                {accesoVip && (
                    <div className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-warning border border-dark text-dark" style={{fontSize: '1.2rem'}}>
                        👑
                    </div>
                )}
            </div>

            {/* ✏️ ZONA DE NOMBRE EDITABLE */}
            {editandoNombre ? (
                <InputGroup className="mb-3 justify-content-center">
                    <Form.Control 
                        autoFocus
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        className="text-center bg-dark text-white border-info"
                        style={{maxWidth: '200px'}}
                    />
                    <Button variant="success" onClick={guardarNombre} disabled={guardandoNombre}>
                        {guardandoNombre ? '...' : '💾'}
                    </Button>
                </InputGroup>
            ) : (
                <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                    <h4 className="text-white fw-bold m-0">{user?.nombre || "Viajero Anónimo"}</h4>
                    <span style={{cursor:'pointer', opacity: 0.7}} onClick={activarEdicion}>✏️</span>
                </div>
            )}

            <p className="text-white-50 small mb-4 text-truncate" style={{maxWidth: '250px', margin: '0 auto'}}>
                {user?.email || "Sin email registrado"}
            </p>

            {/* 2. ESTADO SUSCRIPCIÓN */}
            <div className="card-shamona p-3 mb-4 border-secondary bg-black bg-opacity-25">
                <small className="text-white-50 text-uppercase fw-bold ls-2" style={{fontSize: '0.7rem'}}>ESTADO ACTUAL</small>
                <div className="mt-2">
                    {isPremium ? (
                        <span className="badge bg-warning text-dark fs-6 py-2 px-3">👑 PREMIUM MEMBER</span>
                    ) : esAmigo ? (
                        <span className="badge bg-info text-dark fs-6 py-2 px-3">🤝 ACCESO AMIGO VIP</span>
                    ) : (
                        <span className="badge bg-secondary text-white fs-6 py-2 px-3">GRATUITO</span>
                    )}
                </div>
                {/* Botón para ir a tienda si no es VIP */}
                {!accesoVip && (
                    <button className="btn btn-sm btn-link text-warning text-decoration-none mt-2" onClick={() => { setShowConfig(false); irA('store'); }}>
                        💎 Conseguir Premium
                    </button>
                )}
            </div>

            {/* 3. CONFIGURACIÓN SONIDO */}
            <div className="text-start mb-4">
                <p className="text-white-50 small fw-bold mb-2 ms-1 text-uppercase">Preferencias</p>
                
                <div className="d-flex justify-content-between align-items-center p-3 rounded bg-dark bg-opacity-50 mb-2 border border-secondary">
                    <span className="text-white d-flex align-items-center gap-2">🔊 Efectos de Sonido</span>
                    <Form.Check 
                        type="switch"
                        checked={sonidoHabilitado}
                        onChange={toggleSonido}
                        style={{ transform: 'scale(1.3)' }}
                    />
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 rounded bg-dark bg-opacity-50 border border-secondary">
                    <span className="text-white d-flex align-items-center gap-2">📳 Vibración</span>
                    <Form.Check 
                        type="switch"
                        checked={vibracionHabilitada}
                        onChange={toggleVibracion}
                        style={{ transform: 'scale(1.3)' }}
                    />
                </div>
            </div>

            <button className="btn btn-outline-danger w-100 rounded-pill py-2" onClick={logout}>
                Cerrar Sesión
            </button>

        </Modal.Body>
      </Modal>

    </Container>
  );
};