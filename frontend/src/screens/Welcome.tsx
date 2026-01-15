import { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export const Welcome = () => {
  const { login } = useAuth();
  const [inputNombre, setInputNombre] = useState("");

  const handleIngresar = () => {
    if (!inputNombre.trim()) return alert("¡Dinos cómo te llamas!");
    login(inputNombre); // Esto actualiza el contexto y nos manda al menú
  };

  return (
    <Container className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-dark text-white">
      <h1 className="display-1 mb-4">🍻</h1>
      <h2 className="fw-bold text-danger mb-5">LA JEFA</h2>
      
      <Card className="bg-dark border-secondary p-4 shadow-lg w-100" style={{ maxWidth: '400px' }}>
        <Card.Body>
            <h5 className="text-center mb-4">¿Quién va a beber hoy?</h5>
            <Form.Group className="mb-4">
                <Form.Control 
                    size="lg" 
                    placeholder="Tu Nombre / Apodo" 
                    className="text-center bg-dark text-white border-secondary fw-bold"
                    value={inputNombre}
                    onChange={(e) => setInputNombre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIngresar()}
                />
            </Form.Group>
            <Button variant="danger" size="lg" className="w-100 fw-bold" onClick={handleIngresar}>
                ENTRAR AL BAR ➔
            </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};