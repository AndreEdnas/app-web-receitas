import React, { useEffect, useState } from "react";
import { getReceitas } from "../services/receitasService";
import { getProdutos } from "../services/produtosService";
import { useNgrokUrl } from "../hooks/useNgrokUrl";

export default function CalculoPage() {
  const apiUrl = useNgrokUrl("Mimos");
  const [comparacoes, setComparacoes] = useState([]);
  const [filtro, setFiltro] = useState("todos"); // "todos" | "lucro" | "perda"

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

          if (!artigo) return null;

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
              diferencaPct:
                precoJson > 0
                  ? ((precoAtual - precoJson) / precoJson) * 100
                  : 0,
            };
          });

          const precoVenda = Number(artigo.precovenda) || 0;

          // Lucro com JSON
          const lucroJson = precoVenda - custoJson;
          const markupJsonPct =
            custoJson > 0 ? (lucroJson / custoJson) * 100 : 0;

          // Lucro com BD (Atual)
          const lucroBD = precoVenda - custoAtual;
          const markupBDPct =
            custoAtual > 0 ? (lucroBD / custoAtual) * 100 : 0;

          return {
            receita: receita.nome,
            ingredientes: ingredientesComparados,
            custoJson,
            custoAtual,
            precoVenda,
            lucroJson,
            markupJsonPct,
            lucroBD,
            markupBDPct,
            margemBruta: artigo.margembruta || 0,
          };
        })
        .filter(Boolean);

      setComparacoes(resultados);
    })();
  }, [apiUrl]);

  if (!comparacoes.length) return <p>🔄 A calcular receitas...</p>;

  // aplica o filtro escolhido
  const comparacoesFiltradas = comparacoes.filter((c) => {
    if (filtro === "lucro") return c.lucroBD >= 0;
    if (filtro === "perda") return c.lucroBD < 0;
    return true; // todos
  });

  return (
    <div className="container mt-4" >
      <h2 className="mb-4 text-primary">📊 Análise de Receitas</h2>

      {/* 🔽 Filtro de seleção */}
      <div className="mb-3 d-flex justify-content-end gap-2">
        <button
          className={`btn ${
            filtro === "todos" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setFiltro("todos")}
        >
          Todas
        </button>
        <button
          className={`btn ${
            filtro === "lucro" ? "btn-success" : "btn-outline-success"
          }`}
          onClick={() => setFiltro("lucro")}
        >
          Só Lucro ✅
        </button>
        <button
          className={`btn ${
            filtro === "perda" ? "btn-danger" : "btn-outline-danger"
          }`}
          onClick={() => setFiltro("perda")}
        >
          Só Perda ❌
        </button>
      </div>

      {comparacoesFiltradas.map((c, idx) => (
        <div key={idx} className="card shadow mb-4 border-0">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <h5 className="mb-0">{c.receita}</h5>
            {c.lucroBD >= 0 ? (
              <span className="badge bg-success">Lucro ✅</span>
            ) : (
              <span className="badge bg-danger">Perda ❌</span>
            )}
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ingrediente</th>
                    <th className="text-end">Qtd</th>
                    <th className="text-center">Unidade</th>
                    <th className="text-end">Preço Receita</th>
                    <th className="text-end">Preço Receita Nova</th>
                    <th className="text-end">Diferença</th>
                    <th className="text-end">Subtotal Receita</th>
                    <th className="text-end">Subtotal Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {c.ingredientes.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.produto}</td>
                      <td className="text-end">{ing.quantidade}</td>
                      <td className="text-center">{ing.unidade}</td>
                      <td className="text-end">
                        {ing.precoJson.toFixed(2)} €
                      </td>
                      <td
                        className={`text-end ${
                          ing.precoAtual > ing.precoJson
                            ? "text-danger fw-bold"
                            : ing.precoAtual < ing.precoJson
                            ? "text-success fw-bold"
                            : ""
                        }`}
                      >
                        {ing.precoAtual.toFixed(2)} €
                      </td>
                      <td
                        className={`text-end ${
                          ing.diferenca !== 0 ? "fw-bold" : "text-muted"
                        }`}
                      >
                        {ing.diferenca.toFixed(2)} €{" "}
                        {ing.diferencaPct !== 0 && (
                          <small
                            className={
                              ing.diferencaPct > 0
                                ? "text-danger"
                                : "text-success"
                            }
                          >
                            ({ing.diferencaPct.toFixed(1)}%)
                          </small>
                        )}
                      </td>
                      <td className="text-end">
                        {ing.subtotalJson.toFixed(2)} €
                      </td>
                      <td
                        className={`text-end ${
                          ing.subtotalJson !== ing.subtotalAtual
                            ? "text-danger fw-bold"
                            : ""
                        }`}
                      >
                        {ing.subtotalAtual.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <p className="mb-1">
                <strong>Total Receita:</strong> {c.custoJson.toFixed(2)} €
              </p>
              <p className="mb-1">
                <strong>Total Receita Nova:</strong> {c.custoAtual.toFixed(2)} €
              </p>
              <p className="mb-1">
                <strong>Margem Bruta:</strong> {c.margemBruta}%
              </p>
              <p className="mb-1">
                <strong>Preço Venda:</strong> {c.precoVenda.toFixed(2)} €
              </p>

              <p
                className={`mb-1 ${
                  c.lucroJson >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {c.lucroJson >= 0
                  ? "✅ Lucro Receita:"
                  : "❌ Perda Receita:"}{" "}
                {c.lucroJson.toFixed(2)} € ({c.markupJsonPct.toFixed(1)}%)
              </p>

              <p
                className={`mb-1 ${
                  c.lucroBD >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {c.lucroBD >= 0
                  ? "✅ Lucro Receita Nova:"
                  : "❌ Perda Receita Nova:"}{" "}
                {c.lucroBD.toFixed(2)} € ({c.markupBDPct.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
