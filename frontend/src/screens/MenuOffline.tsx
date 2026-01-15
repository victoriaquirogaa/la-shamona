import { useState } from 'react';
import { Container, Button } from 'react-bootstrap';

interface Props {
  irA: (pantalla: string) => void;
  volver: () => void;
}

export const MenuOffline = ({ irA, volver }: Props) => {
  // Estado para saber si mostramos el menú principal o las opciones de votación
  const [modoVotacion, setModoVotacion] = useState(false);

  return (
    <Container className="min-vh-100 py-4 d-flex flex-column bg-dark text-white" data-bs-theme="dark">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-light" className="me-3 rounded-circle" onClick={volver}>🡠</Button>
        <h2 className="fw-bold m-0 text-white">Juegos Offline</h2>
      </div>

      <div className="flex-grow-1 d-flex flex-column gap-3 align-items-center">
        
        {/* --- LISTA PRINCIPAL --- */}
        {!modoVotacion ? (
            <>
                {/* 1. LA JEFA */}
                <Button variant="danger" size="lg" className="w-100 py-3 fw-bold shadow text-start ps-4" style={{maxWidth: '400px'}} 
                    onClick={() => irA('lajefa')}>
                    👠 LA JEFA
                </Button>

                {/* 2. PEAJE */}
                <Button variant="warning" size="lg" className="w-100 py-3 fw-bold shadow text-dark text-start ps-4" style={{maxWidth: '400px'}} 
                    onClick={() => irA('peaje')}>
                    🚧 PEAJE
                </Button>

                {/* 3. YO NUNCA */}
                <Button variant="primary" size="lg" className="w-100 py-3 fw-bold shadow text-start ps-4" style={{maxWidth: '400px'}} 
                    onClick={() => irA('juego-simple')}>
                    🍺 YO NUNCA
                </Button>

                {/* 4. PREGUNTAS (Nuevo) */}
                <Button variant="info" size="lg" className="w-100 py-3 fw-bold shadow text-dark text-start ps-4" style={{maxWidth: '400px'}} 
                    onClick={() => irA('preguntas')}>
                    ❓ PREGUNTAS
                </Button>

                {/* 5. IMPOSTOR (Nuevo) */}
                <Button variant="secondary" size="lg" className="w-100 py-3 fw-bold shadow text-start ps-4" style={{maxWidth: '400px'}} 
                    onClick={() => irA('impostor')}>
                    🕵️ IMPOSTOR
                </Button>

                {/* 6. VOTACIÓN (Abre submenú) */}
                <Button variant="light" size="lg" className="w-100 py-3 fw-bold shadow text-dark text-start ps-4 border-warning" style={{maxWidth: '400px'}} 
                    onClick={() => setModoVotacion(true)}>
                    🗳️ VOTACIÓN ➔
                </Button>
            </>
        ) : (
            /* --- SUB-MENÚ VOTACIÓN --- */
            <div className="w-100 d-flex flex-column gap-3 align-items-center animate-in fade-in">
                <div className="w-100 d-flex justify-content-between align-items-center" style={{maxWidth: '400px'}}>
                    <h4 className="m-0 text-warning">Modos de Votación</h4>
                    <Button variant="outline-light" size="sm" onClick={() => setModoVotacion(false)}>🡠 Volver</Button>
                </div>

                {/* 6.1 RICO O POBRE */}
                <Button variant="warning" size="lg" className="w-100 py-4 fw-bold shadow text-dark" style={{maxWidth: '400px'}} 
                    onClick={() => irA('rico-pobre')}>
                    💸 MUY RICO O MUY POBRE
                </Button>

                {/* 6.2 MÁS PROBABLE */}
                <Button variant="warning" size="lg" className="w-100 py-4 fw-bold shadow text-dark" style={{maxWidth: '400px'}} 
                    onClick={() => irA('mas-probable')}>
                    🤔 MÁS PROBABLE QUE...
                </Button>
            </div>
        )}

      </div>
    </Container>
  );
};