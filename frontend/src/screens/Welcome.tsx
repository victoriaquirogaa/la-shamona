import { useState } from 'react';
import { Container, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api'; // 👈 1. IMPORTAMOS LA API
import '../App.css'; 

export const Welcome = () => {
  // Asumimos que tus funciones de login devuelven la credencial (UserCredential)
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAnonymously } = useAuth();
  
  const [modoEmail, setModoEmail] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 2. HANDLER PARA GOOGLE (Nuevo) ---
  const handleGoogleLogin = async () => {
      setError("");
      try {
          // 👇 AGREGAMOS ": any" AQUÍ
          const result: any = await loginWithGoogle();
          
          if (result && result.user) {
              await api.sincronizarUsuario(result.user);
          }
      } catch (err) { console.error(err); }
  };

  // --- 3. HANDLER PARA EMAIL/PASSWORD ---
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
          // 👇 AGREGAMOS ": any" AQUÍ TAMBIÉN
          let result: any;
          
          if (esRegistro) {
              result = await registerWithEmail(email, pass);
          } else {
              result = await loginWithEmail(email, pass);
          }

          if (result && result.user) {
              await api.sincronizarUsuario(result.user);
          }

      } catch (err: any) {
          console.error(err);
          // Traducimos errores comunes de Firebase
          if (err.code === 'auth/wrong-password') setError("Contraseña incorrecta.");
          else if (err.code === 'auth/user-not-found') setError("Usuario no encontrado.");
          else if (err.code === 'auth/email-already-in-use') setError("Ese email ya está registrado.");
          else setError("Error al ingresar. Verificá tus datos.");
      }
      setLoading(false);
  };

  // --- 4. HANDLER PARA INVITADO ---
  const handleInvitado = async () => {
      console.log("1. Iniciando login invitado...");
      setLoading(true);
      try {
          // 👇 Y AQUÍ TAMBIÉN
          const result: any = await loginAnonymously();
          
          if (result && result.user) {
              await api.sincronizarUsuario(result.user);
          }
          console.log("2. ¡Éxito! Usuario guardado.");
      } catch (e: any) {
          console.error("3. ERROR FATAL:", e);
          setError("No se pudo entrar como invitado.");
      }
      setLoading(false);
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

      {/* --- TARJETA DE VIDRIO --- */}
      <div className="card-shamona p-4 p-md-5 w-100 shadow-lg animate-in zoom-in" style={{ maxWidth: '400px' }}>
        
        {/* VISTA PRINCIPAL DE BOTONES */}
        {!modoEmail && (
            <div className="d-grid gap-3">
                {/* 1. GOOGLE */}
                <button 
                    className="btn-google py-2 d-flex align-items-center justify-content-center gap-2 border-0 w-100" 
                    onClick={handleGoogleLogin} 
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
                    Entrar con Google
                </button>
                
                {/* 2. EMAIL */}
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

                {/* 3. INVITADO */}
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