import { useState, useRef } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { api } from '../lib/api';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils'; 
import Swal from 'sweetalert2';
import { useSubscription } from '../context/SubscriptionContext'; 

interface Props {
  juego: 'yo-nunca' | 'votacion' | 'preguntas';
  volver: () => void;
}

export const JuegoSimple = ({ juego, volver }: Props) => {
  // 👇 1. TRAEMOS LOS 3 PERMISOS NUEVOS
  const { accesoVip, mixSinVideo, sinAnuncios } = useSubscription(); 
  
  const [modo, setModo] = useState<string | null>(null);
  const [frase, setFrase] = useState("Presioná Siguiente para arrancar");
  const [loading, setLoading] = useState(false);
  
  // 📺 ESTADOS DE PUBLICIDAD
  const [contadorAds, setContadorAds] = useState(0);
  const FRECUENCIA_ANUNCIOS = 8; 
  
  const [mixDesbloqueado, setMixDesbloqueado] = useState(false);
  const [cargandoVideo, setCargandoVideo] = useState(false);

  // 🃏 MAZO SIN REPETICIÓN (solo para yo-nunca y preguntas)
  const mazoRef = useRef<string[]>([]);
  const indiceRef = useRef<number>(0);
  const usaMazo = juego === 'yo-nunca' || juego === 'preguntas';

  // CONFIGURACIÓN DE JUEGOS
  const config: any = {
    'yo-nunca': { 
        titulo: 'YO NUNCA', 
        icono: '🍺', 
        color: '#00d4ff', 
        opciones: [
            {id: 'gratis', label: 'MODO CLÁSICO'}, 
            {id: 'hot', label: '🔥 PICANTE', vipOnly: true}, 
            {id: 'mix', label: '✨ MIX (Solo VIP)', vipOnly: true} 
        ] 
    },
    'votacion': { 
        titulo: 'VOTACIÓN', 
        icono: '👉', 
        color: '#bd00ff', 
        opciones: [
            {id: 'gratis', label: '¿QUIÉN ES?'}, 
            {id: 'rico_pobre', label: 'RICO O POBRE'}
        ] 
    },
    'preguntas': { 
        titulo: 'PREGUNTAS', 
        icono: '🤔', 
        color: '#ffd700', 
        opciones: [
            {id: 'polemicas', label: 'POLÉMICAS'}, 
            {id: 'profundas', label: 'PROFUNDAS'}, 
            {id: 'picantes', label: '😈 PICANTES', vipOnly: true}, 
            {id: 'mix', label: '✨ MIX (Video)'} 
        ] 
    }
  }[juego];

  // 1️⃣ LÓGICA DE SELECCIÓN DE MODO
  const seleccionarModo = async (opcion: any) => {
      const opcionId = opcion.id;

      // A. CASO VIP ONLY (Categorías)
      // Usamos 'accesoVip' (que incluye a los Amigos)
      if (opcion.vipOnly && !accesoVip) {
          Swal.fire({
              title: '🔒 Acceso Restringido',
              text: 'Categoría exclusiva VIP/Premium.', // Texto corregido
              icon: 'warning',
              background: '#212529',
              color: '#fff',
              confirmButtonColor: '#ffd700'
          });
          return;
      }

      // B. CASO MIX (El Peaje de Video)
      // Usamos 'mixSinVideo' (que es False para Amigos -> Tienen que ver video)
      if (opcionId === 'mix' && !mixSinVideo && !mixDesbloqueado) {
          setCargandoVideo(true);
          await AdService.mirarVideoRecompensa(
              async () => { // GANA
                  setMixDesbloqueado(true);
                  setModo('mix');
                  await cargarMazoYComenzar('mix');
                  setCargandoVideo(false);
                  Swal.fire({ title: '¡Mix Activado!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#222', color: '#fff'});
              },
              async () => { // FALLA
                  setMixDesbloqueado(true);
                  setModo('mix');
                  await cargarMazoYComenzar('mix');
                  setCargandoVideo(false);
              }
          );
      } else {
          // C. ACCESO DIRECTO
          setModo(opcionId);
          await cargarMazoYComenzar(opcionId);
      }
  };

  // 2️⃣A CARGAR MAZO COMPLETO Y COMENZAR (yo-nunca y preguntas)
  const cargarMazoYComenzar = async (categoria: string) => {
    if (!usaMazo) {
      sacarCarta(categoria);
      return;
    }
    setLoading(true);
    try {
      let frases: string[] = [];
      if (juego === 'yo-nunca') frases = await api.getMazoYoNunca(categoria, accesoVip);
      else if (juego === 'preguntas') frases = await api.getMazoPreguntas(categoria, accesoVip);

      if (!frases.length) {
        setFrase('No hay cartas en este mazo.');
        setLoading(false);
        return;
      }
      mazoRef.current = frases;
      indiceRef.current = 0;
      setFrase(frases[0]);
    } catch (e) {
      setFrase('Error al cargar el mazo.');
    }
    setLoading(false);
  };

  // 2️⃣B SIGUIENTE CARTA DEL MAZO (sin repetir)
  const siguienteDelMazo = async () => {
    const mazo = mazoRef.current;
    let siguiente = indiceRef.current + 1;

    if (siguiente >= mazo.length) {
      // Vuelta completa: mostrar mensaje, luego rebarajar
      await Swal.fire({
        title: '🔄 ¡Vuelta completa!',
        text: 'Ya jugaron todas las cartas. Rebarajando...',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#212529',
        color: '#fff'
      });
      // Rebarajar
      const rebarajado = [...mazo].sort(() => Math.random() - 0.5);
      mazoRef.current = rebarajado;
      siguiente = 0;
    }

    indiceRef.current = siguiente;
    setFrase(mazoRef.current[siguiente]);
  };

  // 2️⃣C SACAR CARTA (para votacion que no usa mazo)
  const sacarCarta = async (categoria: string) => {
    // A. ANUNCIOS INTERSTICIALES (Cada X cartas)
    if (!sinAnuncios) {
        const nuevoContador = contadorAds + 1;
        if (nuevoContador >= FRECUENCIA_ANUNCIOS) {
            await AdService.mostrarIntersticial();
            setContadorAds(0);
        } else {
            setContadorAds(nuevoContador);
        }
    }

    setLoading(true);
    let data;
    try {
        if (juego === 'votacion') data = await api.getFraseVotacion(categoria, accesoVip);
        setFrase(data?.texto || data?.pregunta || "Error de conexión.");
    } catch (e) {
        setFrase("Error al buscar frase. Intenta de nuevo.");
    }
    setLoading(false);
  };

  // Handler del botón SIGUIENTE
  const handleSiguiente = async () => {
    if (!sinAnuncios) {
        const nuevoContador = contadorAds + 1;
        if (nuevoContador >= FRECUENCIA_ANUNCIOS) {
            await AdService.mostrarIntersticial();
            setContadorAds(0);
        } else {
            setContadorAds(nuevoContador);
        }
    }
    if (usaMazo) {
      await siguienteDelMazo();
    } else {
      await sacarCarta(modo!);
    }
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
                textShadow: `0 0 20px ${config.color}50`
            }}>
                {config.titulo}
            </h1>
        </div>

        <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '400px'}}>
          {config.opciones.map((op: any) => {
            const esMix = op.id === 'mix';
            const esVipOnly = op.vipOnly; 

            // 👇 LÓGICA VISUAL ACTUALIZADA
            // Si es Mix, NO tengo mixSinVideo y NO lo desbloqueé -> Bloqueado (Muestra tele)
            const mixBloqueado = esMix && !mixDesbloqueado && !mixSinVideo && !esVipOnly; 
            // Si es VIP Only y NO tengo accesoVip -> Bloqueado (Candado)
            const vipBloqueado = esVipOnly && !accesoVip;

            return (
                <button 
                    key={op.id} 
                    className={`btn-neon-main py-3 fw-bold fs-5 ${esMix ? 'btn-mix' : ''}`} 
                    style={{
                        borderColor: esMix ? 'gold' : config.color, 
                        color: esMix ? 'gold' : config.color,
                        backgroundColor: (mixBloqueado || vipBloqueado) ? 'rgba(0,0,0,0.3)' : 'transparent',
                        opacity: vipBloqueado ? 0.7 : 1
                    }} 
                    onClick={() => seleccionarModo(op)}
                    disabled={cargandoVideo}
                >
                  {cargandoVideo && esMix ? <Spinner size="sm"/> : 
                   vipBloqueado ? `🔒 ${op.label}` :
                   mixBloqueado ? "📺 VER VIDEO PARA MIX" : 
                   (esMix && mixSinVideo ? "✨ MIX (VIP)" : op.label)
                  }
                </button>
            );
          })}
          
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
      
      <div className="w-100 d-flex justify-content-between align-items-center mb-4 px-2 absolute-top-md" style={{maxWidth: '600px'}}>
         <div className="d-flex align-items-center gap-2">
             <span className="fs-4">{config.icono}</span>
             <span className="fw-bold text-uppercase" style={{color: config.color, letterSpacing: '2px'}}>
                {config.titulo} {modo === 'mix' ? '(MIX)' : ''}
             </span>
         </div>
         <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => { setModo(null); mazoRef.current = []; indiceRef.current = 0; }}>CAMBIAR</button>
      </div>

      <div 
        className="card-shamona w-100 shadow-lg d-flex align-items-center justify-content-center p-4 p-md-5 mb-5 position-relative animate-in zoom-in" 
        style={{ 
            maxWidth: '500px', 
            minHeight: '350px', 
            border: `1px solid ${config.color}`,
            background: 'rgba(0,0,0,0.4)'
        }}
      >
        {/* Esquineros decorativos */}
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
                color: '#000', 
                borderColor: config.color,
                boxShadow: `0 0 15px ${config.color}80`
            }}
            onClick={handleSiguiente} 
            disabled={loading}
        >
            {loading ? 'CARGANDO...' : 'SIGUIENTE ➔'}
        </button>
      </div>
    </Container>
  );
};