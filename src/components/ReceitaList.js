import React, { useState } from "react";
import ConfirmModal from "./ConfirmacaoModal";

export default function ReceitaList({ receitas = [], onApagar, onEditar }) {
  const [showModal, setShowModal] = useState(false);
  const [receitaParaApagar, setReceitaParaApagar] = useState(null);

  const abrirModal = (r) => {
    setReceitaParaApagar(r);
    setShowModal(true);
  };

  const confirmarApagar = () => {
    onApagar(receitaParaApagar.id);
    setShowModal(false);
    setReceitaParaApagar(null);
  };

  return (
    <div className="mb-5">
      <h2 className="text-center text-primary mb-4 fs-3">📋 Receitas</h2>
      {receitas.map((r) => (
        <div key={r.id} className="table-responsive mb-4">
          <table className="table table-bordered table-hover text-center align-middle">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th>Ingrediente</th>
                <th>Quantidade</th>
                <th>Unidade</th>
                <th>Preço / Uni</th>
                <th>Subtotal</th>
                <th colSpan="2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(r.ingredientes || []).map((ing, idx) => (
                <tr key={`${r.id}-${idx}`}>
                  {idx === 0 && (
                    <td rowSpan={(r.ingredientes || []).length}>{r.nome}</td>
                  )}
                  <td>{ing.produto}</td>
                  <td>{ing.quantidade}</td>
                  <td>{ing.unidade || ""}</td>
                  <td>{ing.preco?.toFixed(2) || "0.00"} €</td>
                  <td>{ing.subtotal?.toFixed(2) || "0.00"} €</td>
                  {idx === 0 && (
                    <>
                      <td rowSpan={(r.ingredientes || []).length}>
                        <button
                          className="btn btn-warning"
                          onClick={() => onEditar(r)}
                        >
                          ✏️ Editar
                        </button>
                      </td>
                      <td rowSpan={(r.ingredientes || []).length}>
                        <button
                          className="btn btn-danger"
                          onClick={() => abrirModal(r)}
                        >
                          🗑 Apagar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              <tr className="table-secondary fw-bold">
                <td colSpan="5" className="text-end">Total Receita:</td>
                <td colSpan="3">{r.total?.toFixed(2) || "0.00"} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <ConfirmModal
        show={showModal}
        mensagem={`Tem certeza que deseja apagar a receita "${receitaParaApagar?.nome}"?`}
        onClose={() => setShowModal(false)}
        onConfirm={confirmarApagar}
      />

    </div>
  );
}
