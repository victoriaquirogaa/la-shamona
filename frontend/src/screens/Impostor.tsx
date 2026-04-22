import { useState, useEffect } from 'react';
import { Container, Form, CloseButton, Spinner } from 'react-bootstrap';
import { api } from '../lib/api';
import { AdService } from '../lib/AdMobUtils';
import Swal from 'sweetalert2';
import { useSubscription } from '../context/SubscriptionContext';
import '../App.css';
import TopBar from '../components/TopBar';

interface Categoria {
  id: string;
  titulo?: string;
  es_premium: boolean;
}

interface Props {
  volver: () => void;
}

export const Impostor = ({ volver }: Props) => {
  // 👇 1. TRAEMOS LOS PERMISOS NUEVOS
  const { accesoVip, mixSinVideo } = useSubscription(); 
  
  // FASES
  const [fase, setFase] = useState<'setup' | 'ronda' | 'final'>('setup');
  
  // DATOS SETUP
  const [nombres, setNombres] = useState<string[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  
  // CATEGORÍAS & PUBLICIDAD
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catSeleccionada, setCatSeleccionada] = useState<string | null>(null); 
  const [cargandoCats, setCargandoCats] = useState(true);
  
  // 🔐 ESTADOS DE DESBLOQUEO
  const [mixDesbloqueado, setMixDesbloqueado] = useState(false);
  const [cargandoAnuncio, setCargandoAnuncio] = useState(false);

  // ESTADO JUEGO
  const [loading, setLoading] = useState(false);
  const [distribucion, setDistribucion] = useState<any[]>([]);
  const [categoriaTitulo, setCategoriaTitulo] = useState("");
  const [turno, setTurno] = useState(0); 
  const [viendo, setViendo] = useState(false);

  // --- 1. CARGAR ---
  useEffect(() => {
    const cargar = async () => {
        try {
            const data = await api.getCategoriasImpostor();
            setCategorias(data);
            setCargandoCats(false);
            
            // Intentamos seleccionar la primera GRATIS por defecto
            const primeraGratis = data.find((c: any) => c && c.id && !c.es_premium);
            if (primeraGratis) setCatSeleccionada(primeraGratis.id);
        } catch (e) {
            console.error("Error cargando categorías:", e);
            setCargandoCats(false);
        }
    };
    cargar();
  }, []);

  // --- HELPER FORMATO ---
  const formatearNombre = (id: string | undefined) => {
    if (!id) return "SIN NOMBRE"; 
    return id.replace(/_/g, ' ').toUpperCase();
  };

  // --- HELPER VIDEO ---
  const lanzarVideo = async (onExito: () => void) => {
    setCargandoAnuncio(true);
    await AdService.mirarVideoRecompensa(
        () => { // EXITO
            onExito();
            setCargandoAnuncio(false);
            Swal.fire({ title: '¡Desbloqueado!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#212529', color: '#fff' });
        },
        () => { // ERROR (Fallback)
            onExito();
            setCargandoAnuncio(false);
        }
    );
  };

  // --- 2. SELECCIONAR CATEGORÍA (MODIFICADO: LÓGICA ESTRICTA) ---
  const handleSeleccionarCategoria = (c: Categoria) => {
    if (!c || !c.id) return;

    // A. Si es GRATIS o TENGO PERMISO VIP (Premium o Amigo) -> Pase directo
    // Usamos 'accesoVip'
    if (!c.es_premium || accesoVip) {
        setCatSeleccionada(c.id);
        return;
    }

    // B. SI NO TENGO PERMISO -> BLOQUEO TOTAL
    Swal.fire({
        title: '🔒 Acceso VIP',
        text: 'Esta categoría es exclusiva VIP/Premium.', // Texto corto
        icon: 'warning',
        background: '#212529',
        color: '#fff',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffd700'
    });
  };

  // --- 3. LÓGICA DEL MIX ---
  const manejarClickMix = async () => {
    // Si tengo mixSinVideo (Premium Real) O ya vi el video -> Pase
    if (mixSinVideo || mixDesbloqueado) {
        setCatSeleccionada(""); 
    } else {
        // Amigo o Gratis -> Video
        lanzarVideo(() => {
            setMixDesbloqueado(true);
            setCatSeleccionada("");
        });
    }
  };

  // --- OTROS HANDLERS ---
  const agregar = () => {
    if(!nuevoNombre.trim()) return;
    if(nombres.includes(nuevoNombre.trim())) return;
    setNombres([...nombres, nuevoNombre.trim()]);
    setNuevoNombre("");
  }

  // --- 4. REPARTIR (CON SALVOCONDUCTO) ---
  const repartir = async () => {
    if (nombres.length < 3) return Swal.fire({ title:'Faltan jugadores', text: 'Mínimo 3 personas.', icon: 'warning', background: '#212529', color: '#fff'});
    
    if (catSeleccionada === null || catSeleccionada === undefined) return Swal.fire({ title:'Elegí Categoría', text: 'Seleccioná una temática antes de empezar.', icon: 'warning', background: '#212529', color: '#fff'});

    setLoading(true);
    try {
        const catId = catSeleccionada === "" ? undefined : catSeleccionada;
        
        let permisoBackend = false;
        
        if (catId) {
            // Es una categoría específica
            permisoBackend = accesoVip; 
        } else {
            // Es Mix. Lógica: Amigo ve video -> Mix Completo (Premio)
            permisoBackend = accesoVip; 
        }

        // IMPORTANTE: El backend espera 'esPremium'. Le mandamos nuestro flag calculado.
        const data = await api.crearPartidaImpostorLocal(nombres, catId, permisoBackend, permisoBackend);
        
        setDistribucion(data.distribucion);
        setCategoriaTitulo(data.categoria);
        setTurno(0);
        setViendo(false);
        setFase('ronda');
    } catch (e) {
        console.error(e);
        Swal.fire({title: 'Error', text: 'No se pudo crear la partida.', icon: 'error', background: '#212529', color: '#fff'});
    }
    setLoading(false);
  };

  const siguiente = () => {
    setViendo(false);
    if (turno + 1 < distribucion.length) setTurno(turno + 1);
    else setFase('final');
  }

  // ================= VISTAS =================

  if (fase === 'setup') {
    return (
      <Container className="min-vh-100 py-0 d-flex flex-column align-items-center text-center p-0">
        <TopBar titulo="IMPOSTOR" icono="🕵️" color="#bd00ff" onVolver={volver} />
        <div className="topbar-spacer" />
        <div className="w-100 px-3 d-flex flex-column align-items-center">
        
        <div className="card-shamona p-4 mb-3 w-100 animate-in zoom-in" style={{maxWidth: '500px', border: '1px solid #bd00ff'}}>
            
            <div className="mb-4">
                <label className="text-white small fw-bold mb-2 text-uppercase d-block text-start">Elige Temática:</label>
                
                {cargandoCats ? (
                    <div className="text-white-50 small"><Spinner size="sm" animation="border" variant="info"/> Cargando...</div>
                ) : (
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                        
                        {/* 1. BOTONES CATEGORIAS */}
                        {categorias.map((c, i) => {
                            if (!c.id) return null;

                            const esVip = c.es_premium;
                            // 👇 BLOQUEO VISUAL: Si es VIP y NO tengo accesoVip -> Bloqueado
                            const estaBloqueada = esVip && !accesoVip;
                            const seleccionada = catSeleccionada === c.id;

                            return (
                                <button 
                                    key={c.id || i}
                                    onClick={() => handleSeleccionarCategoria(c)}
                                    disabled={cargandoAnuncio}
                                    className={`btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1 
                                        ${seleccionada ? 'btn-light text-dark shadow' : 'btn-dark text-white border-secondary'}
                                        ${estaBloqueada ? 'opacity-75' : ''}
                                    `}
                                    style={{ 
                                        transition: 'all 0.2s', 
                                        transform: seleccionada ? 'scale(1.1)' : 'scale(1)',
                                        border: estaBloqueada ? '1px dashed #ffd700' : undefined
                                    }}
                                >
                                    {estaBloqueada && '🔒'} {esVip && !estaBloqueada && '⭐'} {formatearNombre(c.id)}
                                </button>
                            );
                        })}

                        {/* 2. BOTÓN MIX */}
                        <button 
                            onClick={manejarClickMix}
                            disabled={cargandoAnuncio}
                            className={`btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-2 ${catSeleccionada === "" ? 'bg-warning text-dark border-0 shadow-lg animate-pulse' : 'btn-outline-warning text-warning'}`}
                            style={{ transition: 'all 0.2s', transform: catSeleccionada === "" ? 'scale(1.1)' : 'scale(1)'}}
                        >
                            {cargandoAnuncio ? <Spinner size="sm"/> : 
                             (mixSinVideo || mixDesbloqueado ? '✨ MIX TOTAL' : '📺 MIX (Video)')}
                        </button>

                    </div>
                )}
            </div>

            <div className="d-flex gap-2 mb-4">
                <Form.Control 
                    value={nuevoNombre} 
                    onChange={e => setNuevoNombre(e.target.value)} 
                    placeholder="Nombre jugador..." 
                    className="bg-dark text-white border-secondary rounded-pill px-3"
                    style={{border: '1px solid #bd00ff'}}
                    onKeyDown={e => e.key === 'Enter' && agregar()} 
                />
                <button className="btn-neon-main py-1 px-3" style={{width: 'auto', borderColor: '#bd00ff', color: '#bd00ff'}} onClick={agregar}>+</button>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-center mb-2" style={{minHeight: '100px'}}>
                  {nombres.map((n, i) => (
                    <div key={i} className="px-3 py-1 rounded-pill bg-dark text-white small fw-bold d-flex align-items-center gap-2 animate-in fade-in" 
                         style={{border: '1px solid rgba(255,255,255,0.3)'}}>
                      {i+1}. {n} 
                      <CloseButton variant="white" onClick={() => setNombres(nombres.filter((_, idx) => idx !== i))} style={{width: '0.5em', height: '0.5em'}}/>
                    </div>
                  ))}
                  {nombres.length === 0 && <small className="text-white-50 fst-italic mt-4">Agreguen nombres para comenzar la misión...</small>}
            </div>
        </div>

          <button 
              className="btn-neon-secondary w-100 py-3 fw-bold fs-5 shadow-lg" 
              style={{maxWidth: '500px', backgroundColor: '#bd00ff', color: 'white', borderColor: '#bd00ff'}} 
              onClick={repartir} 
              disabled={loading || nombres.length < 3}
          >
              {loading ? <Spinner size="sm"/> : "🕵️ REPARTIR ROLES"}
          </button>
        </div>
      </Container>
    );
  }

  if (fase === 'ronda') {
    const jugador = distribucion[turno];
    return (
      <Container className="min-vh-100 py-0 d-flex flex-column align-items-center justify-content-center text-center p-0">
        <TopBar titulo="IMPOSTOR" icono="🕵️" color="#bd00ff" onVolver={() => setFase('setup')} />
        <div className="topbar-spacer" />
        <div className="badge rounded-pill bg-dark border border-secondary mb-5 animate-in fade-in px-4 py-2">
            JUGADOR {turno + 1} / {distribucion.length}
        </div>
        {!viendo ? (
            <div className="animate-in zoom-in w-100" style={{maxWidth: '500px'}}>
                <h3 className="text-white-50 mb-4 fw-light">Pase el dispositivo a:</h3>
                <h1 className="titulo-neon mb-5" style={{fontSize: '3.5rem', color: '#00d4ff', textShadow: '0 0 20px #00d4ff'}}>{jugador.nombre}</h1>
                <button 
                    className="btn-neon-main py-3 px-5 fw-bold fs-4 rounded-pill shadow-lg"
                    style={{borderColor: '#00d4ff', color: '#00d4ff'}} 
                    onClick={() => setViendo(true)}
                >
                    SOY YO 👁️
                </button>
            </div>
        ) : (
            <div className="card-shamona w-100 animate-in flip-in-y p-5 shadow-lg position-relative" 
                 style={{
                     // 👇 FIX RESPONSIVE: Ancho adaptable y relación de aspecto
                     width: 'min(80vw, 320px)', 
                     aspectRatio: '1/1',
                     background: jugador.rol === 'IMPOSTOR' ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 157, 0.1)',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'center',
                     alignItems: 'center',
                     border: `2px solid ${jugador.rol === 'IMPOSTOR' ? '#ff0055' : '#00ff9d'}`
                 }}>
                <div className="d-flex flex-column justify-content-center align-items-center h-100">
                    {jugador.rol === 'IMPOSTOR' ? (
                        <>
                            <div style={{fontSize: '5rem'}} className="mb-3 animate-pulse">🤫</div>
                            <h2 className="fw-black text-danger display-4 mb-3" style={{textShadow: '0 0 20px red'}}>IMPOSTOR</h2>
                            <p className="text-white fs-5 lh-sm">Tu misión es mentir.<br/>Nadie sabe que sos vos.</p>
                        </>
                    ) : (
                        <>
                            <small className="text-white-50 ls-2 text-uppercase mb-2">LA PALABRA SECRETA ES</small>
                            <h1 
                                className="fw-black text-white mt-2 mb-4 text-uppercase" 
                                style={{
                                    textShadow: '0 0 20px white',
                                    // 👇 FIX VISUAL: Fuente adaptable para CHOCOTORTA
                                    fontSize: jugador.palabra.length > 12 ? '2rem' : (jugador.palabra.length > 8 ? '2.8rem' : '4rem'),
                                    wordBreak: 'break-word',     
                                    lineHeight: '1.2'            
                                }}
                            >
                                {jugador.palabra}
                            </h1>
                            <div className="badge bg-dark bg-opacity-50 border border-secondary px-3 py-2 mt-auto">
                                TEMÁTICA: {categoriaTitulo.toUpperCase()}
                            </div>
                        </>
                    )}
                </div>
                <div className="position-absolute bottom-0 start-0 w-100 p-3">
                      <button className="btn-neon-secondary w-100 py-3 fw-bold bg-dark text-white border-0" onClick={siguiente}>
                        OK, ESCONDÉ ESTO 🙈
                      </button>
                </div>
            </div>
        )}
      </Container>
    );
  }

  // FASE FINAL
  return (
    <Container className="min-vh-100 py-0 d-flex flex-column align-items-center justify-content-center text-center p-0">
        <TopBar titulo="IMPOSTOR" icono="🕵️" color="#bd00ff" onVolver={() => setFase('setup')} />
        <div className="topbar-spacer" />
        <div style={{fontSize: '4rem'}} className="mb-2 animate-bounce">🔥</div>
        <h1 className="titulo-neon display-3 mb-5" style={{color: '#ffd700', textShadow: '0 0 20px #ffd700'}}>¡A DEBATIR!</h1>
        
        <div className="card-shamona p-4 mb-5 w-100 animate-in slide-up" style={{maxWidth: '400px', border: '1px dashed rgba(255,255,255,0.3)'}}>
            <p className="fs-6 mb-1 text-white-50 text-uppercase">La categoría secreta era:</p>
            <h3 className="text-white fw-bold m-0">{categoriaTitulo}</h3>
        </div>

        <div className="d-grid gap-3 w-100 animate-in slide-up" style={{maxWidth: '400px', animationDelay: '0.2s'}}>
            <button 
                className="btn-neon-main py-3 fw-bold fs-5" 
                onClick={repartir} 
                disabled={loading}
            >
                {loading ? <Spinner size="sm"/> : "🔄 JUGAR DE NUEVO (MISMO GRUPO)"}
            </button>
            <button className="btn btn-outline-light py-2 border-0 opacity-75" onClick={() => setFase('setup')}>
                ⚙️ Cambiar nombres o categoría
            </button>
            <button className="btn btn-link text-danger text-decoration-none mt-3" onClick={volver}>
                ❌ Salir al Menú
            </button>
        </div>
    </Container>
  );
};