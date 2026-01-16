import { useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { api } from '../lib/api';
import '../App.css'; // 👈 Importar estilos

interface Props {
  juego: 'yo-nunca' | 'votacion' | 'preguntas';
  volver: () => void;
}

export const JuegoSimple = ({ juego, volver }: Props) => {
  const [modo, setModo] = useState<string | null>(null);
  const [frase, setFrase] = useState("Presioná Siguiente para arrancar");
  const [loading, setLoading] = useState(false);

  // CONFIGURACIÓN VISUAL POR JUEGO
  // Acá definimos título, color de neón y las opciones disponibles
  const config: any = {
    'yo-nunca': { 
        titulo: 'YO NUNCA', 
        icono: '🍺',
        color: '#00d4ff', // Cyan
        opciones: [{id: 'gratis', label: 'MODO CLÁSICO'}] 
    },
    'votacion': { 
        titulo: 'VOTACIÓN', 
        icono: '👉',
        color: '#bd00ff', // Violeta
        opciones: [{id: 'gratis', label: '¿QUIÉN ES?'}, {id: 'rico_pobre', label: 'RICO O POBRE'}] 
    },
    'preguntas': { 
        titulo: 'PREGUNTAS', 
        icono: '🤔',
        color: '#ffd700', // Dorado
        opciones: [{id: 'polemicas', label: 'POLÉMICAS'}, {id: 'profundas', label: 'PROFUNDAS'}] 
    }
  }[juego];

  const sacarCarta = async (categoria: string) => {
    setLoading(true);
    let data;
    try {
        if (juego === 'yo-nunca') data = await api.getFraseYoNunca(categoria);
        else if (juego === 'votacion') data = await api.getFraseVotacion(categoria);
        else if (juego === 'preguntas') data = await api.getPregunta(categoria);
        
        setFrase(data?.texto || "Error de conexión con el servidor.");
    } catch (e) {
        setFrase("Error al buscar frase. Intenta de nuevo.");
    }
    setLoading(false);
  };

  // --- VISTA 1: ELEGIR MODO ---
  if (!modo) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center p-4">
        
        <div className="mb-5 animate-in fade-in">
            <div style={{fontSize: '4rem'}} className="mb-2">{config.icono}</div>
            <h1 className="titulo-neon m-0" style={{
                background: `linear-gradient(90deg, ${config.color}, #ffffff)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 0 20px ${config.color}50` // 50 es transparencia hex
            }}>
                {config.titulo}
            </h1>
        </div>

        <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '400px'}}>
          {config.opciones.map((op: any) => (
            <button 
                key={op.id} 
                className="btn-neon-main py-3 fw-bold fs-5"
                style={{borderColor: config.color, color: config.color}} 
                onClick={() => { setModo(op.id); sacarCarta(op.id); }}
            >
              {op.label}
            </button>
          ))}
          
          <button className="btn btn-link text-white-50 mt-3 text-decoration-none" onClick={volver}>
             🡠 Volver al menú
          </button>
        </div>
      </Container>
    );
  }

  // --- VISTA 2: TARJETA DE JUEGO ---
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center p-4">
      
      {/* HEADER SIMPLE */}
      <div className="w-100 d-flex justify-content-between align-items-center mb-4 px-2 absolute-top-md" style={{maxWidth: '600px'}}>
         <div className="d-flex align-items-center gap-2">
             <span className="fs-4">{config.icono}</span>
             <span className="fw-bold text-uppercase" style={{color: config.color, letterSpacing: '2px'}}>{config.titulo}</span>
         </div>
         <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => setModo(null)}>CAMBIAR</button>
      </div>

      {/* TARJETA PRINCIPAL */}
      <div 
        className="card-shamona w-100 shadow-lg d-flex align-items-center justify-content-center p-4 p-md-5 mb-5 position-relative animate-in zoom-in" 
        style={{ 
            maxWidth: '500px', 
            minHeight: '350px', 
            border: `1px solid ${config.color}`,
            background: 'rgba(0,0,0,0.4)' // Un poco más oscuro para leer bien el texto
        }}
      >
        {/* Decoración de esquinas */}
        <div className="position-absolute top-0 start-0 m-2 border-top border-start" style={{width: '20px', height: '20px', borderColor: config.color}}/>
        <div className="position-absolute top-0 end-0 m-2 border-top border-end" style={{width: '20px', height: '20px', borderColor: config.color}}/>
        <div className="position-absolute bottom-0 start-0 m-2 border-bottom border-start" style={{width: '20px', height: '20px', borderColor: config.color}}/>
        <div className="position-absolute bottom-0 end-0 m-2 border-bottom border-end" style={{width: '20px', height: '20px', borderColor: config.color}}/>

        {loading ? (
            <Spinner animation="grow" variant="light" />
        ) : (
            <h2 className="fw-bold lh-base" style={{textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                {frase}
            </h2>
        )}
      </div>

      {/* CONTROLES */}
      <div className="d-flex gap-3 w-100 justify-content-center" style={{ maxWidth: '500px' }}>
        <button 
            className="btn btn-outline-secondary px-4 fw-bold rounded-pill" 
            onClick={() => setModo(null)}
        >
            ATRÁS
        </button>
        
        <button 
            className="btn-neon-main flex-grow-1 fw-bold fs-5 py-3" 
            style={{
                backgroundColor: config.color, 
                color: '#000', // Texto negro para contraste sobre color brillante
                borderColor: config.color,
                boxShadow: `0 0 15px ${config.color}80`
            }}
            onClick={() => sacarCarta(modo)}
            disabled={loading}
        >
            {loading ? 'CARGANDO...' : 'SIGUIENTE ➔'}
        </button>
      </div>
    </Container>
  );
};