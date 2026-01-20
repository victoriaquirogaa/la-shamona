import { useState } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api } from '../lib/api';
import { useSubscription } from '../context/SubscriptionContext';

interface Props {
  show: boolean;
  onHide: () => void;
}

export const ModalCanje = ({ show, onHide }: Props) => {
    const [codigo, setCodigo] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Importamos esto para recargar los permisos si el código funciona
    const { checkSubscription } = useSubscription(); 

    const handleCanjear = async () => {
        if (!codigo.trim()) return;
        setLoading(true);
        try {
            const res = await api.canjearCodigo(codigo);
            
            // 1. Aviso de éxito
            await Swal.fire({
                title: '¡CÓDIGO ACEPTADO! 🎉',
                text: res.mensaje || 'Disfrutá tus beneficios.',
                icon: 'success',
                background: '#212529',
                color: '#fff',
                confirmButtonColor: '#00d4ff'
            });

            // 2. Recargar estado (para que se desbloqueen los candados al instante)
            await checkSubscription(); 
            
            // 3. Limpiar y cerrar
            setCodigo("");
            onHide();

        } catch (error: any) {
            console.error(error);
            Swal.fire({
                title: 'Ups...',
                text: 'Código inválido o expirado.', // Podés poner error.message si el backend devuelve detalle
                icon: 'error',
                background: '#212529',
                color: '#fff',
                confirmButtonColor: '#d33'
            });
        }
        setLoading(false);
    };

    return (
        <Modal show={show} onHide={onHide} centered dialogClassName="modal-glass">
            <Modal.Header closeButton closeVariant="white" className="border-0">
                <Modal.Title className="text-info fw-bold w-100 text-center">🎁 CÓDIGO DE AMIGO</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center pb-4">
                <p className="text-white-50 small mb-3">
                    Si tenés un código promocional, escribilo acá para desbloquear beneficios.
                </p>
                <Form.Control 
                    placeholder="EJ: AMIGO2025" 
                    className="bg-dark text-white border-secondary text-center fw-bold py-3 text-uppercase fs-4 mb-4 shadow-none"
                    style={{letterSpacing: '3px'}}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                />
                <Button 
                    className="btn-neon-main w-100 py-3 fw-bold border-0" 
                    style={{backgroundColor: '#00d4ff', color: '#000'}}
                    onClick={handleCanjear} 
                    disabled={loading || !codigo}
                >
                    {loading ? <Spinner size="sm"/> : "VALIDAR CÓDIGO ✨"}
                </Button>
            </Modal.Body>
        </Modal>
    );
};