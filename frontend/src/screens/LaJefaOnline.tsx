import { useState, useEffect, useRef } from 'react';
import { Container, Modal, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { api } from '../lib/api';
import Swal from 'sweetalert2';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext';

interface Props {
  datos: { codigo: string; nombre: string; soyHost: boolean };
  salir: () => void;
  volver: () => void; // 👈 Ya estaba agregada
}

export const LaJefaOnline = ({ datos, salir, volver }: Props) => {
  // 👇 CAMBIO 1: Usamos 'sinAnuncios'
  const { sinAnuncios } = useSubscription(); 
  
  const [sala, setSala] = useState<any>(null);
  
  // MODALES
  const [showSelector, setShowSelector] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState<'VICTIMA' | 'MASCOTA'>('VICTIMA');

  // DEDITO
  const [tengoDedito, setTengoDedito] = useState(false);
  const [showModalDedito, setShowModalDedito] = useState(false);
  
  // MENU SALIDA
  const [showMenuSalida, setShowMenuSalida] = useState(false);

  // LOGICA LOCAL
  const [reiniciando, setReiniciando] = useState(false);
  const turnoAnterior = useRef<string>("");

  // --- SYNC ---
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);

        if (data.estado === 'esperando') {
            console.log("El Host cerró el juego, volviendo al lobby...");
            volver(); // ¡Puf! Los manda al MenuOnline automáticamente
            return;
        }
        
        // CHECK DORMILÓN (Si cambió el turno y es MÍO de nuevo, y tengo dedito -> PERDÍ)
        const turno = data.turno_actual || data.datos_juego?.turno_actual;
        
        // Solo chequeamos si el turno cambió efectivamente
        if (turno && turno !== turnoAnterior.current) {
            if (turno === datos.nombre) {
                // Es mi turno de nuevo. Si tengo el dedito, dormí.
                setTengoDedito((prev) => {
                    if (prev) {
                        Swal.fire({ title: '😴 ¡DORMISTE!', text: 'Se te venció el Dedito.', icon: 'info', timer: 2000, showConfirmButton: false });
                        return false; 
                    }
                    return prev;
                });
            }
            turnoAnterior.current = turno;
        }

      } catch (e) { console.error("Error sync", e); }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [datos.codigo, datos.nombre]);

  // 🚪 FUNCIÓN SEGURA PARA SALIR (PROTEGIDA)
  const handleSalir = async () => {
      // 👇 CAMBIO 2: Usamos sinAnuncios
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      salir();
  };

  // 👇 NUEVO: VOLVER AL LOBBY PARA EL HOST
  const handleVolverAlLobby = async () => {
       // 1. Mostramos publicidad si corresponde
       if (!sinAnuncios) await AdService.mostrarIntersticial();
       
       // 2. IMPORTANTE: Si soy Host, aviso al servidor que el juego terminó.
       // Esto cambia el estado a 'esperando' y evita que el MenuOnline nos expulse de vuelta.
       if (datos.soyHost) {
           try {
               // Usamos el endpoint para "terminar" o "resetear" el estado del juego
               await api.terminarJuego(datos.codigo); 
           } catch (e) {
               console.error("Error al cerrar el juego:", e);
           }
       }

       // 3. Ahora sí, cambiamos la vista localmente
       volver(); 
  };

  // Si no cargó la sala básica, spinner
  if (!sala) return <Container className="min-vh-100 d-flex justify-content-center align-items-center bg-dark"><Spinner animation="border" variant="danger"/></Container>;

  // --- DETECCIÓN DE ESTADO ZOMBIE ---
  const dj = sala.datos_juego || {};
  const datosVacios = Object.keys(dj).length === 0;

  const forzarInicio = async () => {
      setReiniciando(true);
      try {
          await api.iniciarJuegoOnline(datos.codigo, 'la-jefa');
          await new Promise(r => setTimeout(r, 1000));
          await api.sacarCartaOnline(datos.codigo);
      } catch (e) {
          console.error("Falló la inicialización manual:", e);
      }
      setReiniciando(false);
  };

  // VISTA DE "MESA VACÍA"
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
                  
                  <button className="btn btn-outline-secondary rounded-pill py-2" onClick={volver}>
                             ⬅️ Volver a la Sala
                          </button>
              </div>
          </Container>
      );
  }

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
          // Al activar dedito, marcamos localmente y pasamos el turno
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
         
         {/* 👇 BOTÓN DE MENÚ (ENGRANAJE O "SALIR") */}
         <button className="btn btn-sm btn-outline-light border-0" onClick={() => setShowMenuSalida(true)}>
            ⚙️ MENÚ
         </button>
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
                        style={{ 
                            width: 'min(85vw, 320px)', 
                            height: 'auto', 
                            aspectRatio: '2/3', 
                            borderRadius: '15px', 
                            border: '8px solid white' 
                        }}>
                      <div className="d-flex flex-column justify-content-between h-100 p-3">
                          <div className="d-flex justify-content-between align-items-start">
                              <h1 className="fw-black m-0 lh-1" style={{fontSize: '3.5rem'}}>{carta.numero}</h1>
                              <h1 className="fw-black m-0 lh-1 display-4">{['Oro','Copa'].includes(carta.palo) ? '🪙' : '⚔️'}</h1>
                          </div>
                          
                          <div className="my-2">
                              <h6 className="text-danger fw-bold text-uppercase ls-2 mb-1">REGLA</h6>
                              <h3 className="fw-black lh-sm text-uppercase" style={{fontSize: 'clamp(1.2rem, 5vw, 1.8rem)'}}>
                                  {carta.texto}
                              </h3>
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
      
      {/* MODAL MENU SALIDA */}
      <Modal show={showMenuSalida} onHide={() => setShowMenuSalida(false)} centered dialogClassName="modal-glass">
         <Modal.Body className="text-center p-4">
            <h4 className="text-white mb-4">¿Qué querés hacer?</h4>
            <div className="d-grid gap-3">
               {datos.soyHost && (
                   <button className="btn btn-outline-info py-3 fw-bold rounded-pill" onClick={() => {setShowMenuSalida(false); handleVolverAlLobby();}}>
                       🔄 CAMBIAR DE JUEGO
                   </button>
               )}
               
               {!datos.soyHost && (
                   <button className="btn btn-outline-secondary py-3 fw-bold rounded-pill" onClick={() => {setShowMenuSalida(false); volver();}}>
                       ⬅️ Volver a la Sala
                   </button>
               )}

               <button className="btn btn-danger py-3 fw-bold rounded-pill mt-2" onClick={handleSalir}>
                   ❌ SALIR DEFINITIVAMENTE
               </button>
            </div>
            <button className="btn btn-link text-white-50 mt-3" onClick={() => setShowMenuSalida(false)}>Cancelar</button>
         </Modal.Body>
      </Modal>

      {/* MODAL SELECTOR JUGADOR */}
      <Modal show={showSelector} onHide={() => setShowSelector(false)} centered dialogClassName="modal-glass">
          <Modal.Header closeButton closeVariant="white"><Modal.Title className="fw-bold text-danger text-center w-100">ELIGE JUGADOR</Modal.Title></Modal.Header>
          <Modal.Body><Row className="g-2">{sala.jugadores.map((j:string)=><Col xs={6} key={j}><button className="btn btn-outline-light w-100 py-3 fw-bold" onClick={()=>confirmarSeleccion(j)}>{j}</button></Col>)}</Row></Modal.Body>
      </Modal>

      {/* MODAL DEDITO */}
      <Modal show={showModalDedito} onHide={() => setShowModalDedito(false)} centered dialogClassName="modal-glass">
          <Modal.Header closeButton closeVariant="white"><Modal.Title className="fw-bold text-warning text-center w-100">👆 ¡ACUSALO!</Modal.Title></Modal.Header>
          <Modal.Body><Row className="g-2">{sala.jugadores.map((j:string)=><Col xs={6} key={j}><button className="btn btn-outline-light w-100 py-3 fw-bold" onClick={()=>usarDedito(j)}>{j}</button></Col>)}</Row></Modal.Body>
      </Modal>
    </Container>
  );
};