import { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Badge, Modal, Row, Col } from 'react-bootstrap';
import { api } from '../lib/api';

interface Props {
  datos: { codigo: string; nombre: string; soyHost: boolean };
  salir: () => void;
}

export const LaJefaOnline = ({ datos, salir }: Props) => {
  const [sala, setSala] = useState<any>(null);
  
  // MODALES
  const [showSelector, setShowSelector] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState<'VICTIMA' | 'MASCOTA'>('VICTIMA');

  // ESTADO DEDITO (Local, solo para mí)
  const [tengoDedito, setTengoDedito] = useState(false);
  const [showModalDedito, setShowModalDedito] = useState(false);

  // REFERENCIA PARA DETECTAR CAMBIO DE TURNO (Para el vencimiento)
  const turnoAnterior = useRef<string>("");

  // Sincronización
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
        
        // --- LÓGICA DE VENCIMIENTO (DORMILÓN) ---
        // Si ahora es mi turno, pero antes no lo era...
        if (data.turno_actual === datos.nombre && turnoAnterior.current !== datos.nombre) {
             // ... y todavía tengo el dedito guardado
             setTengoDedito((prev) => {
                 if (prev) {
                     alert("😴 ¡DORMISTE! Se te venció el Dedito por no usarlo en la ronda.");
                     return false; // Se lo quitamos
                 }
                 return prev;
             });
        }
        turnoAnterior.current = data.turno_actual;

      } catch (e) { console.error("Error sync", e); }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [datos.codigo, datos.nombre]);

  if (!sala || !sala.datos_juego) return <div className="text-white text-center mt-5">Cargando mesa...</div>;

  const esMiTurno = sala.turno_actual === datos.nombre;
  const fase = sala.fase; 
  const carta = sala.datos_juego.carta_actual;
  const resultado = sala.datos_juego.resultado_trago;

  // --- ACCIONES ---
  const handleSacar = () => api.sacarCartaOnline(datos.codigo);
  const handlePasar = () => api.pasarTurnoOnline(datos.codigo);
  
  const clickBotonAccion = async () => {
      if (!carta) return;
      
      switch (carta.accion) {
          case 'AUTO_TRAGO': // Carta 1
              await api.reportarTragoOnline(datos.codigo, datos.nombre);
              break;
          case 'ELEGIR_VICTIMA': // Cartas 2, 4, 6, 7, 8, 11
              setModoSeleccion('VICTIMA');
              setShowSelector(true);
              break;
          case 'ASIGNAR_MASCOTA': // Carta 5
              setModoSeleccion('MASCOTA');
              setShowSelector(true);
              break;
          case 'TOMAN_TODOS': // Carta 3
              await api.tomanTodosOnline(datos.codigo);
              break;
          case 'ACTIVAR_DEDITO': // Carta 10
              setTengoDedito(true); // Me guardo el poder
              await api.pasarTurnoOnline(datos.codigo); // El juego sigue para los demás
              break;
          default: // Carta 12
              handlePasar();
      }
  };

  // Confirmar selección (Víctima normal o Mascota)
  const confirmarSeleccion = async (jugador: string) => {
      if (modoSeleccion === 'VICTIMA') {
          await api.reportarTragoOnline(datos.codigo, jugador);
      } else {
          await api.asignarPutaOnline(datos.codigo, datos.nombre, jugador);
      }
      setShowSelector(false);
  };

  // Usar el Dedito (Interrumpe el juego)
  const usarDedito = async (perdedor: string) => {
      setTengoDedito(false); // Gasto el poder
      setShowModalDedito(false);
      // Reporto el trago (esto interrumpe a cualquiera e inicia el escracho)
      await api.reportarTragoOnline(datos.codigo, perdedor);
  };

  return (
    <Container className="min-vh-100 d-flex flex-column bg-dark text-white py-3" data-bs-theme="dark">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-3 px-2">
         <Badge bg="secondary">Sala: {datos.codigo}</Badge>
         <Button variant="outline-danger" size="sm" onClick={salir}>Salir</Button>
      </div>

      <div className="text-center mb-3">
         {esMiTurno ? (
             <h2 className="text-success fw-bold animate-pulse">👉 ES TU TURNO 👈</h2>
         ) : (
             <h4 className="text-muted">Juega: <span className="text-white">{sala.turno_actual}</span></h4>
         )}
      </div>

      {/* --- MESA --- */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
          
          {/* FASE 1: ESPERANDO */}
          {fase === 'ESPERANDO' && (
              <Card className="bg-dark border-secondary border-dashed d-flex align-items-center justify-content-center" style={{ width: '260px', height: '380px' }}>
                  {esMiTurno ? (
                      <Button variant="light" size="lg" className="fw-bold px-4 py-3 shadow-lg" onClick={handleSacar}>
                          SACAR CARTA
                      </Button>
                  ) : (
                      <span className="text-muted">Esperando...</span>
                  )}
              </Card>
          )}

          {/* FASE 2: MOSTRAR CARTA */}
          {fase === 'ACCION' && carta && (
              <div className="text-center">
                  <Card className="mx-auto shadow-lg border-0 mb-4 bg-white text-dark" style={{ width: '260px', height: '380px' }}>
                      <Card.Body className="d-flex flex-column justify-content-between p-3">
                          <div className="d-flex justify-content-between">
                              <h1 className="fw-bold m-0">{carta.numero}</h1>
                              <h1 className="fw-bold m-0">{['Oro','Copa'].includes(carta.palo) ? '🪙' : '⚔️'}</h1>
                          </div>
                          <div className="my-3">
                              <h6 className="text-danger fw-bold text-uppercase mb-1">JUEGO</h6>
                              <h3 className="fw-black lh-sm">{carta.texto}</h3>
                          </div>
                          <small className="text-muted fw-bold align-self-end">{carta.palo}</small>
                      </Card.Body>
                  </Card>

                  {esMiTurno ? (
                      <Button variant="danger" size="lg" className="fw-bold w-100 shadow" onClick={clickBotonAccion}>
                          {carta.accion === 'ELEGIR_VICTIMA' && "💀 ELEGIR PERDEDOR"}
                          {carta.accion === 'ASIGNAR_MASCOTA' && "🐕 ELEGIR PUTA"}
                          {carta.accion === 'AUTO_TRAGO' && "🍺 TOMO YO"}
                          {carta.accion === 'TOMAN_TODOS' && "🌍 TOMAN TODOS"}
                          {carta.accion === 'ACTIVAR_DEDITO' && "👆 GUARDAR DEDITO"}
                          {carta.accion === 'NINGUNA' && "✅ PASAR"}
                      </Button>
                  ) : (
                      <p className="animate-pulse text-warning fw-bold">Esperando decisión...</p>
                  )}
              </div>
          )}

          {/* FASE 3: RESULTADO */}
          {fase === 'RESULTADO' && resultado && (
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-danger d-flex flex-column align-items-center justify-content-center z-3">
                  <div className="text-center p-4">
                      <div className="display-1 mb-2">🍻</div>
                      <h1 className="display-4 fw-black text-white mb-4">¡FONDO BLANCO!</h1>
                      <div className="bg-white text-danger rounded p-4 shadow-lg mb-4">
                          <h3 className="fw-bold m-0">{resultado.mensaje}</h3>
                      </div>
                      
                      {/* Lista detallada Toman Todos */}
                      {resultado.culpable === 'TODOS' && resultado.toman_todos && (
                          <div className="text-white border border-white rounded p-3 mb-4 text-start d-inline-block">
                             {resultado.toman_todos.map((txt: string, i: number) => (
                                <div key={i} className="border-bottom border-white-50 mb-1 pb-1">{txt}</div>
                             ))}
                          </div>
                      )}

                      {/* Cadena de mascotas */}
                      {resultado.culpable !== 'TODOS' && resultado.toman_todos && resultado.toman_todos.length > 1 && (
                           <div className="text-white border border-white rounded p-3 mb-4">
                               <h5>⛓️ Cadena de Mascotas:</h5>
                               <p className="fs-5 m-0 fw-bold">{resultado.toman_todos.join(" ➔ ")}</p>
                           </div>
                      )}

                      {esMiTurno && (
                          <Button variant="warning" size="lg" className="fw-bold px-5 shadow" onClick={handlePasar}>
                              SIGUIENTE RONDA ➔
                          </Button>
                      )}
                      {!esMiTurno && <p className="text-white">Esperando al Host...</p>}
                  </div>
              </div>
          )}
      </div>

      {/* === BOTÓN FLOTANTE DEDITO (SOLO PARA MI) === */}
      {tengoDedito && (
        <Button 
          variant="warning" 
          className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg border-4 border-white fw-bold fs-1"
          style={{width: '80px', height: '80px', zIndex: 1050}}
          onClick={() => setShowModalDedito(true)}
        >
          👆
        </Button>
      )}

      {/* MODAL SELECTOR GENERAL */}
      <Modal show={showSelector} onHide={() => setShowSelector(false)} centered contentClassName="bg-dark text-white border-danger">
          <Modal.Header closeButton closeVariant="white">
              <Modal.Title className="fw-bold text-danger">
                  {modoSeleccion === 'VICTIMA' ? "¿Quién perdió?" : "Elegí a tu Mascota"}
              </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Row className="g-2">
                  {sala.jugadores.map((j: string) => (
                      <Col xs={6} key={j}>
                          <Button 
                              variant="outline-light" 
                              className="w-100 py-3 fw-bold text-uppercase"
                              disabled={modoSeleccion === 'MASCOTA' && j === datos.nombre} 
                              onClick={() => confirmarSeleccion(j)}
                          >
                              {j}
                          </Button>
                      </Col>
                  ))}
              </Row>
          </Modal.Body>
      </Modal>

      {/* MODAL ESPECIAL DEDITO */}
      <Modal show={showModalDedito} onHide={() => setShowModalDedito(false)} centered contentClassName="bg-dark text-white border-warning">
          <Modal.Header closeButton closeVariant="white">
              <Modal.Title className="fw-bold text-warning">👆 ¡A ACUSAR!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <p className="text-center text-muted">¿Quién fue el último en poner el dedo?</p>
              <Row className="g-2">
                  {sala.jugadores.map((j: string) => (
                      <Col xs={6} key={j}>
                          <Button variant="light" className="w-100 py-3 fw-bold" onClick={() => usarDedito(j)}>
                              {j}
                          </Button>
                      </Col>
                  ))}
              </Row>
          </Modal.Body>
      </Modal>

    </Container>
  );
};