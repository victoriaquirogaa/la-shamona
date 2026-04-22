import { useState } from 'react';
import { Container, Modal, Form, Badge, Button, InputGroup } from 'react-bootstrap';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSound } from '../context/SoundContext';
import { updateProfile, deleteUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';
import '../App.css';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import TopBar from '../components/TopBar';

interface Props {
  irA: (pantalla: string) => void;
}

export const Home = ({ irA }: Props) => {
  const { user, logout, actualizarNombreLocal, actualizarAvatarLocal } = useAuth();
  const { isPremium, esAmigo, accesoVip } = useSubscription();
  const { sonidoHabilitado, vibracionHabilitada, toggleSonido, toggleVibracion } = useSound();

  const [showConfig, setShowConfig] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Avatar
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [guardandoAvatar, setGuardandoAvatar] = useState(false);

  // Avatares disponibles (emojis → URL de twemoji para que se vean igual en todos los dispositivos)
  const AVATARES = [
    '🐻','🦊','🐯','🐸','🐧','🦁','🐼','🐨',
    '🦄','🐙','🦋','🐺','🐮','🐵','🦝','🤠',
    '👾','🤖','💀','🧠','🎃','🔥','⚡','🍻'
  ];

  const elegirAvatar = async (emoji: string) => {
    if (!auth.currentUser || !user?.uid) return;
    setGuardandoAvatar(true);
    try {
      // Guardamos el emoji como string en Firestore y en Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: emoji });
      await api.actualizarUsuario(user.uid, { avatar: emoji });
      actualizarAvatarLocal(emoji);
      setShowAvatarPicker(false);
    } catch (e) {
      console.error('Error cambiando avatar:', e);
      alert('No se pudo cambiar el avatar');
    }
    setGuardandoAvatar(false);
  };

  
  // States for name editing
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  
  // State for delete loading
  const [eliminando, setEliminando] = useState(false);

  // Function to save the new name
  const guardarNombre = async () => {
    if (!nuevoNombre.trim() || !auth.currentUser) return;
    setGuardandoNombre(true);
    try {
        await updateProfile(auth.currentUser, { displayName: nuevoNombre });
        if (user?.uid) {
            await api.actualizarNombreUsuario(user.uid, nuevoNombre);
        }
        // Update local state without a full page reload
        actualizarNombreLocal(nuevoNombre);
        setEditandoNombre(false);
    } catch (e) {
        console.error(e);
        alert("Error al cambiar nombre");
    }
    setGuardandoNombre(false);
  };

  // 1. Al tocar el botón rojo, solo mostramos el modal (ya no salta la alerta del navegador)
  const abrirConfirmacionBorrado = () => {
      setShowDeleteModal(true);
  };

  // 2. Esta función se ejecuta cuando le dan al "SÍ" en el modal nuevo
  const confirmarEliminacionDefinitiva = async () => {
    setEliminando(true);
    try {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const db = getFirestore(); 
        
        // 🔍 DIAGNÓSTICO: Miremos en la consola qué va a pasar
        console.log("1. ID del usuario a borrar:", uid);
        console.log("2. Buscando en colección: 'usuarios'"); // <--- OJO ACÁ

        // PASO A: Borrar de Firestore
        const docRef = doc(db, "usuarios", uid); // Colección correcta
        
        try {
            await deleteDoc(docRef);
            console.log("✅ ¡Éxito! Documento eliminado de la BD.");
        } catch (dbError) {
            console.error("❌ ERROR CRÍTICO al borrar BD:", dbError);
            alert("No pudimos borrar tus datos. ¿Revisaste tu conexión?");
            setEliminando(false); // Frenamos acá para no borrar el login si falló la BD
            return; 
        }

        // PASO B: Borrar usuario de Firebase Auth
        console.log("3. Borrando cuenta de autenticación...");
        await deleteUser(auth.currentUser);
        
        // PASO C: Cerrar
        setShowDeleteModal(false);
        setShowConfig(false);
        logout();
        alert("Cuenta eliminada correctamente.");
      }
    } catch (error: any) {
      console.error("Error general:", error);
      // Si pide re-login
      if (error.code === 'auth/requires-recent-login') {
        alert("Por seguridad, cerrá sesión y volvé a entrar para eliminar tu cuenta.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setEliminando(false);
    }
  };

  const activarEdicion = () => {
      setNuevoNombre(user?.nombre || "");
      setEditandoNombre(true);
  };

  return (
    <Container className="d-flex flex-column min-vh-100 p-0 justify-content-center align-items-center text-center">
      
      {/* --- HEADER UNIFICADO --- */}
      <TopBar
        titulo="VIAJERO"
        color="var(--neon-cyan, #66fcf1)"
        onAvatarClick={() => setShowConfig(true)}
      />
      <div className="topbar-spacer" />

      {/* Botón VIP/Tienda flotante (esquina sup. derecha, extra) */}
      <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 20, marginTop: '60px' }}>
        <button
          className={`btn btn-sm rounded-pill fw-bold border-0 d-flex align-items-center gap-1 ${accesoVip ? 'bg-warning text-dark animate-pulse' : 'btn-outline-warning'}`}
          style={{ height: '34px', paddingLeft: '12px', paddingRight: '12px' }}
          onClick={() => irA('store')}
        >
          {accesoVip ? '👑 VIP' : '💎 TIENDA'}
        </button>
      </div>

      {/* --- LOGO --- */}
      <div className="mb-5 animate-in zoom-in">
       <div className="d-flex align-items-center justify-content-center mb-2 animate-in zoom-in">
        <img 
            src={logo} 
            alt="Logo" 
            className="me-0 animate-pulse"
            style={{ 
            height: '100px', 
            width: 'auto',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.5))' 
            }} 
        />
        <h1 className="titulo-neon display-3 fw-bold mb-0">VIAJERO</h1>
    </div>
        <p className="text-white-50 fs-5 ls-2 fst-italic">Tu compañero de gira 🍻</p>
      </div>
      
      {/* --- MENÚ --- */}
      <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '350px'}}>
        <button 
            className="btn-neon-secondary py-3 fs-5 fw-bold position-relative" 
            onClick={() => irA('menu-online')}
        >
            🌐 JUGAR ONLINE
            <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle badge rounded-pill border border-dark">
               NUEVO
            </Badge>
        </button>
        <button 
            className="btn-neon-main py-3 fs-5 fw-bold" 
            onClick={() => irA('menu-offline')} 
        >
            📱 JUGAR EN ESTE CELU
        </button>
        <div className="mt-2">
            <button 
                className="btn btn-outline-info w-100 py-2 border-dashed" // Le puse un color 'info' para que destaque
                onClick={() => irA('bebidas')} // 👈 ESTA ES LA MAGIA
            >
                🍹 Recetas de Tragos
            </button>
        </div>
      </div>
      
      <p className="text-secondary small mt-5 opacity-25">v2.4 - Córdoba</p>

      {/* --- MODAL DE PERFIL --- */}
      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered dialogClassName="modal-glass">
        <Modal.Header closeButton closeVariant="white" className="border-0">
            <Modal.Title className="text-info fw-bold w-100 text-center">MI PERFIL</Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center px-4 pb-4">
            
            <div className="position-relative d-inline-block mb-3">
                {/* AVATAR: emoji o foto de Google */}
                <div 
                  onClick={() => setShowAvatarPicker(true)}
                  style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                  title="Cambiar avatar"
                >
                  {user?.photoURL && !user.photoURL.startsWith('http') ? (
                    // Es un emoji guardado
                    <div 
                      className="rounded-circle border border-2 border-white shadow-lg d-flex align-items-center justify-content-center"
                      style={{ width: '90px', height: '90px', fontSize: '3rem', background: 'rgba(255,255,255,0.1)' }}
                    >
                      {user.photoURL}
                    </div>
                  ) : user?.photoURL ? (
                    // Es una foto de Google
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="rounded-circle border border-2 border-white shadow-lg"
                      style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center border border-2 border-white mx-auto"
                         style={{ width: '90px', height: '90px', fontSize: '2.5rem' }}>
                      👤
                    </div>
                  )}
                  {/* Botón cámara encima */}
                  <div 
                    className="position-absolute bottom-0 end-0 rounded-circle bg-info d-flex align-items-center justify-content-center border border-2 border-dark"
                    style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                  >
                    {guardandoAvatar ? '⏳' : '✏️'}
                  </div>
                </div>

                {accesoVip && (
                    <div className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-warning border border-dark text-dark" style={{fontSize: '1.2rem'}}>
                        👑
                    </div>
                )}
            </div>

            {/* === GRID SELECTOR DE AVATAR === */}
            {showAvatarPicker && (
              <div className="card-shamona p-3 mb-3 animate-in zoom-in" style={{ border: '1px solid rgba(0,212,255,0.4)' }}>
                <small className="text-info text-uppercase fw-bold d-block mb-2" style={{ letterSpacing: '1px' }}>ELEGÍ TU AVATAR</small>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {AVATARES.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => elegirAvatar(emoji)}
                      disabled={guardandoAvatar}
                      className="btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '48px', height: '48px', fontSize: '1.6rem',
                        border: user?.photoURL === emoji ? '2px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.15)',
                        boxShadow: user?.photoURL === emoji ? '0 0 8px var(--neon-cyan)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button 
                  className="btn btn-link text-white-50 small mt-2 text-decoration-none"
                  onClick={() => setShowAvatarPicker(false)}
                >
                  Cancelar
                </button>
              </div>
            )}


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
                {!accesoVip && (
                    <button className="btn btn-sm btn-link text-warning text-decoration-none mt-2" onClick={() => { setShowConfig(false); irA('store'); }}>
                        💎 Conseguir Premium
                    </button>
                )}
            </div>

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

            <div className="d-grid gap-3">
                <button className="btn btn-outline-light rounded-pill py-2" onClick={logout}>
                    Cerrar Sesión
                </button>
                
                {/* 🔴 BOTÓN QUE ABRE EL NUEVO MODAL */}
                <div className="border-top border-secondary pt-3 mt-2">
                     <button 
                        className="btn btn-danger btn-sm bg-transparent border-0 text-danger opacity-75 hover-opacity-100" 
                        onClick={abrirConfirmacionBorrado}
                        disabled={eliminando}
                        style={{fontSize: '0.85rem'}}
                     >
                        🗑 Eliminar mi cuenta definitivamente
                     </button>
                </div>
            </div>

        </Modal.Body>
      </Modal>

      {/* --- NUEVO MODAL: CONFIRMACIÓN DE BORRADO --- */}
      {/* Este es el cartel "de la app" que reemplaza al del navegador */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header className="bg-dark border-secondary text-white">
          <Modal.Title className="text-danger fw-bold">⚠ ELIMINAR CUENTA</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white text-center p-4">
          <p className="fs-5">¿Estás seguro que querés hacer esto?</p>
          <p className="text-white-50 small">
            Se perderá tu suscripción, tus estadísticas y todo tu historial de forma <b>permanente</b>. 
            No hay vuelta atrás. 💀
          </p>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary d-flex justify-content-center gap-3">
          <Button variant="outline-light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmarEliminacionDefinitiva} 
            disabled={eliminando}
            className="rounded-pill px-4 fw-bold"
          >
            {eliminando ? 'Borrando...' : 'Sí, Eliminar Todo'}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};