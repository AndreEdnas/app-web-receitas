import React from "react";

export default function AlertaMensagem({ mensagem, tipo = "success", onClose }) {
  if (!mensagem) return null;

  const bgClass = tipo === "success" ? "bg-success" : "bg-danger";

  return (
    <div
      className={`toast show position-fixed top-0 end-0 m-3 ${bgClass} text-white`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ zIndex: 9999, minWidth: "250px" }}
    >
      <div className="d-flex">
        <div className="toast-body">{mensagem}</div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          onClick={onClose}
        ></button>
      </div>
    </div>
  );
}
