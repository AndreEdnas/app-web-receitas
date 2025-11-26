// CalculoPage.js
import React, { useEffect, useState } from "react";

import { getReceitas } from "../services/receitasService";
import { getProdutos } from "../services/produtosService";

export default function CalculoPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [comparacoes, setComparacoes] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  // Função segura para arredondar números
  const fix = (n, d = 2) => Number(n ?? 0).toFixed(d);

  useEffect(() => {
    if (!apiUrl) return;

    (async () => {
      const receitas = await getReceitas(apiUrl);
      const produtos = await getProdutos(apiUrl);

      const resultados = receitas
        .map((receita) => {
          const artigo = produtos.find(
            (p) =>
              p.codigo === receita.id ||
              (p.descricao || "").toLowerCase() ===
              (receita.nome || "").toLowerCase()
          );

          if (!artigo) {
            console.warn("Produto não encontrado para receita:", receita.nome);
            return null;
          }

          let custoJson = 0;
          let custoAtual = 0;

          const ingredientesComparados = receita.ingredientes.map((ing) => {
            const prod = produtos.find((p) => p.codigo === ing.id);

            const precoJson = Number(ing.preco) || 0;
            const precoAtual = prod ? Number(prod.precocompra) || 0 : precoJson;
            const qtd = parseFloat(ing.quantidade) || 0;

            const subtotalJson = precoJson * qtd;
            const subtotalAtual = precoAtual * qtd;

            custoJson += subtotalJson;
            custoAtual += subtotalAtual;

            return {
              ...ing,
              precoJson,
              precoAtual,
              subtotalJson,
              subtotalAtual,
              diferenca: precoAtual - precoJson,
            };
          });

          const precoVenda = Number(artigo.precovenda) ?? 0;

          const lucroJson = precoVenda - custoJson;
          const lucroBD = precoVenda - custoAtual;

          const margemAntiga =
            precoVenda > 0 ? (lucroJson / precoVenda) * 100 : 0;

          const margemAtual =
            precoVenda > 0 ? (lucroBD / precoVenda) * 100 : 0;

          return {
            receita: receita.nome,
            ingredientes: ingredientesComparados,
            custoJson,
            custoAtual,
            precoVenda,
            lucroJson,
            lucroBD,
            margemAntiga,
            margemAtual,
          };
        })
        .filter(Boolean);

      setComparacoes(resultados);
    })();
  }, [apiUrl]);

  if (!comparacoes.length)
    return <p className="text-center mt-5">🔄 A calcular receitas...</p>;

  const comparacoesFiltradas = comparacoes.filter((c) => {
    if (filtro === "lucro") return c.lucroBD >= 0;
    if (filtro === "perda") return c.lucroBD < 0;
    return true;
  });

  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">📊 Análise de Receitas</h2>

        <div className="btn-group shadow-sm">
          <button
            className={`btn ${filtro === "todos" ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => setFiltro("todos")}
          >
            Todas
          </button>

          <button
            className={`btn ${filtro === "lucro" ? "btn-success" : "btn-outline-success"
              }`}
            onClick={() => setFiltro("lucro")}
          >
            Lucro
          </button>

          <button
            className={`btn ${filtro === "perda" ? "btn-danger" : "btn-outline-danger"
              }`}
            onClick={() => setFiltro("perda")}
          >
            Perda
          </button>
        </div>
      </div>

      {/* CARDS */}
      {comparacoesFiltradas.map((c, idx) => (
        <div key={idx} className="card shadow-sm border-0 mb-4">
          <div
            className={`card-header d-flex justify-content-between align-items-center 
  ${c.lucroBD >= 0 ? "bg-success" : "bg-danger"} text-white`}
            style={{ padding: "14px 20px" }}
          >
            <h5 className="mb-0 fw-bold" style={{ fontSize: "1.25rem" }}>
              {c.receita}
            </h5>

            <div className="text-end">
              <div
                className="badge"
                style={{
                  fontSize: "1rem",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(2px)",
                }}
              >
                Preço Venda: <strong>{fix(c.precoVenda)}€</strong>
              </div>
            </div>
          </div>



          <div className="card-body">
            {/* INGREDIENTES */}
            <div className="table-responsive mb-3">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ingrediente</th>
                    <th className="text-end">Qtd</th>
                    <th className="text-center">Unidade</th>
                    <th className="text-end">Preço Antigo (Un)</th>
                    <th className="text-end">Preço Uni Atual (Un)</th>
                    <th className="text-end">Diferença</th>
                    <th className="text-end">Subtotal Antigo</th>
                    <th className="text-end">Subtotal Atual</th>
                  </tr>
                </thead>

                <tbody>
                  {c.ingredientes.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.produto}</td>
                      <td className="text-end">{fix(ing.quantidade, 3)}</td>
                      <td className="text-center">{ing.unidade}</td>
                      <td className="text-end text-muted">
                        {fix(ing.precoJson)} €
                      </td>
                      <td
                        className={`text-end fw-bold ${ing.precoAtual > ing.precoJson
                          ? "text-danger"
                          : ing.precoAtual < ing.precoJson
                            ? "text-success"
                            : ""
                          }`}
                      >
                        {fix(ing.precoAtual)} €
                      </td>
                      <td className="text-end">
                        <span
                          className={`fw-bold ${ing.diferenca > 0
                            ? "text-danger"
                            : ing.diferenca < 0
                              ? "text-success"
                              : "text-muted"
                            }`}
                        >
                          {fix(ing.diferenca)} €
                        </span>
                      </td>
                      <td className="text-end text-muted">
                        {fix(ing.subtotalJson)} €
                      </td>
                      <td className="text-end fw-bold">
                        {fix(ing.subtotalAtual)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RESUMOS */}
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded border">
                  <h6 className="fw-bold text-secondary">📦 Custos</h6>
                  <p>
                    <strong>Receita Antiga:</strong> {fix(c.custoJson)} €
                  </p>
                  <p>
                    <strong>Receita Atual:</strong> {fix(c.custoAtual)} €
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded border">
                  <h6 className="fw-bold text-secondary">💰 Lucro / Margens</h6>

                  <p className={c.lucroBD >= 0 ? "text-success" : "text-danger"}>
                    <strong>Lucro Atual:</strong> {fix(c.lucroBD)} €
                  </p>

                  <p className={c.margemAtual >= 0 ? "text-success" : "text-danger"}>
                    <strong>Margem Atual:</strong> {fix(c.margemAtual, 1)}%
                  </p>

                  <p className={c.lucroJson >= 0 ? "text-success" : "text-danger"}>
                    <strong>Lucro Antigo:</strong> {fix(c.lucroJson)} €
                  </p>

                  <p className={c.margemAntiga >= 0 ? "text-success" : "text-danger"}>
                    <strong>Margem Antiga:</strong> {fix(c.margemAntiga, 1)}%
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      ))
      }
    </div >
  );
}
