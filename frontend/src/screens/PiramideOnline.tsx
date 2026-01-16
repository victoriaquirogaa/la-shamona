import { useState, useEffect } from 'react';
import { Container, Button, Badge, Spinner, Card, Row, Col } from 'react-bootstrap';
import { api } from '../lib/api';
import Swal from 'sweetalert2';

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string };
  salir: () => void;
}

export const PiramideOnline = ({ datos, salir }: Props) => {
  const [sala, setSala] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ultimoIdMostrado, setUltimoIdMostrado] = useState(""); // 🚨 Para no repetir carteles

  // Polling de la sala (cada 2 segundos)
  useEffect(() => {
    const intervalo = setInterval(async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        if (data && data.datos_juego) setSala(data);
      } catch (e) { console.error("Error sync:", e); }
    }, 2000);
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  // 🚨 EFECTO PARA MOSTRAR TRAGOS A TODOS
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
          timer: 3500, // Se cierra solo para no interrumpir el ritmo
          showConfirmButton: false,
          background: '#212529',
          color: '#fff'
        });
      }
    }
  }, [sala]);

  if (!sala || !sala.datos_juego) return <Spinner />;

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
        icon: res.beber ? 'warning' : 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#212529',
        color: '#fff'
      });
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleVoltear = async () => {
    try {
      await api.voltearCarta(datos.codigo);
      // No hace falta Swal.fire acá, el useEffect de arriba se encarga
    } catch (e) { console.error(e); }
  };

  const renderRecoleccion = () => (
    <Card className="bg-dark border-secondary text-white p-4 mb-2 shadow-lg w-100" style={{maxWidth: '450px'}}>
      <h4 className="fw-bold text-info mb-4">{p.mensaje}</h4>
      {esMiTurno && (
        <div className="d-grid gap-3">
          {p.ronda_actual === 1 && (
            <Row className="g-2">
              <Col><Button variant="outline-info" size="lg" className="w-100" onClick={() => handleApuesta('par')} disabled={loading}>PAR</Button></Col>
              <Col><Button variant="outline-info" size="lg" className="w-100" onClick={() => handleApuesta('impar')} disabled={loading}>IMPAR</Button></Col>
            </Row>
          )}
          {p.ronda_actual === 2 && (
            <div className="d-flex flex-column gap-2">
              <Row className="g-2">
                <Col><Button variant="outline-warning" size="lg" className="w-100" onClick={() => handleApuesta('mayor')} disabled={loading}>MAYOR</Button></Col>
                <Col><Button variant="outline-warning" size="lg" className="w-100" onClick={() => handleApuesta('menor')} disabled={loading}>MENOR</Button></Col>
              </Row>
              <Button variant="outline-light" onClick={() => handleApuesta('igual')} disabled={loading}>¿IGUAL? (X2)</Button>
            </div>
          )}
          {p.ronda_actual === 3 && (
            <Row className="g-2">
              <Col><Button variant="outline-success" size="lg" className="w-100" onClick={() => handleApuesta('adentro')} disabled={loading}>ADENTRO</Button></Col>
              <Col><Button variant="outline-success" size="lg" className="w-100" onClick={() => handleApuesta('afuera')} disabled={loading}>AFUERA</Button></Col>
            </Row>
          )}
        </div>
      )}
    </Card>
  );

  const renderPiramide = () => (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '10px', alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map((fIdx) => (
        <div key={fIdx} style={{ display: 'flex', gap: '8px' }}>
          {p.piramide_cartas[fIdx.toString()]?.map((carta: number, cIdx: number) => {
            const revelada = fIdx < p.piramide_estado.fila || (fIdx === p.piramide_estado.fila && cIdx < p.piramide_estado.col);
            const esActual = fIdx === p.piramide_estado.fila && cIdx === p.piramide_estado.col;
            return (
              <div key={cIdx} style={{
                width: '45px', height: '65px', backgroundColor: revelada ? 'white' : '#2c3e50',
                color: revelada ? '#e74c3c' : '#3498db', borderRadius: '6px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                border: esActual ? '3px solid #f1c40f' : '1px solid #34495e'
              }}>
                {revelada ? carta : "?"}
              </div>
            );
          })}
        </div>
      ))}
      {datos.soyHost && !p.terminado && (
        <Button variant="warning" className="mt-3 fw-bold" onClick={handleVoltear}>🎴 VOLTEAR SIGUIENTE</Button>
      )}
    </div>
  );

  return (
    <Container className="min-vh-100 py-4 bg-dark text-white text-center d-flex flex-column align-items-center">
      <Badge bg="danger" className="mb-4 px-3 py-2 shadow">🔺 LA PIRÁMIDE 🔺</Badge>
      
      {p.fase === "RECOLECCION" ? renderRecoleccion() : renderPiramide()}

      <div className="mt-auto p-3 border-top border-secondary w-100" style={{maxWidth: '450px'}}>
        <p className="text-secondary small mb-2">TU MANO:</p>
        <div className="d-flex justify-content-center gap-2">
          {misCartas.map((c: number, i: number) => (
            <div key={i} className="bg-light text-dark fw-bold rounded shadow-sm d-flex align-items-center justify-content-center" style={{ width: '45px', height: '60px' }}>{c}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 d-flex flex-column gap-2 w-100" style={{maxWidth: '250px'}}>
        {datos.soyHost && (
          <Button variant="outline-info" size="sm" onClick={() => api.finalizarJuegoOnline(datos.codigo)}>🔄 ELEGIR OTRO JUEGO</Button>
        )}
        <Button variant="link" className="text-danger text-decoration-none small" onClick={salir}>Abandonar Sala</Button>
      </div>
    </Container>
  );
};