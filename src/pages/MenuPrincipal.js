import React from "react";
import { Link } from "react-router-dom";

export default function MenuPrincipal({ loja, user, onLogout }) {
  return (
    <div className="container-fluid bg-warning py-3">
      <div className="d-flex justify-content-between">
        <div>
          <b>Loja:</b> {loja} <br/>
          <b>User:</b> {user?.nome}
        </div>

        <button className="btn btn-danger" onClick={onLogout}>
          Sair / Trocar Loja
        </button>
      </div>

      <div className="d-flex justify-content-center mt-4 gap-3">
        <Link className="btn btn-primary" to="/calculo">Cálculo</Link>
        <Link className="btn btn-primary" to="/receitas">Receitas</Link>
        <Link className="btn btn-primary" to="/producao">Produção</Link>
        <Link className="btn btn-primary" to="/abates">Histórico</Link>
      </div>
    </div>
  );
}
