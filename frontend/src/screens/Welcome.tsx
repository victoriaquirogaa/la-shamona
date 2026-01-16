import { useState } from 'react';
import { Container, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // 👈 Importante para los estilos neon

export const Welcome = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAnonymously } = useAuth();
  
  const [modoEmail, setModoEmail] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
          if (esRegistro) await registerWithEmail(email, pass);
          else await loginWithEmail(email, pass);
      } catch (err: any) {
          console.error(err);
          setError("Error al ingresar. Verificá tus datos.");
      }
      setLoading(false);
  };

  const handleInvitado = async () => {
      console.log("1. Iniciando login invitado...");
      setLoading(true);
      try {
          await loginAnonymously();
          console.log("2. ¡Éxito! Redirigiendo...");
      } catch (e: any) {
          console.error("3. ERROR FATAL:", e);
          console.log("Código de error:", e.code);
          setError("No se pudo entrar. Mirá la consola.");
          setLoading(false);
      }
  };

  return (
    <Container className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4">
      
      {/* --- TÍTULO --- */}
      <div className="text-center mb-5 animate-in fade-in">
          <h1 className="display-3 titulo-neon mb-0">EL VIAJERO</h1>
          <p className="text-white-50" style={{letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem'}}>
            Tu compañero de gira 🚌
          </p>
      </div>

      {/* --- TARJETA DE VIDRIO (Reemplaza al Card de Bootstrap) --- */}
      <div className="card-shamona p-4 p-md-5 w-100 shadow-lg animate-in zoom-in" style={{ maxWidth: '400px' }}>
        
        {/* VISTA PRINCIPAL DE BOTONES */}
        {!modoEmail && (
            <div className="d-grid gap-3">
                {/* 1. GOOGLE (Estilo limpio para resaltar) */}
                <button 
                    className="btn-google py-2 d-flex align-items-center justify-content-center gap-2 border-0 w-100" 
                    onClick={loginWithGoogle}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
                    Entrar con Google
                </button>
                
                {/* 2. EMAIL (Botón Neón Principal) */}
                <button 
                    className="btn-neon-main" 
                    onClick={() => setModoEmail(true)}
                >
                    ✉️ USAR EMAIL
                </button>

                <div className="d-flex align-items-center my-1 opacity-25">
                    <hr className="flex-grow-1 border-white" />
                    <span className="mx-2 text-white small">O</span>
                    <hr className="flex-grow-1 border-white" />
                </div>

                {/* 3. INVITADO (Botón Neón Secundario) */}
                <button 
                    className="btn-neon-secondary py-2" 
                    onClick={handleInvitado} 
                    disabled={loading}
                    style={{fontSize: '0.9rem'}}
                >
                    {loading ? <Spinner size="sm" animation="border"/> : "🕵️ ENTRAR COMO INVITADO"}
                </button>
            </div>
        )}

        {/* FORMULARIO DE EMAIL */}
        {modoEmail && (
            <Form onSubmit={handleSubmit} className="animate-in fade-in">
                <h4 className="text-center mb-4 text-info fw-bold text-uppercase">
                    {esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
                </h4>
                
                {error && <Alert variant="danger" className="py-2 small bg-danger text-white border-0">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Control 
                        type="email" 
                        placeholder="Email" 
                        required 
                        className="bg-dark text-white border-secondary rounded-pill px-4"
                        style={{background: 'rgba(0,0,0,0.5)'}}
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                </Form.Group>
                
                <Form.Group className="mb-4">
                    <Form.Control 
                        type="password" 
                        placeholder="Contraseña" 
                        required 
                        className="bg-dark text-white border-secondary rounded-pill px-4"
                        style={{background: 'rgba(0,0,0,0.5)'}}
                        value={pass} 
                        onChange={e => setPass(e.target.value)} 
                    />
                </Form.Group>

                <button 
                    type="submit" 
                    className="btn-neon-main w-100 mb-3" 
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" animation="border"/> : (esRegistro ? "REGISTRARSE" : "INGRESAR")}
                </button>

                <div className="text-center d-flex flex-column gap-2">
                    <button 
                        type="button"
                        className="btn btn-link text-white-50 text-decoration-none small" 
                        onClick={() => setEsRegistro(!esRegistro)}
                    >
                        {esRegistro ? "¿Ya tenés cuenta? Ingresá" : "¿No tenés cuenta? Registrate"}
                    </button>
                    
                    <button 
                        type="button"
                        className="btn btn-link text-secondary text-decoration-none small" 
                        onClick={() => setModoEmail(false)}
                    >
                        🡠 Volver atrás
                    </button>
                </div>
            </Form>
        )}

      </div>
      
      {/* Footer sutil */}
      <div className="mt-5 text-white-50 small opacity-25">
        v2.4 • La Shamona
      </div>
    </Container>
  );
};