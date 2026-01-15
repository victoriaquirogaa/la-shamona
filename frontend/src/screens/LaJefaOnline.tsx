import { useState, useEffect } from 'react';
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
  const [tipoSeleccion, setTipoSeleccion] = useState<'VICTIMA' | 'MASCOTA'>('VICTIMA');

  // SYNC
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
      } catch (e) { console.error("Error sync"); }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  if (!sala || !sala.datos_juego) return <div className="text-white text-center mt-5">Cargando...</div>;

  const esMiTurno = sala.turno_actual === datos.nombre;
  const fase = sala.fase; 
  const carta = sala.datos_juego.carta_actual;
  const resultado = sala.datos_juego.resultado_trago;

  // --- ACCIONES ---
  const handleSacar = () => api.sacarCartaOnline(datos.codigo);
  const handlePasarTurno = () => api.pasarTurnoOnline(datos.codigo);
  
  // Manejador del botón principal según la carta
  const handleAccionCarta = async () => {
      if (!carta) return;

      if (carta.accion === 'AUTO_TRAGO') {
          // Si me toca a mi (1), me reporto a mi mismo
          await api.reportarTragoOnline(datos.codigo, datos.nombre);
      } 
      else if (carta.accion === 'ELEGIR_VICTIMA') {
          setTipoSeleccion('VICTIMA');
          setShowSelector(true);
      }
      else if (carta.accion === 'ASIGNAR_MASCOTA') {
          setTipoSeleccion('MASCOTA');
          setShowSelector(true);
      }
      else if (carta.accion === 'TOMAN_TODOS') {
          await api.tomanTodosOnline(datos.codigo);
      }
      else if (carta.accion === 'ACTIVAR_DEDITO') {
           // Aquí podríamos activar lógica especial, por ahora lo tratamos como elegir victima
           setTipoSeleccion('VICTIMA');
           setShowSelector(true);
      }
      else {
          // Caso 12 (Descanso) o error
          handlePasarTurno();
      }
  };

  // Confirmación del Modal
  const handleSeleccionJugador = async (jugadorSeleccionado: string) => {
      if (tipoSeleccion === 'VICTIMA') {
          await api.reportarTragoOnline(datos.codigo, jugadorSeleccionado);
      } else {
          // Asignar Puta (Yo soy el dueño, el seleccionado es la puta)
          await api.asignarPutaOnline(datos.codigo, datos.nombre, jugadorSeleccionado);
      }
      setShowSelector(false);
  };
  if (carta) {
      console.log("CARTA RECIBIDA:", carta);
  }

  return (
    <Container className="min-vh-100 d-flex flex-column bg-dark text-white py-3" data-bs-theme="dark">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <Badge bg="secondary">Sala: {datos.codigo}</Badge>
          <Button variant="outline-danger" size="sm" onClick={salir}>Salir</Button>
      </div>

      <div className="text-center mb-4">
          {esMiTurno ? (
              <h2 className="text-success fw-bold animate-pulse">👉 ¡TE TOCA! 👈</h2>
          ) : (
              <h4 className="text-muted">Turno de: <span className="text-white fw-bold">{sala.turno_actual}</span></h4>
          )}
      </div>

      {/* --- MESA --- */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
          
          {/* FASE 1: ESPERANDO */}
          {fase === 'ESPERANDO' && (
             <Card className="bg-dark border-secondary border-dashed text-center d-flex align-items-center justify-content-center" style={{ width: '260px', height: '380px' }}>
                 {esMiTurno ? (
                     <Button variant="light" size="lg" className="fw-bold px-4 py-3 shadow-lg" onClick={handleSacar}>
                        SACAR CARTA
                     </Button>
                 ) : (
                     <span className="text-muted">Esperando jugada...</span>
                 )}
             </Card>
          )}

          {/* FASE 2: CARTA (ACCIÓN) */}
          {fase === 'ACCION' && carta && (
             <div className="text-center w-100">
                 <Card className="mx-auto shadow-lg border-0 mb-4 text-dark bg-white" style={{ width: '260px', height: '380px' }}>
                    <Card.Body className="d-flex flex-column justify-content-between p-3">
                        <div className="d-flex justify-content-between">
                            <h1 className="fw-bold m-0">{carta.numero}</h1>
                            <h1 className="fw-bold m-0">{['Oro','Copa'].includes(carta.palo) ? '🪙' : '⚔️'}</h1>
                        </div>
                        <div className="my-3">
                            <h6 className="text-danger fw-bold text-uppercase mb-1">REGLA</h6>
                            <h3 className="fw-black lh-sm">{carta.texto}</h3>
                        </div>
                        <small className="text-muted fw-bold align-self-end">{carta.palo}</small>
                    </Card.Body>
                 </Card>

                 {esMiTurno ? (
                     <div className="d-grid gap-2 col-10 mx-auto">
                        {/* EL BOTÓN CAMBIA SEGÚN LA CARTA */}
                        <Button variant="danger" size="lg" className="fw-bold" onClick={handleAccionCarta}>
                            {carta.accion === 'AUTO_TRAGO' && "🍺 ¡TOMO YO!"}
                            {carta.accion === 'ELEGIR_VICTIMA' && "👉 ELEGIR PERDEDOR"}
                            {carta.accion === 'ASIGNAR_MASCOTA' && "🐕 ELEGIR PUTA"}
                            {carta.accion === 'TOMAN_TODOS' && "🌍 ¡TOMAN TODOS!"}
                            {carta.accion === 'ACTIVAR_DEDITO' && "👆 ACTIVAR DEDITO"}
                            {carta.accion === 'NINGUNA' && "✅ PASAR (Zafamos)"}
                        </Button>
                     </div>
                 ) : (
                     <p className="animate-pulse text-warning fw-bold">Esperando a {sala.turno_actual}...</p>
                 )}
             </div>
          )}

          {/* FASE 3: RESULTADO (ESCRACHO) */}
          {fase === 'RESULTADO' && resultado && (
              <div className="position-absolute top-0 start-0 w-100 h-100 bg-danger d-flex flex-column align-items-center justify-content-center z-3" style={{animation: 'fadeIn 0.3s'}}>
                  <div className="text-center p-4">
                      <div className="display-1 mb-3">🍻</div>
                      <h1 className="display-4 fw-black text-white mb-2">¡ATENCIÓN!</h1>
                      
                      <div className="bg-white text-danger rounded p-4 shadow-lg mb-4">
                          <h3 className="fw-bold m-0">{resultado.mensaje}</h3>
                      </div>

                      {/* Lista de esclavos que toman de rebote */}
                      {resultado.toman_todos && resultado.toman_todos.length > 1 && (
                          <div className="text-white mb-4 border p-3 rounded bg-danger-dark">
                              <h5>⛓️ Cadena de Putas:</h5>
                              <p className="fs-5 mb-0">{resultado.toman_todos.join(" ➔ ")}</p>
                          </div>
                      )}

                      {esMiTurno && (
                          <Button variant="warning" size="lg" className="fw-bold px-5 mt-3 shadow" onClick={handlePasarTurno}>
                              CONTINUAR ➔
                          </Button>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* MODAL SELECTOR */}
      <Modal show={showSelector} onHide={() => setShowSelector(false)} centered contentClassName="bg-dark text-white border-danger">
          <Modal.Header closeButton closeVariant="white">
              <Modal.Title className="fw-bold text-danger">
                  {tipoSeleccion === 'VICTIMA' ? "¿Quién perdió?" : "Elegí a tu Puta"}
              </Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Row className="g-2">
                  {sala.jugadores.map((j: string) => (
                      <Col xs={6} key={j}>
                          <Button 
                            variant={j === datos.nombre ? "outline-secondary" : "outline-light"}
                            disabled={j === datos.nombre && tipoSeleccion === 'MASCOTA'} // No puedes ser tu propia puta
                            className="w-100 py-3 fw-bold text-uppercase" 
                            onClick={() => handleSeleccionJugador(j)}
                          >
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