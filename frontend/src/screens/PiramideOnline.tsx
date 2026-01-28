import { useState, useEffect } from 'react';
import { Container, Spinner, Row, Col } from 'react-bootstrap';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext'; 

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string };
  salir: () => void;
  volver: () => void; // 👈 Ya estaba agregada
}

// 👇 AGREGAMOS 'volver' AQUÍ TAMBIÉN
export const PiramideOnline = ({ datos, salir, volver }: Props) => {
  
  // 👇 CAMBIO 1: Usamos 'sinAnuncios' (Premium + Amigos)
  const { sinAnuncios } = useSubscription(); 
  
  const [sala, setSala] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ultimoIdMostrado, setUltimoIdMostrado] = useState(""); 

  // --- SYNC ---
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        if (data && data.datos_juego) setSala(data);
      } catch (e) { console.error("Error sync:", e); }
    }, 2000);
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  // --- EFECTO TRAGOS (POPUP) ---
  useEffect(() => {
    const rev = sala?.datos_juego?.ultima_revelacion;
    if (rev && rev.id_accion !== ultimoIdMostrado) {
      setUltimoIdMostrado(rev.id_accion);
      
      if (rev.consecuencias.length > 0) {
        const msj = rev.consecuencias.map((c: any) => 
            `• ${c.jugador}: ${c.accion} ${c.cantidad} (${c.motivo})`
        ).join('\n');

        Swal.fire({
          title: `¡Salió el ${rev.carta}!`,
          text: msj,
          icon: 'info', 
          timer: 4000,
          showConfirmButton: false,
          background: '#212529',
          color: '#fff',
          backdrop: `rgba(255,85,0,0.2)`
        });
      }
    }
  }, [sala]);

  // --- SALIR CON ANUNCIO (PROTEGIDO) ---
  const handleSalir = async () => {
      // 👈 CAMBIO 2: Usamos sinAnuncios
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      salir();
  };

  const handleFinalizar = async () => {
      // 👈 CAMBIO 3: Usamos sinAnuncios
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      // 👇 IMPORTANTE: Volvemos al lobby en el FRONTEND primero
      volver(); 
      // Y luego le avisamos al BACKEND que termine el juego para todos
      await api.finalizarJuegoOnline(datos.codigo);
  };

  if (!sala || !sala.datos_juego) return <Container className="min-vh-100 d-flex justify-content-center align-items-center bg-dark"><Spinner animation="border" variant="warning"/></Container>;

  const p = sala.datos_juego;
  const esMiTurno = sala.jugadores[p.turno_jugador_idx] === datos.nombre;
  const misCartas = p.datos_jugadores?.[datos.nombre]?.cartas || [];

  const handleApuesta = async (valor: string) => {
    setLoading(true);
    try {
      const res = await api.apostarPiramide(datos.codigo, datos.nombre, valor);
      await Swal.fire({
        title: `Salió un ${res.carta_salio}`,
        text: res.mensaje_resultado,
        icon: res.beber ? 'error' : 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#212529',
        color: '#fff'
      });
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleVoltear = async () => {
    try { await api.voltearCarta(datos.codigo); } catch (e) { console.error(e); }
  };

  // --- VISTA FASE 1: APUESTAS ---
  const renderRecoleccion = () => (
    <div className="card-shamona p-4 mb-3 shadow-lg w-100 animate-in slide-up" style={{maxWidth: '450px', border: '1px solid #ff5500'}}>
      <h6 className="text-white-50 text-uppercase ls-2 mb-1">TURNO DE {esMiTurno ? "TI" : sala.jugadores[p.turno_jugador_idx]}</h6>
      <h3 className="fw-black text-warning mb-4 text-uppercase" style={{textShadow: '0 0 10px #ff5500'}}>{p.mensaje}</h3>
      
      {esMiTurno ? (
        <div className="d-grid gap-3">
          {p.ronda_actual === 1 && (
            <Row className="g-2">
              <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#00d4ff', color: '#00d4ff'}} onClick={() => handleApuesta('par')} disabled={loading}>PAR</button></Col>
              <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#bd00ff', color: '#bd00ff'}} onClick={() => handleApuesta('impar')} disabled={loading}>IMPAR</button></Col>
            </Row>
          )}
          {p.ronda_actual === 2 && (
            <div className="d-flex flex-column gap-2">
              <Row className="g-2">
                <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#ff5500', color: '#ff5500'}} onClick={() => handleApuesta('mayor')} disabled={loading}>MAYOR 👆</button></Col>
                <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#00ff9d', color: '#00ff9d'}} onClick={() => handleApuesta('menor')} disabled={loading}>👇 MENOR</button></Col>
              </Row>
              <button className="btn-neon-secondary w-100 py-2 fw-bold" onClick={() => handleApuesta('igual')} disabled={loading}>= IGUAL (x2)</button>
            </div>
          )}
          {p.ronda_actual === 3 && (
            <Row className="g-2">
              <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#00ff9d', color: '#00ff9d'}} onClick={() => handleApuesta('adentro')} disabled={loading}>📥 ADENTRO</button></Col>
              <Col><button className="btn-neon-main w-100 py-3 fw-bold" style={{borderColor: '#ff0055', color: '#ff0055'}} onClick={() => handleApuesta('afuera')} disabled={loading}>📤 AFUERA</button></Col>
            </Row>
          )}
        </div>
      ) : (
          <div className="animate-pulse text-white-50">Esperando apuesta...</div>
      )}
    </div>
  );

  // --- VISTA FASE 2: PIRÁMIDE ---
  const renderPiramide = () => (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '10px', alignItems: 'center' }} className="animate-in zoom-in">
      {[0, 1, 2, 3, 4].map((fIdx) => (
        <div key={fIdx} style={{ display: 'flex', gap: '8px' }}>
          {p.piramide_cartas[fIdx.toString()]?.map((carta: number, cIdx: number) => {
            const revelada = fIdx < p.piramide_estado.fila || (fIdx === p.piramide_estado.fila && cIdx < p.piramide_estado.col);
            const esActual = fIdx === p.piramide_estado.fila && cIdx === p.piramide_estado.col;
            return (
              <div key={cIdx} 
                   className={`d-flex align-items-center justify-content-center fw-bold rounded shadow-sm ${revelada ? 'flip-in-y' : ''} ${esActual ? 'animate-pulse' : ''}`}
                   style={{
                    width: '50px', height: '75px', 
                    backgroundColor: revelada ? 'white' : 'rgba(0,0,0,0.5)',
                    color: revelada ? '#e74c3c' : 'transparent',
                    border: revelada ? '2px solid white' : (esActual ? '2px solid #ff5500' : '1px dashed #555'),
                    boxShadow: esActual ? '0 0 15px #ff5500' : 'none',
                    fontSize: '1.2rem',
                    transition: 'all 0.3s'
                   }}>
                {revelada ? carta : ""}
              </div>
            );
          })}
        </div>
      ))}
      
      {/* Botón Host */}
      {datos.soyHost && !p.terminado && (
        <div className="mt-4 mb-2">
            <button className="btn-neon-main px-5 py-3 fw-bold fs-5" 
                    style={{borderColor: '#ff5500', color: '#ff5500', boxShadow: '0 0 15px #ff5500'}} 
                    onClick={handleVoltear}>
                🎴 VOLTEAR CARTA
            </button>
        </div>
      )}
    </div>
  );

  return (
    <Container className="min-vh-100 py-4 bg-dark text-white text-center d-flex flex-column align-items-center">
      
      {/* HEADER */}
      <div className="mb-4">
           <h2 className="titulo-neon m-0 fs-1" style={{color: '#ff5500', textShadow: '0 0 10px #ff5500'}}>LA PIRÁMIDE</h2>
           <small className="text-white-50 ls-2">Fase: {p.fase === "RECOLECCION" ? "APUESTAS" : "REVELACIÓN"}</small>
      </div>
      
      {p.fase === "RECOLECCION" ? renderRecoleccion() : renderPiramide()}

      {/* FOOTER: CARTAS DEL JUGADOR */}
      <div className="mt-auto p-3 w-100" style={{maxWidth: '500px'}}>
        <p className="text-white-50 small mb-2 text-uppercase ls-2">TUS CARTAS:</p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          {misCartas.map((c: number, i: number) => (
            <div key={i} className="bg-white text-dark fw-bold rounded shadow d-flex align-items-center justify-content-center animate-in slide-up" 
                 style={{ width: '45px', height: '65px', fontSize: '1.1rem', border: '2px solid #ddd', animationDelay: `${i*0.1}s` }}>
                 {c}
            </div>
          ))}
          {misCartas.length === 0 && <span className="text-muted small fst-italic">Aún no tienes cartas...</span>}
        </div>
      </div>

      {/* 👇 AQUÍ ESTÁ EL CAMBIO DE LOS BOTONES 👇 */}
      <div className="mt-4 d-flex flex-column gap-3 w-100 align-items-center" style={{maxWidth: '350px'}}>
        
        {datos.soyHost && (
          <button 
              className="btn btn-outline-info w-100 rounded-pill py-2 fw-bold animate-pulse" 
              style={{borderWidth: '2px', boxShadow: '0 0 10px rgba(13,202,240,0.3)'}}
              onClick={handleFinalizar}
          >
            🔄 ELEGIR OTRO JUEGO (Host)
          </button>
        )}

        {/* Si NO soy host, me aparece el botón de volver para esperar en el lobby */}
        {!datos.soyHost && (
           <button 
               className="btn btn-outline-secondary w-100 rounded-pill py-2 small"
               onClick={volver}
           >
             ⬅️ Volver a la Sala
           </button>
        )}

        <button 
            className="btn btn-link text-danger text-decoration-none small opacity-75 mt-2" 
            onClick={handleSalir}
        >
            ❌ Desconectarse y Salir
        </button>
      </div>
      {/* 👆 FIN DEL CAMBIO 👆 */}

    </Container>
  );
};