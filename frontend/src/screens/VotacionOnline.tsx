import { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { api } from '../lib/api';
// IMPORTANTE: Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext'; 

// Registramos los componentes de los gráficos
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Props {
  datos: { codigo: string; soyHost: boolean; nombre: string; juego: string };
  salir: () => void;
  volver: () => void; // 👈 AGREGÁ ESTA LÍNEA
}

export const VotacionOnline = ({ datos, salir, volver }: Props) => {
  // 👇 CAMBIO 1: Usamos 'sinAnuncios' (Premium + Amigos)
  const { sinAnuncios } = useSubscription(); 
  
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

        // 👇 DETECCIÓN AUTOMÁTICA: Si el host cerró el juego, volvemos
        if (data.estado === 'esperando') {
             volver(); 
             return;
        }

      } catch (e) { console.error(e); }
    };
    fetchSala();
    const intervalo = setInterval(fetchSala, 2000);
    return () => clearInterval(intervalo);
  }, [datos.codigo]);

  // --- SALIR CON ANUNCIO (PROTEGIDO) ---
  const handleSalir = async () => {
      // 👈 CAMBIO 2: Usamos sinAnuncios
      if (!sinAnuncios) {
          await AdService.mostrarIntersticial();
      }
      salir();
  };

  // 👇 NUEVO: VOLVER AL LOBBY PARA EL HOST
  const handleVolverAlLobby = async () => {
       if (!sinAnuncios) await AdService.mostrarIntersticial();
       
       if (datos.soyHost) {
           try {
               await api.terminarJuego(datos.codigo); 
           } catch (e) {
               console.error("Error al cerrar el juego:", e);
           }
       }
       volver(); 
  };

  if (loading || !sala) return <Container className="pt-5 min-vh-100 bg-dark text-center d-flex align-items-center justify-content-center"><Spinner animation="border" variant="info"/></Container>;

  const { datos_juego } = sala;
  const { titulo, consigna, opciones, votos, resultados, terminado } = datos_juego || {};
  const miNombre = datos.nombre;
  const yaVote = votos && votos[miNombre];

  const handleVotar = async (opcion: string) => {
    setVotando(true);
    await api.votarEncuesta(datos.codigo, miNombre, opcion);
    setVotando(false);
  };

  const handleSiguiente = async () => await api.iniciarJuegoOnline(datos.codigo, datos.juego);

  // --- ESTILOS DE GRÁFICOS (NEÓN) ---
  const chartOptions = {
      plugins: {
          legend: { labels: { color: 'white', font: { size: 14 } } } // Leyenda blanca
      },
      scales: datos.juego === 'probable' ? {
          x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      } : {}
  };

  // 1. Torta (Rico vs Pobre)
  const dataPie = {
    labels: Object.keys(resultados || {}),
    datasets: [{
      data: Object.values(resultados || {}),
      backgroundColor: ['#ff0055', '#00d4ff', '#ffd700', '#bd00ff'], 
      borderWidth: 2,
      borderColor: '#212529'
    }],
  };

  // 2. Barras (Quién es más probable)
  const dataBar = {
    labels: Object.keys(resultados || {}),
    datasets: [{
      label: 'Votos',
      data: Object.values(resultados || {}),
      backgroundColor: 'rgba(0, 212, 255, 0.6)', // Cian semi-transparente
      borderColor: '#00d4ff',
      borderWidth: 2,
      borderRadius: 5,
    }],
  };

  return (
    <Container className="min-vh-100 py-4 d-flex flex-column align-items-center bg-dark text-white text-center p-3">
      
      {/* HEADER */}
      <div className="w-100 d-flex justify-content-between align-items-center mb-5 px-2" style={{maxWidth: '600px'}}>
           <div className="badge bg-transparent border border-info text-info px-3 py-2 rounded-pill fw-normal">{titulo?.toUpperCase()}</div>
      </div>

      {/* PREGUNTA */}
      <h2 className="titulo-neon display-5 mb-5 px-2 text-uppercase" style={{textShadow: '0 0 10px rgba(255,255,255,0.3)', color: 'white'}}>
          {consigna || "Cargando..."}
      </h2>

      {!terminado ? (
        // --- FASE DE VOTACIÓN ---
        <div className="w-100 animate-in slide-up" style={{ maxWidth: '450px' }}>
          <p className="text-white-50 mb-4 ls-2 text-uppercase small">Tu elección es anónima...</p>
          <div className="d-grid gap-3">
            {opciones?.map((op: string) => (
              <button
                key={op}
                className={`btn py-3 fw-bold fs-5 position-relative overflow-hidden ${yaVote === op ? 'btn-light text-dark shadow-lg' : 'btn-outline-light'}`}
                style={{
                    borderRadius: '50px',
                    transition: 'all 0.3s',
                    border: '2px solid white',
                    opacity: (!!yaVote && yaVote !== op) ? 0.5 : 1
                }}
                onClick={() => handleVotar(op)}
                disabled={!!yaVote || votando}
              >
                {op} {yaVote === op && "✅"}
              </button>
            ))}
          </div>
          <div className="mt-5 animate-pulse text-info fw-bold">
            {Object.keys(votos || {}).length} votos recibidos...
          </div>
        </div>
      ) : (
        // --- FASE DE RESULTADOS ---
        <div className="w-100 animate-in zoom-in" style={{ maxWidth: '600px' }}>
          <div className="card-shamona p-4 shadow-lg mb-5 border-0" style={{background: 'rgba(0,0,0,0.6)'}}>
            <h4 className="fw-bold mb-4 text-info text-uppercase ls-2">📊 RESULTADOS FINALES</h4>
            
            <div style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {datos.juego === 'rico_pobre' ? (
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <Pie data={dataPie} options={chartOptions as any} />
                    </div>
                ) : (
                    <div style={{ width: '100%' }}>
                        <Bar 
                            data={dataBar} 
                            options={{
                                ...chartOptions,
                                indexAxis: 'y', // Barras horizontales
                                scales: { 
                                    x: { ticks: { color: 'white', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
                                    y: { ticks: { color: 'white', font: {size: 14, weight: 'bold'} }, grid: { display: false } }
                                },
                                plugins: { legend: { display: false } } 
                            } as any} 
                        />
                    </div>
                )}
            </div>
          </div>

          {datos.soyHost ? (
             <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '400px', margin: '0 auto'}}>
                <button className="btn-neon-main py-3 fw-bold fs-5" onClick={handleSiguiente}>
                    🔄 OTRA PREGUNTA
                </button>
                
                {/* 👇 BOTÓN NUEVO */}
                <button className="btn btn-outline-info py-3 fw-bold rounded-pill" onClick={handleVolverAlLobby}>
                    ⬅️ ELEGIR OTRO JUEGO
                </button>

                <button className="btn btn-link text-danger text-decoration-none mt-2" onClick={handleSalir}>
                    ❌ Terminar y Salir
                </button>
             </div>
          ) : (
             <div className="d-grid gap-3 animate-pulse text-white-50">
                 <p>Esperando que el Host decida...</p>
                 {/* Opción para invitados si se quieren ir antes */}
                 <button className="btn btn-outline-secondary rounded-pill btn-sm" onClick={handleSalir}>
                    Salir de la sala
                 </button>
             </div>
          )}
        </div>
      )}
    </Container>
  );
};