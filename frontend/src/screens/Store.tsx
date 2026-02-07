import { useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useSubscription } from '../context/SubscriptionContext';
import { ModalCanje } from '../components/ModalCanje'; // 👈 1. IMPORTAMOS EL MODAL
import '../App.css'; 

interface Props {
    volver: () => void;
}

export const Store = ({ volver }: Props) => {
    const { comprarPremium, restaurarCompras, isPremium } = useSubscription();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [showCanje, setShowCanje] = useState(false); // 👈 2. ESTADO PARA EL MODAL

    const planes = [
        { 
            id: 'diario', 
            titulo: '24 HORAS', 
            precio: '$0.99 USD', 
            desc: 'Solo por hoy',
            badge: '' 
        },
        { 
            id: 'diez', 
            titulo: '10 DÍAS', 
            precio: '$2.99 USD', 
            desc: 'Ideal vacaciones',
            badge: 'POPULAR',
            destacado: true 
        },
        { 
            id: 'lifetime',   
            titulo: 'PARA SIEMPRE',   
            precio: '$9.99 USD', 
            desc: 'Un solo pago y chau',
            badge: 'MEJOR VALOR' 
        }
    ];

    const handleCompra = async (id: string) => {
        setLoadingId(id);
        await comprarPremium(id);
        setLoadingId(null);
        // No volvemos automáticamente para que vea que ya es VIP
    };

    return (
        <Container className="min-vh-100 py-4 d-flex flex-column align-items-center text-center p-3 animate-in fade-in bg-dark">
            
            {/* HEADER */}
            <div className="d-flex justify-content-between w-100 align-items-center mb-4" style={{maxWidth: '600px'}}>
                <button className="btn btn-outline-light rounded-circle" style={{width:40, height:40}} onClick={volver}>🡠</button>
                <span className="text-white-50 small fw-bold">TIENDA VIP</span>
                <div style={{width: 40}}></div> 
            </div>

            <div className="mb-5">
                <div style={{fontSize: '4rem'}} className="mb-2 animate-bounce">💎</div>
                {isPremium ? (
                     <>
                        <h1 className="display-4 fw-black text-warning" style={{textShadow: '0 0 20px #ffd700'}}>YA SOS VIP</h1>
                        <p className="lead text-white">¡Disfrutá sin límites!</p>
                     </>
                ) : (
                     <>
                        <h1 className="display-4 fw-black text-white" style={{textShadow: '0 0 20px #ffd700'}}>HAZTE PREMIUM</h1>
                        <p className="lead text-white-50">Elegí cuánto tiempo querés la fiesta.</p>
                     </>
                )}
            </div>

            {/* BENEFICIOS */}
            <div className="text-start d-inline-block mb-5 p-4 rounded-4" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                <div className="d-flex align-items-center mb-3 text-white">
                    <span className="me-3 fs-4">🚫</span> 
                    <span className="fw-bold">CHAU PUBLICIDAD MOLESTA</span>
                </div>
                <div className="d-flex align-items-center mb-3 text-white">
                    <span className="me-3 fs-4">🔓</span> 
                    <span className="fw-bold">TODAS LAS CATEGORÍAS VIP</span>
                </div>
                <div className="d-flex align-items-center text-white">
                    <span className="me-3 fs-4">🔀</span> 
                    <span className="fw-bold">MIX DESBLOQUEADO SIEMPRE</span>
                </div>
            </div>

            {/* TARJETAS DE PRECIO (Solo si no es Premium) */}
            {!isPremium && (
                <Row className="g-3 w-100 justify-content-center mb-5" style={{maxWidth: '900px'}}>
                    {planes.map(plan => (
                        <Col xs={12} md={4} key={plan.id}>
                            <div 
                                onClick={() => handleCompra(plan.id)}
                                className="position-relative p-4 rounded-4 cursor-pointer hover-scale d-flex flex-column justify-content-center"
                                style={{
                                    background: plan.destacado ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' : 'rgba(30,30,30,0.8)',
                                    border: plan.destacado ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                    color: plan.destacado ? 'black' : 'white',
                                    transform: plan.destacado ? 'scale(1.05)' : 'scale(1)',
                                    boxShadow: plan.destacado ? '0 0 40px rgba(255, 215, 0, 0.4)' : 'none',
                                    transition: 'all 0.2s',
                                    minHeight: '200px'
                                }}
                            >
                                {plan.badge && (
                                    <div className={`position-absolute top-0 start-50 translate-middle badge rounded-pill px-3 py-2 shadow-sm ${plan.destacado ? 'bg-danger text-white' : 'bg-light text-dark'}`}>
                                        {plan.badge}
                                    </div>
                                )}
                                
                                <h5 className="fw-bold mb-1 opacity-75">{plan.titulo}</h5>
                                <h2 className="fw-black mb-0 display-5">{plan.precio}</h2>
                                <small className="opacity-75 fst-italic mt-1">{plan.desc}</small>

                                {loadingId === plan.id && (
                                    <div className="mt-3">
                                        <Spinner size="sm" animation="border"/> Procesando...
                                    </div>
                                )}
                            </div>
                        </Col>
                    ))}
                </Row>
            )}

            {/* 👇 3. SECCIÓN CÓDIGO DE AMIGO (NUEVO) 👇 */}
            {!isPremium && (
                <div className="mt-2 mb-5 pt-4 border-top border-secondary w-100 animate-in slide-up" style={{maxWidth: '600px'}}>
                    <p className="text-info fw-bold mb-3">¿Tenés un código de regalo?</p>
                    <button 
                        className="btn btn-info text-dark fw-black rounded-pill px-5 py-3 shadow-lg animate-pulse"
                        onClick={() => setShowCanje(true)}
                    >
                        🎁 CANJEAR CÓDIGO
                    </button>
                </div>
            )}

            <button className="btn btn-link text-white-50 text-decoration-none small mt-auto" onClick={restaurarCompras}>
                ¿Ya compraste antes? Restaurar compra
            </button>

            {/* 👇 4. EL MODAL OCULTO */}
            <ModalCanje show={showCanje} onHide={() => setShowCanje(false)} />

        </Container>
    );
};