// MenuPrincipal.js
import React from "react";
import { Link } from "react-router-dom";

export default function MenuPrincipal({ loja, onLogout }) {
  return (
    <div className="container-fluid p-0">

      {/* 🔵 Barra Superior */}
      <div className="bg-warning py-3 px-4 d-flex justify-content-between align-items-center shadow-sm">
        <div>
          <h5 className="mb-0 fw-bold">🏪 Loja: {loja}</h5>
        </div>

        <button className="btn btn-danger" onClick={onLogout}>
          Sair / Trocar Loja
        </button>
      </div>

      {/* 🔵 Menu Principal */}
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <h2 className="mb-4 text-primary fw-bold">📌 Menu Principal</h2>

        <div className="row g-3" style={{ maxWidth: "450px" }}>

          {/* Botão Cálculo */}
          <div className="col-12">
            <Link
              to="/calculo"
              className="btn btn-primary w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              📊 <span className="fw-bold">Análise de Custo / Lucro</span>
            </Link>
          </div>

          {/* Botão Receitas */}
          <div className="col-12">
            <Link
              to="/receitas"
              className="btn btn-success w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              📘 <span className="fw-bold">Gerir Receitas</span>
            </Link>
          </div>

          {/* Botão Produção */}
          <div className="col-12">
            <Link
              to="/producao"
              className="btn btn-warning w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              ⚙️ <span className="fw-bold">Produzir Produtos</span>
            </Link>
          </div>

          {/* Botão Histórico */}
          <div className="col-12">
            <Link
              to="/historico"
              className="btn btn-secondary w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              📚 <span className="fw-bold">Histórico</span>
            </Link>

          </div>

          <div className="col-12">
            <Link
              to="/calculadora-online"
              className="btn btn-info w-100 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              🔢 <span className="fw-bold">Calculadora Online</span>
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}
