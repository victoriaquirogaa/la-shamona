import { useState, useEffect, useRef } from 'react';
import { Container, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext'; // 👈 1. IMPORTAR

interface Props {
  datos: { codigo: string; nombre: string; soyHost: boolean };
  salir: () => void;
}

export const LaJefaOnline = ({ datos, salir }: Props) => {
  const { isPremium } = useSubscription(); // 👈 2. OBTENER STATUS
  const [sala, setSala] = useState<any>(null);
  
  // MODALES
  const [showSelector, setShowSelector] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState<'VICTIMA' | 'MASCOTA'>('VICTIMA');

  // DEDITO
  const [tengoDedito, setTengoDedito] = useState(false);
  const [showModalDedito, setShowModalDedito] = useState(false);

  // LOGICA LOCAL
  const [reiniciando, setReiniciando] = useState(false);
  const turnoAnterior = useRef<string>("");

  // --- SYNC ---
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
        
        // CHECK DORMILÓN (Si cambió el turno y yo tenía el dedito -> PERDÍ)
        const turno = data.turno_actual || data.datos_juego?.turno_actual;
        if (turno === datos.nombre && turnoAnterior.current !== datos.nombre) {
             setTengoDedito((prev) => {
                 if (prev) {
                     Swal.fire({ title: '😴 ¡DORMISTE!', text: 'Se te venció el Dedito.', icon: 'info', timer: 2000, showConfirmButton: false });
                     return false; 
                 }
                 return prev;
             });
        }
        if (turno) turnoAnterior.current = turno;

      } catch (e) { console.error("Error sync", e); }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [datos.codigo, datos.nombre]);

  // 🚪 FUNCIÓN SEGURA PARA SALIR (PROTEGIDA VIP)
  const handleSalir = async () => {
      // 👈 3. SOLO MOSTRAMOS ANUNCIO SI NO ES PREMIUM
      if (!isPremium) {
          await AdService.mostrarIntersticial();
      }
      salir();
  };

  // Si no cargó la sala básica, spinner
  if (!sala) return <Container className="min-vh-100 d-flex justify-content-center align-items-center bg-dark"><Spinner animation="border" variant="danger"/></Container>;

  // --- 🚨 DETECCIÓN DE ESTADO ZOMBIE (DATOS VACÍOS) ---
  const dj = sala.datos_juego || {};
  const datosVacios = Object.keys(dj).length === 0;

  // FUNCIÓN PARA FORZAR INICIO (Versión Kickstart 🦵)
  const forzarInicio = async () => {
      setReiniciando(true);
      try {
          console.log("🛠️ Intentando inicializar mazo a la fuerza...");
          await api.iniciarJuegoOnline(datos.codigo, 'la-jefa');
          await new Promise(r => setTimeout(r, 1000));
          console.log("🃏 Pidiendo primera carta para despertar al mazo...");
          await api.sacarCartaOnline(datos.codigo);
      } catch (e) {
          console.error("Falló la inicialización manual:", e);
          Swal.fire({ title: 'Error', text: 'El juego no responde. Probá crear otra sala.', icon: 'error' });
      }
      setReiniciando(false);
  };

  // VISTA DE "PREPARANDO MESA" (Cuando falla la carga de datos)
  if (datosVacios) {
      return (
          <Container className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white text-center p-4">
              <div className="card-shamona p-5 border-warning shadow-lg animate-in zoom-in">
                  <div style={{fontSize: '4rem'}}>🃏</div>
                  <h2 className="text-warning fw-bold mb-3">MESA VACÍA</h2>
                  <p className="text-white-50 mb-4">La sala se creó, pero falta el mazo.</p>
                  
                  {datos.soyHost ? (
                      <button className="btn-neon-main py-3 fw-bold fs-5 blink-effect" onClick={forzarInicio} disabled={reiniciando}>
                          {reiniciando ? <Spinner size="sm"/> : "⚡ REPARTIR CARTAS AHORA"}
                      </button>
                  ) : (
                      <div className="animate-pulse text-info fw-bold">Esperando que el Host reparta...</div>
                  )}
                  
                  <button className="btn btn-link text-danger mt-4" onClick={handleSalir}>Salir</button>
              </div>
          </Container>
      );
  }
  // --------------------------------------------------------

  // DATOS NORMALES
  const fase = sala.fase || dj.fase || "ESPERANDO";
  const turnoActual = sala.turno_actual || dj.turno_actual || "???";
  const carta = dj.carta_actual;
  const resultado = dj.resultado_trago;
  const esMiTurno = turnoActual === datos.nombre;
  const listaMascotas = dj.mascotas || [];

  // --- ACCIONES ---
  const handleSacar = () => api.sacarCartaOnline(datos.codigo);
  const handlePasar = () => api.pasarTurnoOnline(datos.codigo);
  
  const clickBotonAccion = async () => {
      if (!carta) return;
      const accion = (carta.accion || "").toUpperCase();
      
      switch (accion) {
          case 'AUTO_TRAGO': await api.reportarTragoOnline(datos.codigo, datos.nombre); break;
          case 'ELEGIR_VICTIMA': setModoSeleccion('VICTIMA'); setShowSelector(true); break;
          case 'ASIGNAR_MASCOTA': case 'ASIGNAR_PUTA': case 'ELEGIR_PUTA': setModoSeleccion('MASCOTA'); setShowSelector(true); break;
          case 'TOMAN_TODOS': await api.tomanTodosOnline(datos.codigo); break;
          case 'ACTIVAR_DEDITO': setTengoDedito(true); await api.pasarTurnoOnline(datos.codigo); break;
          default: handlePasar();
      }
  };

  const confirmarSeleccion = async (jugador: string) => {
      setShowSelector(false);
      if (modoSeleccion === 'VICTIMA') await api.reportarTragoOnline(datos.codigo, jugador);
      else {
          await api.asignarPutaOnline(datos.codigo, datos.nombre, jugador);
          Swal.fire({ title: '¡Asignada!', text: `${jugador} ahora es tu mascota 🐕`, icon: 'success', timer: 2000, showConfirmButton: false });
      }
  };

  const usarDedito = async (perdedor: string) => {
      setTengoDedito(false); setShowModalDedito(false);
      await api.reportarTragoOnline(datos.codigo, perdedor);
  };

  return (
    <Container className="min-vh-100 d-flex flex-column bg-dark text-white py-3 text-center position-relative">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-3 px-2 align-items-center">
         <div className="badge bg-secondary border border-secondary fw-normal">SALA: {datos.codigo}</div>
         <button className="btn btn-sm btn-outline-danger border-0" onClick={handleSalir}>SALIR</button>
      </div>

      <div className="mb-3">
         {esMiTurno ? (
             <div className="badge bg-success fs-5 px-4 py-2 animate-pulse border border-success shadow">👉 ES TU TURNO 👈</div>
         ) : (
             <h4 className="text-white-50">JUEGA: <span className="text-danger fw-bold">{turnoActual}</span></h4>
         )}
      </div>

      {/* --- MESA --- */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center w-100">
          
          {/* FASE 1: DORSO */}
          {fase === 'ESPERANDO' && (
              <div className="mb-4 d-flex align-items-center justify-content-center text-white-50 animate-in zoom-in" 
                  style={{ width: '260px', height: '380px', borderRadius: '15px', border: '2px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                  {esMiTurno ? (
                      <button className="btn-neon-main py-3 px-4 fw-bold shadow-lg" style={{color: 'white', borderColor: 'var(--neon-pink)', background: 'var(--neon-pink)'}} onClick={handleSacar}>
                          🃏 SACAR CARTA
                      </button>
                  ) : (
                      <div className="text-center animate-pulse"><div className="display-4 mb-2">⏳</div><h3>ESPERANDO...</h3></div>
                  )}
              </div>
          )}

          {/* FASE 2: CARTA REVELADA */}
          {fase === 'ACCION' && carta && (
              <div className="text-center animate-in flip-in-y w-100 d-flex flex-column align-items-center">
                  <div className="card-shamona bg-white text-dark mb-4 position-relative shadow-lg" 
                        style={{ width: '260px', height: '380px', borderRadius: '15px', border: '8px solid white' }}>
                      <div className="d-flex flex-column justify-content-between h-100 p-3">
                          <div className="d-flex justify-content-between align-items-start">
                              <h1 className="fw-black m-0 lh-1 display-4">{carta.numero}</h1>
                              <h1 className="fw-black m-0 lh-1 display-4">{['Oro','Copa'].includes(carta.palo) ? '🪙' : '⚔️'}</h1>
                          </div>
                          <div className="my-2">
                              <h6 className="text-danger fw-bold text-uppercase ls-2 mb-1">REGLA</h6>
                              <h3 className="fw-black lh-sm text-uppercase">{carta.texto}</h3>
                          </div>
                          <small className="text-muted fw-bold align-self-end text-uppercase">{carta.palo}</small>
                      </div>
                  </div>
                  {esMiTurno ? (
                      <button className="btn-neon-main py-3 w-100 fw-bold fs-5 shadow-lg" style={{maxWidth: '300px', background: 'var(--neon-pink)', color: 'white', borderColor: 'var(--neon-pink)'}} onClick={clickBotonAccion}>
                          ACCIONAR
                      </button>
                  ) : (<p className="animate-pulse text-warning fw-bold">Esperando decisión...</p>)}
              </div>
          )}

          {/* FASE 3: RESULTADO */}
          {fase === 'RESULTADO' && resultado && (
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center z-3 animate-in zoom-in"
                   style={{background: 'rgba(20, 0, 0, 0.95)', backdropFilter: 'blur(10px)'}}>
                  <div className="text-center p-4 w-100" style={{maxWidth: '500px'}}>
                      <div style={{fontSize: '5rem'}} className="mb-2 animate-bounce">🍻</div>
                      <h1 className="titulo-neon display-3 mb-5" style={{color: '#ff0055', textShadow: '0 0 20px #ff0055'}}>¡FONDO BLANCO!</h1>
                      <div className="card-shamona p-4 mb-4 border-danger shadow-lg"><h3 className="fw-bold m-0 text-white">{resultado.mensaje}</h3></div>
                      
                      {/* Lista Toman Todos */}
                      {resultado.culpable === 'TODOS' && resultado.toman_todos && (
                          <div className="text-white border border-secondary bg-dark bg-opacity-50 rounded p-3 mb-4 text-start d-inline-block w-100">
                             {resultado.toman_todos.map((txt: string, i: number) => (
                                <div key={i} className="border-bottom border-secondary mb-2 pb-1 last-no-border">{txt}</div>
                             ))}
                          </div>
                      )}

                      {esMiTurno ? (
                          <button className="btn-neon-secondary w-100 py-3 fw-bold" onClick={handlePasar}>SIGUIENTE RONDA ➔</button>
                      ) : (<p className="text-white-50 animate-pulse">El Host avanza la ronda...</p>)}
                  </div>
              </div>
          )}
      </div>

      {/* MASCOTAS */}
      {listaMascotas.length > 0 && fase !== 'RESULTADO' && (
          <div className="w-100 mt-3 p-2 bg-black bg-opacity-50 rounded border border-secondary animate-in slide-up" style={{maxWidth: '400px', margin: '0 auto'}}>
              <small className="text-white-50 text-uppercase d-block mb-2 fw-bold">⛓️ RELACIONES ACTIVAS</small>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {listaMascotas.map((m: any, i: number) => (
                      <Badge key={i} bg="dark" className="border border-danger fw-normal p-2">
                          {m.dueno} 👑 ➔ 🐕 {m.mascota}
                      </Badge>
                  ))}
              </div>
          </div>
      )}

      {/* DEDITO */}
      {tengoDedito && <button className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg fw-bold fs-1" style={{width:'80px', height:'80px', background:'#ffd700', color:'black', border:'4px solid white'}} onClick={() => setShowModalDedito(true)}>👆</button>}
      
      {/* MODALES */}
      <Modal show={showSelector} onHide={() => setShowSelector(false)} centered dialogClassName="modal-glass">
          <Modal.Header closeButton closeVariant="white"><Modal.Title className="fw-bold text-danger text-center w-100">ELIGE JUGADOR</Modal.Title></Modal.Header>
          <Modal.Body><Row className="g-2">{sala.jugadores.map((j:string)=><Col xs={6} key={j}><button className="btn btn-outline-light w-100 py-3 fw-bold" onClick={()=>confirmarSeleccion(j)}>{j}</button></Col>)}</Row></Modal.Body>
      </Modal>

      <Modal show={showModalDedito} onHide={() => setShowModalDedito(false)} centered dialogClassName="modal-glass">
          <Modal.Header closeButton closeVariant="white"><Modal.Title className="fw-bold text-warning text-center w-100">👆 ¡ACUSALO!</Modal.Title></Modal.Header>
          <Modal.Body><Row className="g-2">{sala.jugadores.map((j:string)=><Col xs={6} key={j}><button className="btn btn-outline-light w-100 py-3 fw-bold" onClick={()=>usarDedito(j)}>{j}</button></Col>)}</Row></Modal.Body>
      </Modal>
    </Container>
  );
};