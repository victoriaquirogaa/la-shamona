import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Spinner, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import '../App.css'; 
import { AdService } from '../lib/AdMobUtils';
import { useSubscription } from '../context/SubscriptionContext'; 

// --- IMPORTS DE LOS JUEGOS ---
import { ImpostorOnline } from './ImpostorOnline';
import { VotacionOnline } from './VotacionOnline';
import { PiramideOnline } from './PiramideOnline';
import { LaJefaOnline } from './LaJefaOnline'; 

interface Props {
  volver: () => void;
  onJuegoIniciado: (juego: string, codigoSala: string, soyHost: boolean, miNombre: string) => void; 
  datosSesion?: { codigo: string; soyHost: boolean; nombre: string } | null;
}

export const MenuOnline = ({ volver, onJuegoIniciado, datosSesion }: Props) => {
  // 👇 CAMBIO 1: Usamos los flags correctos (Amigos + Premium)
  const { accesoVip, mixSinVideo } = useSubscription(); 
  
  const [nombre, setNombre] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [loading, setLoading] = useState(false);
  const [salaActiva, setSalaActiva] = useState<any>(null);

  // ESTADO PARA EL MENSAJE DE EMPATE/SISTEMA
  const [ultimoMensaje, setUltimoMensaje] = useState("");

  // ESTADOS PARA EL MODAL DE IMPOSTOR
  const [showModalImpostor, setShowModalImpostor] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [catSeleccionada, setCatSeleccionada] = useState(""); 
  const [loadingCats, setLoadingCats] = useState(false);

  // 🔐 ESTADOS DE DESBLOQUEO (ADS)
  const [mixDesbloqueado, setMixDesbloqueado] = useState(false);
  const [cargandoAnuncio, setCargandoAnuncio] = useState(false);

  // --- HELPERS ---
  const mostrarAlerta = (icono: any, titulo: string, texto: string) => {
      Swal.fire({ 
        icon: icono, 
        title: titulo, 
        text: texto, 
        background: '#212529', 
        color: '#fff', 
        confirmButtonColor: '#dc3545' 
      });
  }

  useEffect(() => {
    if (datosSesion && !salaActiva) {
        console.log("♻️ Recuperando sesión de sala:", datosSesion.codigo);
        // Recuperamos el nombre y el código
        setNombre(datosSesion.nombre);
        setCodigoSala(datosSesion.codigo);
        
        // Forzamos la activación de la sala para que arranque el SYNC
        setSalaActiva({ 
            codigo: datosSesion.codigo, 
            jugadores: [datosSesion.nombre], // Se actualizará solo con el sync
            estado: 'esperando' 
        });
    }
  }, [datosSesion]);  
  
  // --- ALARMA DE MENSAJES (EMPATE / SISTEMA) ---
  useEffect(() => {
    if (salaActiva?.datos_juego?.mensaje_sistema) {
        const msg = salaActiva.datos_juego.mensaje_sistema;
        if (msg !== ultimoMensaje && msg !== "") {
            mostrarAlerta('info', 'Atención', msg);
            setUltimoMensaje(msg);
        }
    }
  }, [salaActiva]); 

  // --- SYNC ---
  useEffect(() => {
    let intervalo: any;
    if (salaActiva) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.getSalaOnline(salaActiva.codigo);
          if (data) {
             setSalaActiva((prev: any) => ({
                 ...prev,
                 jugadores: data.jugadores,
                 estado: data.estado,
                 juego_actual: data.juego_actual,
                 datos_juego: data.datos_juego 
             }));

             if (data.estado === 'jugando') {
                 const soyHost = data.jugadores[0] === nombre;
                 onJuegoIniciado(data.juego_actual, salaActiva.codigo, soyHost, nombre);
             }
          }
        } catch (e) { console.error("Sync error"); }
      }, 2000);
    }
    return () => clearInterval(intervalo);
  }, [salaActiva?.codigo, nombre, onJuegoIniciado]);

  
  const salirDeLaSala = () => setSalaActiva(null);

  const handleCrear = async () => {
    if (!nombre.trim()) return mostrarAlerta('warning', '¡Falta el nombre!', 'Ponete un nombre.');
    setLoading(true);
    try {
        const data = await api.crearSalaOnline(nombre);
        if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { mostrarAlerta('error', 'Error', 'No se pudo crear la sala.'); }
    setLoading(false);
  };

  const handleUnirse = async () => {
    if (!nombre.trim()) return mostrarAlerta('warning', 'Nombre', 'Ponete un nombre.');
    if (!codigoSala.trim()) return mostrarAlerta('warning', 'Código', 'Falta el código.');
    setLoading(true);
    try {
        const data = await api.unirseSalaOnline(codigoSala, nombre);
        if (data.codigo_sala) setSalaActiva({ codigo: data.codigo_sala, jugadores: data.jugadores });
    } catch (e) { mostrarAlerta('error', 'Error', 'Sala no encontrada o llena.'); }
    setLoading(false);
  };

  // --- LÓGICA DE INICIO ---
  const iniciarLaJefa = async () => { if (salaActiva) await api.iniciarJuegoOnline(salaActiva.codigo, 'la-jefa'); };
  
  const abrirConfigImpostor = async () => {
      if (salaActiva.jugadores.length < 3) return mostrarAlerta('warning', 'Faltan jugadores', 'Mínimo 3 personas.');
      setShowModalImpostor(true);
      setLoadingCats(true);
      const cats = await api.getCategoriasImpostor();
      setCategorias(cats);
      
      const primeraGratis = cats.find((c: any) => !c.es_premium);
      if (primeraGratis) setCatSeleccionada(primeraGratis.id);
      else setCatSeleccionada(""); 

      setLoadingCats(false);
  };

  // 👇 FUNCIÓN CENTRALIZADA PARA MANEJAR VIDEOS 👇
  const lanzarVideo = async (onExito: () => void) => {
      setCargandoAnuncio(true);
      await AdService.mirarVideoRecompensa(
          () => { // ÉXITO
              onExito();
              setCargandoAnuncio(false);
              mostrarAlerta('success', '¡Desbloqueado!', 'Mix Activado.');
          },
          () => { // FALLO (Igual damos premio por UX)
              onExito();
              setCargandoAnuncio(false);
          }
      );
  };

  // 👇 LÓGICA DEL SELECTOR (VIP + AMIGOS) 👇
  const handleSeleccionCategoria = (e: any) => {
      const idSeleccionado = e.target.value;

      // --- CASO 1: MIX ---
      if (idSeleccionado === "") {
          // 👇 CAMBIO 2: Usamos mixSinVideo (True si es Premium O Amigo)
          if (mixSinVideo || mixDesbloqueado) {
              setCatSeleccionada("");
          } else {
              // Si no tiene beneficio, VIDEO
              lanzarVideo(() => {
                  setMixDesbloqueado(true);
                  setCatSeleccionada("");
              });
          }
          return;
      }

      // --- CASO 2: BUSCAR CATEGORIA ---
      const cat = categorias.find(c => c.id === idSeleccionado);

      // --- CASO 3: ES VIP ---
      if (cat?.es_premium) {
          // 👇 CAMBIO 3: Usamos accesoVip (Premium o Amigo)
          if (accesoVip) {
              setCatSeleccionada(idSeleccionado);
          } else {
              // ⛔ BLOQUEO TOTAL
              Swal.fire({
                  title: '👑 Acceso VIP',
                  text: 'Esta categoría es exclusiva para miembros Premium.',
                  icon: 'warning',
                  background: '#212529',
                  color: '#fff',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#ffd700'
              });
              
              const primeraGratis = categorias.find(c => !c.es_premium);
              setCatSeleccionada(primeraGratis?.id || "");
          }
          return;
      }

      // --- CASO 4: NORMAL (GRATIS) ---
      setCatSeleccionada(idSeleccionado);
  };

  const iniciarImpostorConfirmado = async () => {
      if (!salaActiva) return;
      setLoadingCats(true); 
      try {
          const catId = catSeleccionada === "" ? undefined : catSeleccionada;
          
          // 👇 CAMBIO 4: Enviamos accesoVip al backend
          await api.iniciarJuegoOnline(salaActiva.codigo, 'impostor', catId, accesoVip);
          
          setShowModalImpostor(false); 
      } catch (e) { mostrarAlerta('error', 'Error', 'Falló el inicio.'); }
      setLoadingCats(false);
  };

  const iniciarRicoPobre = async () => { if (salaActiva) await api.iniciarJuegoOnline(salaActiva.codigo, 'rico_pobre'); };
  
  const iniciarProbable = async () => {
      if (!salaActiva) return;
      if (salaActiva.jugadores.length < 2) return mostrarAlerta('warning', 'Faltan jugadores', 'Mínimo 2 personas.');
      await api.iniciarJuegoOnline(salaActiva.codigo, 'probable');
  };

  const volverAlLobby = async () => {
      if (!salaActiva) return;
      await api.terminarJuego(salaActiva.codigo);
  };

  // --- VISTAS DEL JUEGO ACTIVO ---
  if (salaActiva?.estado === 'jugando' || salaActiva?.estado === 'finalizado') {
      
      const soyHost = salaActiva.jugadores[0] === nombre;
      const juego = salaActiva.juego_actual;
      const accionSalir = soyHost ? volverAlLobby : salirDeLaSala;

      if (juego === 'la-jefa') return <LaJefaOnline datos={{ codigo: salaActiva.codigo, soyHost, nombre }} salir={accionSalir} volver={accionSalir} />;
      if (juego === 'impostor') return <ImpostorOnline datos={{ codigo: salaActiva.codigo, soyHost, nombre }} salir={accionSalir} volver={accionSalir}/>;
      if (juego === 'rico_pobre' || juego === 'probable') return <VotacionOnline datos={{ codigo: salaActiva.codigo, soyHost, nombre, juego }} salir={accionSalir} volver={accionSalir}/>;
      if (juego === 'piramide') return <PiramideOnline datos={{ codigo: salaActiva.codigo, soyHost, nombre }} salir={accionSalir} volver={accionSalir}/>;

      return (
          <Container className="pt-5 text-white text-center">
              <h1>⚠️ Error</h1>
              <p>Juego no encontrado: {juego}</p>
              <button className="btn-neon-secondary" onClick={salirDeLaSala}>Salir</button>
          </Container>
      );
  }

  // --- VISTA LOBBY (SALA DE ESPERA) ---
  if (salaActiva) {
      const soyHost = salaActiva.jugadores[0] === nombre;
      const faltanJugadores = salaActiva.jugadores.length < 3;

      return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center text-center p-3">
            
            {/* CÓDIGO DE SALA */}
            <div className="card-shamona p-4 mb-4 w-100 animate-in zoom-in" style={{ maxWidth: '450px', border: '1px solid var(--neon-cyan)' }}>
                <small className="text-uppercase text-info fw-bold" style={{letterSpacing: '2px'}}>CÓDIGO DE SALA</small>
                <h1 className="display-1 fw-black my-2 titulo-neon" style={{letterSpacing: '5px', textShadow: '0 0 20px rgba(102, 252, 241, 0.5)'}}>
                    {salaActiva.codigo}
                </h1>
            </div>

            {/* LISTA DE JUGADORES */}
            <h5 className="mb-3 text-white-50">JUGADORES CONECTADOS ({salaActiva.jugadores.length})</h5>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-5 w-100" style={{maxWidth: '500px'}}>
                {salaActiva.jugadores.map((j: string, i: number) => (
                    <div key={i} className="px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-2 animate-in fade-in"
                        style={{
                            background: i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            border: i === 0 ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: i === 0 ? '#ffd700' : 'white'
                        }}
                    >
                        {i === 0 && '👑'} {j}
                    </div>
                ))}
            </div>

            {soyHost ? (
                <div className="w-100 d-grid gap-3 animate-in slide-up" style={{maxWidth: '400px'}}>
                    <div className="text-info fw-bold mb-2 small text-uppercase">👑 HOST: ELEGÍ EL JUEGO</div>
                    
                    {/* LA JEFA */}
                    <button className="btn-neon-secondary py-3 fw-bold" style={{color: 'var(--neon-pink)', borderColor: 'var(--neon-pink)'}} onClick={iniciarLaJefa}>
                        👠 LA PUT@
                    </button>

                    {/* IMPOSTOR */}
                    <button className="btn-neon-secondary py-3 fw-bold" style={{color: '#bd00ff', borderColor: '#bd00ff'}} onClick={abrirConfigImpostor}>
                        🕵️‍♂️ IMPOSTOR
                        {faltanJugadores && <span className="d-block small text-white-50" style={{fontSize: '0.7rem'}}>(Mínimo 3)</span>}
                    </button>

                    {/* RICO O POBRE */}
                    <button className="btn-neon-main py-3 fw-bold" style={{color: '#ffd700', borderColor: '#ffd700'}} onClick={iniciarRicoPobre}>
                        💰 MUY RICO / POBRE
                    </button>

                    {/* PROBABLE */}
                    <button className="btn-neon-main py-3 fw-bold" onClick={iniciarProbable} disabled={salaActiva.jugadores.length < 2}>
                        👉 QUIÉN ES MÁS PROBABLE
                    </button>

                    {/* PIRAMIDE */}
                    <button className="btn-neon-main py-3 fw-bold" style={{color: '#ff5500', borderColor: '#ff5500'}} onClick={() => api.iniciarJuegoOnline(salaActiva.codigo, 'piramide')}>
                        🔺 LA PIRÁMIDE
                    </button>

                    {/* SALIR */}
                    <div className="mt-4 pt-3 border-top border-secondary opacity-75">
                          <button className="btn btn-link text-danger text-decoration-none small" onClick={() => { setSalaActiva(null); volver(); }}>
                           ❌ ABANDONAR SALA
                          </button>
                    </div>
                </div>
            ) : (
                <div className="text-center mt-4 w-100" style={{maxWidth: '400px'}}>
                    <div className="animate-pulse mb-5">
                        <Spinner animation="grow" variant="info" className="mb-3"/>
                        <h4 className="text-info fw-light">Esperando al Host...</h4>
                        <p className="text-white-50 small">No te vayas, el juego está por arrancar.</p>
                    </div>

                    <button 
                        className="btn btn-outline-danger w-100 py-2 rounded-pill small opacity-75"
                        style={{border: '1px dashed #dc3545'}} 
                        onClick={() => { 
                            setSalaActiva(null);
                            volver();
                        }}
                    >
                        ❌ SALIR DE LA SALA
                    </button>
                </div>
            )}

            {/* MODAL IMPOSTOR (ACTUALIZADO: VIP ESTRICTO) */}
            <Modal show={showModalImpostor} onHide={() => setShowModalImpostor(false)} centered dialogClassName="modal-glass">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title className="text-info fw-bold">CONFIGURAR IMPOSTOR 🕵️‍♂️</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label className="text-white small fw-bold">ELEGÍ TEMÁTICA:</Form.Label>
                        {loadingCats ? <div className="text-center"><Spinner animation="border" variant="info"/></div> : (
                            <Form.Select 
                                className="bg-dark text-white border-secondary rounded-pill py-2 fw-bold text-center"
                                value={catSeleccionada} 
                                onChange={handleSeleccionCategoria} 
                                disabled={cargandoAnuncio} 
                                style={{background: 'rgba(0,0,0,0.5)'}}
                            >
                                {/* OPCIÓN MIX DINÁMICA: CAMBIO VISUAL */}
                                <option value="">
                                    {cargandoAnuncio ? '⏳ Cargando video...' : (mixSinVideo || mixDesbloqueado ? '✨ Aleatoria (Mix)' : '📺 Aleatoria (Mix) - Ver Video')}
                                </option>
                                
                                {categorias.map((c: any) => {
                                    let label = c.titulo;
                                    // CAMBIO VISUAL: Usamos accesoVip para los íconos
                                    if (c.es_premium && !accesoVip) {
                                        label = `🔒 ${c.titulo} (Premium)`; // Bloqueado
                                    } else if (c.es_premium && accesoVip) {
                                        label = `⭐ ${c.titulo}`; // Desbloqueado
                                    }

                                    return <option key={c.id} value={c.id}>{label}</option>;
                                })}
                            </Form.Select>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <button className="btn btn-link text-white-50 text-decoration-none" onClick={() => setShowModalImpostor(false)}>Cancelar</button>
                    <button className="btn-neon-secondary px-4 py-2" onClick={iniciarImpostorConfirmado} disabled={loadingCats || cargandoAnuncio}>
                        {loadingCats ? "..." : "¡JUGAR!"}
                    </button>
                </Modal.Footer>
            </Modal>
        </Container>
      );
  }

  // --- VISTA LOGIN ---
  return (
    <Container className="min-vh-100 py-4 d-flex flex-column p-4">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-5 animate-in fade-in">
        <button 
            className="btn btn-outline-light rounded-circle me-3 d-flex align-items-center justify-content-center" 
            style={{width: '40px', height: '40px', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)'}}
            onClick={volver}
        >
            🡠
        </button>
        <div>
            <h2 className="titulo-neon m-0 lh-1">LOBBY ONLINE</h2>
            <small className="text-white-50">Juegos a distancia</small>
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center w-100">
        
        {/* INPUT NOMBRE */}
        <div className="w-100 mb-5 animate-in zoom-in" style={{maxWidth: '400px'}}>
             <label className="text-info small fw-bold ms-2 mb-1">TU APODO</label>
             <Form.Control 
                size="lg" type="text" placeholder="Ej: Tincho" 
                className="bg-dark text-white border-secondary rounded-pill text-center fw-bold py-3 shadow-none"
                style={{border: '1px solid var(--neon-cyan)', background: 'rgba(0,0,0,0.3)', fontSize: '1.2rem'}}
                value={nombre} 
                onChange={(e) => {
                    const val = e.target.value;
                    setNombre(val.charAt(0).toUpperCase() + val.slice(1));
                }}
            />
        </div>

        <Row className="g-4 w-100 justify-content-center" style={{maxWidth: '800px'}}>
            {/* CREAR SALA */}
            <Col md={6} className="d-flex justify-content-center">
                <div className="card-shamona p-4 w-100 text-center animate-in slide-up" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
                    <h4 className="text-white mb-3">¿Sos el Host?</h4>
                    <button 
                        className="btn-neon-main w-100 py-3 fw-bold fs-5" 
                        onClick={handleCrear} 
                        disabled={loading || !nombre}
                    >
                        {loading ? <Spinner size="sm"/> : "👑 CREAR SALA"}
                    </button>
                </div>
            </Col>

            {/* UNIRSE */}
            <Col md={6} className="d-flex justify-content-center">
                <div className="card-shamona p-4 w-100 text-center animate-in slide-up" style={{borderColor: 'rgba(255,255,255,0.1)', animationDelay: '0.2s'}}>
                    <h4 className="text-white mb-3">¿Tenés código?</h4>
                    <Form.Control 
                        placeholder="CÓDIGO (Ej: A1B2)" 
                        className="text-center text-uppercase fw-bold bg-dark text-white border-secondary rounded-pill py-2 mb-3" 
                        maxLength={6}
                        style={{letterSpacing: '3px'}}
                        value={codigoSala} 
                        onChange={(e) => setCodigoSala(e.target.value.toUpperCase())} 
                    />
                    <button 
                        className="btn-neon-secondary w-100 py-2 fw-bold" 
                        onClick={handleUnirse} 
                        disabled={loading || !nombre || !codigoSala}
                    >
                        {loading ? <Spinner size="sm"/> : "🚀 UNIRSE"}
                    </button>
                </div>
            </Col>
        </Row>
      </div>
    </Container>
  );
};