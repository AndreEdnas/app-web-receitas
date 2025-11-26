// TopoNavegacao.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function TopoNavegacao({ loja, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "fw-bold border-bottom border-2 border-dark" : "";

  return (
    <>
      {/* NAVBAR PREMIUM */}
      <nav
        className="px-3 py-2 shadow-sm"
        style={{
          background: "linear-gradient(90deg, #f7b500, #ffca2c)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">

          {/* Menu button (mobile) */}
          <button
            className="btn btn-dark btn-sm d-md-none me-2"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>

          {/* LOGOTIPO / LOJA */}
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "20px" }}>🏪</span>
            <span className="fw-bold" style={{ fontSize: "18px" }}>
              {loja}
            </span>
          </div>

          {/* LINKS (Desktop) */}
          <div className="d-none d-md-flex align-items-center gap-4">

            <Link className={`nav-link text-dark ${isActive("/calculo")}`} to="/calculo">
              📊 Cálculo
            </Link>

            <Link className={`nav-link text-dark ${isActive("/receitas")}`} to="/receitas">
              📘 Receitas
            </Link>

            <Link className={`nav-link text-dark ${isActive("/producao")}`} to="/producao">
              ⚙️ Produção
            </Link>

            <Link className={`nav-link text-dark ${isActive("/historico")}`} to="/historico">
              📚 Histórico
            </Link>

            <Link className={`nav-link text-dark ${isActive("/calculadora-online")}`} to="/calculadora-online">
              🧮 Calculadora
            </Link>

          </div>

          {/* SAIR */}
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            Sair
          </button>

        </div>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div
          className="bg-white shadow-sm d-md-none p-3"
          style={{ animation: "fadeIn 0.2s" }}
        >
          <Link
            className="btn btn-outline-dark w-100 mb-2"
            to="/calculo"
            onClick={() => setOpen(false)}
          >
            📊 Cálculo
          </Link>

          <Link
            className="btn btn-outline-dark w-100 mb-2"
            to="/receitas"
            onClick={() => setOpen(false)}
          >
            📘 Receitas
          </Link>

          <Link
            className="btn btn-outline-dark w-100 mb-2"
            to="/producao"
            onClick={() => setOpen(false)}
          >
            ⚙️ Produção
          </Link>

          <Link
            className="btn btn-outline-dark w-100"
            to="/historico"
            onClick={() => setOpen(false)}
          >
            📚 Histórico
          </Link>

          <Link
            className="btn btn-outline-dark w-100"
            to="/calculadora-online"
            onClick={() => setOpen(false)}
          >
            🧮 Calculadora
          </Link>

        </div>
      )}
    </>
  );
}
