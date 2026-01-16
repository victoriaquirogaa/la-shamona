import { useState, useEffect } from 'react';
import { Container, Button, Card, Spinner, Badge } from 'react-bootstrap';
import { api } from '../lib/api';
// IMPORTANTE: Ahora que instalaste con --legacy-peer-deps, esto va a andar 👇
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Registramos los componentes de los gráficos
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string; juego: string };
  salir: () => void;
}

export const VotacionOnline = ({ datos, salir }: Props) => {
  const [sala, setSala] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votando, setVotando] = useState(false);
  
  // Sincronización (Polling cada 2s)
  useEffect(() => {
    const fetchSala = async () => {
      try {
        const data = await api.getSalaOnline(datos.codigo);
        setSala(data);
        setLoading(false);
      } catch (e) { console.error(e); }
    };
    fetchSala();
    const intervalo = setInterval(fetchSala, 2000);
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  if (loading || !sala) return <Container className="pt-5 text-center"><Spinner animation="border" variant="light"/></Container>;

  const { datos_juego } = sala;
  const { titulo, consigna, opciones, votos, resultados, terminado } = datos_juego || {};
  const miNombre = datos.nombre;
  
  // Verificamos si ya voté
  const yaVote = votos && votos[miNombre];

  const handleVotar = async (opcion: string) => {
    setVotando(true);
    await api.votarEncuesta(datos.codigo, miNombre, opcion);
    setVotando(false);
  };

  const handleSiguiente = async () => {
     // Pide otra pregunta
     await api.iniciarJuegoOnline(datos.codigo, datos.juego);
  };

  // --- CONFIGURACIÓN DE GRÁFICOS ---
  // 1. Torta (Rico vs Pobre)
  const dataPie = {
    labels: Object.keys(resultados || {}),
    datasets: [{
      data: Object.values(resultados || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], 
      borderWidth: 0,
    }],
  };

  // 2. Barras (Quién es más probable)
  const dataBar = {
    labels: Object.keys(resultados || {}),
    datasets: [{
      label: 'Votos',
      data: Object.values(resultados || {}),
      backgroundColor: '#4BC0C0',
      borderRadius: 5,
    }],
  };

  return (
    <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center">
      <Badge bg="info" className="mb-3">{titulo}</Badge>
      
      {/* PREGUNTA */}
      <h2 className="display-6 fw-bold mb-5 px-2">{consigna || "Cargando pregunta..."}</h2>

      {!terminado ? (
        // --- FASE DE VOTACIÓN (Antes de ver resultados) ---
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <p className="text-muted mb-4">Elegí una opción:</p>
          <div className="d-grid gap-3">
            {opciones?.map((op: string) => (
              <Button
                key={op}
                variant={yaVote === op ? "light" : "outline-light"}
                size="lg"
                className={`py-3 fw-bold ${yaVote === op ? 'border-4 border-info' : ''}`}
                onClick={() => handleVotar(op)}
                disabled={!!yaVote || votando}
              >
                {op} {yaVote === op && "✅"}
              </Button>
            ))}
          </div>
          <div className="mt-4 text-white-50">
            {Object.keys(votos || {}).length} votos recibidos...
          </div>
        </div>
      ) : (
        // --- FASE DE RESULTADOS (Con Gráficos) ---
        <div className="w-100 animate-in zoom-in" style={{ maxWidth: '500px' }}>
          <Card className="bg-white text-dark p-3 shadow-lg mb-4">
            <h4 className="fw-bold mb-3">Resultados 📊</h4>
            
            <div style={{ maxHeight: '300px', display: 'flex', justifyContent: 'center' }}>
                {datos.juego === 'rico_pobre' ? (
                    <div style={{ width: '250px' }}>
                        <Pie data={dataPie} />
                    </div>
                ) : (
                    <Bar 
                        data={dataBar} 
                        options={{
                            indexAxis: 'y', // Barras horizontales
                            scales: { x: { ticks: { stepSize: 1 } } },
                            plugins: { legend: { display: false } } 
                        }} 
                    />
                )}
            </div>
          </Card>

          {datos.soyHost ? (
             <div className="d-grid gap-2">
                <Button variant="warning" size="lg" className="fw-bold" onClick={handleSiguiente}>
                    🔄 OTRA PREGUNTA
                </Button>
                <Button variant="outline-light" onClick={salir}>
                    Salir al Menú
                </Button>
             </div>
          ) : (
             <p className="animate-pulse text-info">Esperando al Host...</p>
          )}
        </div>
      )}
    </Container>
  );
};