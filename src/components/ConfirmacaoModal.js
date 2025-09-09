import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function ConfirmacaoModal({ show, onClose, onConfirm, mensagem }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirmação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{mensagem}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Apagar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
