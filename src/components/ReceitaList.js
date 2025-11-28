import React, { useState } from "react";
import ConfirmModal from "./ConfirmacaoModal";
import DiferencasModal from "./DiferencasModal";

export default function ReceitaList({ receitas = [], onApagar, onEditar, onAtualizarDireto }) {
  const [showModal, setShowModal] = useState(false);
  const [receitaParaApagar, setReceitaParaApagar] = useState(null);
  const [modalDiff, setModalDiff] = useState(null);

  const abrirModal = (r) => {
    setReceitaParaApagar(r);
    setShowModal(true);
  };

  const confirmarApagar = () => {
    if (receitaParaApagar) {
      onApagar(receitaParaApagar.id);
    }
    setShowModal(false);
    setReceitaParaApagar(null);
  };


  if (!receitas.length) {
    return <p className="text-muted">Nenhuma receita para mostrar.</p>;
  }

  return (
    <div className="mb-3">
      {receitas.map((r) => (
        <div
          key={r.id}
          className="p-3 mb-4"
          style={{
            background: "#f7f7f7",
            borderRadius: "12px",
            border: "1px solid #e0e0e0",
            boxShadow: "0px 3px 8px rgba(0,0,0,0.05)"
          }}
        >
          <div
            className="card border-0 shadow-sm mb-2"
            style={{ borderRadius: "10px" }}
          >
            {/* HEADER DA RECEITA */}
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <div>
                <h6 className="mb-0 fw-bold">
                  {r.nome}
                  {r.desatualizada && (
                    <span className="badge bg-danger ms-2">
                      ⚠️ Desatualizada
                    </span>

                  )}



                </h6>
                <small className="text-muted">
                  {r.ingredientes?.length || 0} ingrediente(s)
                </small>
              </div>
              <div className="text-end fw-bold">
                Total: {(r.total ?? 0).toFixed(2)} €
              </div>
            </div>

            {/* TABELA DE INGREDIENTES */}
            <div className="card-body p-2">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-2">
                  <thead className="table-light">
                    <tr>
                      <th>Ingrediente</th>
                      <th className="text-end">Qtd</th>
                      <th className="text-center">Unidade</th>
                      <th className="text-end">Preço / Uni</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.ingredientes || []).map((ing, idx) => (
                      <tr key={`${r.id}-${idx}`}>
                        <td>{ing.produto}</td>
                        <td className="text-end">{ing.quantidade}</td>
                        <td className="text-center">{ing.unidade || ""}</td>
                        <td className="text-end">
                          {(ing.preco ?? 0).toFixed(2)} €
                        </td>
                        <td className="text-end">
                          {(ing.subtotal ?? 0).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BOTÕES */}
              <div className="d-flex justify-content-end gap-2 mt-2">

                {/* Se estiver ATUALIZADA → mostrar Editar */}
                {!r.desatualizada && (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => onEditar(r)}
                  >
                    ✏️ Editar
                  </button>
                )}

                {/* Se estiver DESATUALIZADA → mostrar Ver */}
                {r.desatualizada && (
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => setModalDiff(r)}
                  >
                    👁️ Ver
                  </button>
                )}

                {/* Apagar — aparece sempre */}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => abrirModal(r)}
                >
                  🗑️ Apagar
                </button>

              </div>

            </div>
          </div>
        </div>
      ))}

      {/* MODAL DE DIFERENÇAS */}
      <DiferencasModal
        show={!!modalDiff}
        onClose={() => setModalDiff(null)}
        receita={modalDiff}
        onAtualizar={() => onAtualizarDireto(modalDiff)}
      />




      <ConfirmModal
        show={showModal}
        mensagem={
          receitaParaApagar
            ? `Tem certeza que deseja apagar a receita "${receitaParaApagar.nome}"?`
            : ""
        }
        onClose={() => setShowModal(false)}
        onConfirm={confirmarApagar}
      />
    </div>
  );
}
