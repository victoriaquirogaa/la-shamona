import { useState } from 'react';
import { Container, Button, Card, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export const Welcome = () => {
  // Traemos la nueva función loginAnonymously
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
      console.log("1. Iniciando login invitado..."); // <--- AGREGÁ ESTO
      setLoading(true);
      try {
          await loginAnonymously();
          console.log("2. ¡Éxito! Redirigiendo..."); // <--- AGREGÁ ESTO
      } catch (e: any) {
          console.error("3. ERROR FATAL:", e); // <--- AGREGÁ ESTO PARA VER EL ERROR REAL
          console.log("Código de error:", e.code);
          
          setError("No se pudo entrar. Mirá la consola (F12) para ver el error.");
          setLoading(false);
      }
  };

  return (
    <Container className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-white p-4">
      
      <div className="text-center mb-5 animate-in fade-in">
          <h1 className="display-1 fw-black text-warning fst-italic">EL VIAJERO</h1>
          <p className="lead opacity-75">Tu compañero de gira 🚌</p>
      </div>

      <Card className="bg-secondary bg-opacity-10 border-secondary p-4 w-100 shadow-lg" style={{ maxWidth: '400px' }}>
        
        {/* VISTA PRINCIPAL DE BOTONES */}
        {!modoEmail && (
            <>
                {/* 1. GOOGLE */}
                <Button variant="light" size="lg" className="w-100 fw-bold mb-3 d-flex align-items-center justify-content-center gap-2" onClick={loginWithGoogle}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
                    Entrar con Google
                </Button>
                
                {/* 2. EMAIL */}
                <Button variant="outline-light" className="w-100 mb-3" onClick={() => setModoEmail(true)}>
                    ✉️ Usar Email y Contraseña
                </Button>

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                    <span className="mx-2 text-muted small">O bien</span>
                    <hr className="flex-grow-1 border-secondary opacity-25" />
                </div>

                {/* 3. INVITADO (NUEVO) */}
                <Button variant="secondary" size="sm" className="w-100 fw-bold py-2 opacity-75" onClick={handleInvitado} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border"/> : "🕵️ Ingresar como Invitado"}
                </Button>
            </>
        )}

        {/* FORMULARIO DE EMAIL (Igual que antes) */}
        {modoEmail && (
            <Form onSubmit={handleSubmit} className="animate-in fade-in">
                <h4 className="text-center mb-4">{esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}</h4>
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Control type="email" placeholder="Email" required className="bg-dark text-white border-secondary"
                        value={email} onChange={e => setEmail(e.target.value)} />
                </Form.Group>
                
                <Form.Group className="mb-4">
                    <Form.Control type="password" placeholder="Contraseña" required className="bg-dark text-white border-secondary"
                        value={pass} onChange={e => setPass(e.target.value)} />
                </Form.Group>

                <Button variant="warning" type="submit" size="lg" className="w-100 fw-bold mb-3" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border"/> : (esRegistro ? "Registrarse" : "Ingresar")}
                </Button>

                <Button variant="link" className="text-white small d-block mx-auto" onClick={() => setEsRegistro(!esRegistro)}>
                    {esRegistro ? "¿Ya tenés cuenta?" : "¿Crear cuenta nueva?"}
                </Button>
                
                <Button variant="link" className="text-muted small d-block mx-auto mt-2" onClick={() => setModoEmail(false)}>
                    🡠 Volver
                </Button>
            </Form>
        )}

      </Card>
    </Container>
  );
};