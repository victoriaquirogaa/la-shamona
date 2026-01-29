// src/components/AlcoholSelector.tsx
import { Modal, Button, Form } from "react-bootstrap";

type Props = {
  show: boolean;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
  onClear?: () => void;
};

export default function AlcoholSelector({
  show,
  options,
  selected,
  onChange,
  onClose,
  onClear,
}: Props) {
  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((x) => x !== value));
    else onChange([...selected, value]);
  };

  return (
    <Modal show={show} onHide={onClose} centered contentClassName="bg-dark text-white border border-secondary">
      <Modal.Header closeButton closeVariant="white" className="border-0">
        <Modal.Title className="fw-bold">Filtrar por alcohol</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {options.length === 0 ? (
          <div className="text-white-50">No hay tipos de alcohol disponibles.</div>
        ) : (
          <div className="d-grid gap-2">
            {options.map((opt) => (
              <div key={opt} className="d-flex align-items-center justify-content-between p-2 rounded border border-secondary">
                <div className="fw-semibold">{opt}</div>
                <Form.Check
                  type="switch"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
              </div>
            ))}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="outline-warning"
          onClick={() => (onClear ? onClear() : onChange([]))}
        >
          Limpiar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
