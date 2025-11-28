// CalculoPage.js
import React, { useEffect, useState } from "react";

import { getReceitas } from "../services/receitasService";
import { getProdutos } from "../services/produtosService";

export default function CalculoPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [comparacoes, setComparacoes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const mudou = (antigo, atual) => Number(fix(antigo)) !== Number(fix(atual));

  // Função segura para arredondar números
  const fix = (n, d = 2) => Number(n ?? 0).toFixed(d);
  const [filtroLucroTipo, setFiltroLucroTipo] = useState("acima");
  const [filtroLucroValor, setFiltroLucroValor] = useState("");
  const [pesquisaNome, setPesquisaNome] = useState("");
  const [filtroTipoBase, setFiltroTipoBase] = useState("lucro");



  const corDiferenca = (novo, antigo) => {
    if (novo > antigo) return "text-success";   // verde
    if (novo < antigo) return "text-danger";    // vermelho
    return "text-muted";                        // igual
  };

  const corCusto = (atual, antigo) => {
    if (atual < antigo) return "text-success";   // custo abaixou -> verde
    if (atual > antigo) return "text-danger";    // custo subiu -> vermelho
    return "text-muted";                         // igual
  };




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





  // === PESQUISAR POR NOME ===
  const aplicarPesquisa = (lista) => {
    if (!pesquisaNome.trim()) return lista;

    return lista.filter((c) =>
      c.receita.toLowerCase().includes(pesquisaNome.toLowerCase())
    );
  };

  // === FILTRAR POR LUCRO (€) ===
  // === FILTRAR POR LUCRO (€) OU MARGEM (%) ===
  const aplicarFiltroLucro = (lista) => {
    if (!filtroLucroValor.trim()) return lista;

    const alvo = Number(filtroLucroValor);

    return lista.filter((c) => {
      let valor = 0;

      if (filtroTipoBase === "lucro") {
        valor = Number(c.lucroBD);
      } else {
        valor = Number(c.margemAtual);
      }

      if (filtroLucroTipo === "acima") return valor > alvo;
      if (filtroLucroTipo === "abaixo") return valor < alvo;
      if (filtroLucroTipo === "igual") return Math.abs(valor - alvo) < 0.01;

      return true;
    });
  };



  // === RESULTADO FINAL ===
  const comparacoesFinal = aplicarFiltroLucro(
    aplicarPesquisa(comparacoesFiltradas)
  );



  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">📊 Análise de Receitas</h2>
      </div>
      {/* === TRÊS CAIXAS UNIFORMES — 100% RESPONSIVAS === */}
      {/* === TRÊS CAIXAS UNIFORMES E ALINHADAS === */}
      <div className="row g-3 mt-3 mb-4">

        {/* 1️⃣ PESQUISA */}
        <div className="col-sm-4">
          <div
            className="p-3 rounded shadow-sm"
            style={{
              background: "#f8f9fa",
              border: "1px solid #e5e5e5",
              minHeight: "70px",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <label className="fw-bold m-0">🔍 Pesquisar:</label>

              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Nome da receita..."
                value={pesquisaNome}
                onChange={(e) => setPesquisaNome(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* 2️⃣ BOTÕES */}
        <div className="col-sm-4">
          <div
            className="p-3 rounded shadow-sm d-flex justify-content-center"
            style={{
              background: "#f8f9fa",
              border: "1px solid #e5e5e5",
              minHeight: "70px",
            }}
          >
            <div className="d-flex justify-content-center gap-2">

              <button
                className={`btn btn-sm px-3 ${filtro === "todos" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setFiltro("todos")}
              >
                Todas
              </button>

              <button
                className={`btn btn-sm px-3 ${filtro === "lucro" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setFiltro("lucro")}
              >
                Lucro
              </button>

              <button
                className={`btn btn-sm px-3 ${filtro === "perda" ? "btn-danger" : "btn-outline-danger"}`}
                onClick={() => setFiltro("perda")}
              >
                Perda
              </button>

            </div>
          </div>
        </div>

        {/* 3️⃣ FILTRO LUCRO/MARGEM */}
        <div className="col-sm-4">
          <div
            className="p-3 rounded shadow-sm"
            style={{
              background: "#f8f9fa",
              border: "1px solid #e5e5e5",
              minHeight: "70px",
            }}
          >
            <div className="d-flex align-items-center justify-content-center gap-2">


              {/* Select Lucro/Margem */}
              <select
                className="form-select"
                style={{
                  width: "140px",
                  height: "32px",
                  paddingTop: "0",
                  paddingBottom: "0",
                  fontSize: "0.9rem",
                }}
                value={filtroTipoBase}
                onChange={(e) => setFiltroTipoBase(e.target.value)}
              >
                <option value="lucro">Lucro (€)</option>
                <option value="margem">Margem (%)</option>
              </select>

              {/* Acima/Abaixo/Igual */}
              <select
                className="form-select"
                style={{
                  width: "130px",
                  height: "32px",
                  paddingTop: "0",
                  paddingBottom: "0",
                  fontSize: "0.9rem",
                }}
                value={filtroLucroTipo}
                onChange={(e) => setFiltroLucroTipo(e.target.value)}
              >
                <option value="acima">Acima de</option>
                <option value="abaixo">Abaixo de</option>
                <option value="igual">Igual a</option>
              </select>

              {/* Valor */}
              <input
                type="number"
                className="form-control"
                placeholder={filtroTipoBase === "lucro" ? "€" : "%"}
                style={{
                  width: "80px",
                  height: "32px",
                  paddingTop: "0",
                  paddingBottom: "0",
                  fontSize: "0.9rem",
                }}
                value={filtroLucroValor}
                onChange={(e) => setFiltroLucroValor(e.target.value)}
              />

              {/* Reset */}
              <button
                className="btn btn-outline-secondary"
                style={{
                  height: "32px",
                  width: "32px",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  setFiltro("todos");
                  setFiltroLucroValor("");
                  setPesquisaNome("");
                  setFiltroLucroTipo("acima");
                  setFiltroTipoBase("lucro");
                }}
              >
                ⟳
              </button>

            </div>
          </div>
        </div>

      </div>






      {/* CARDS */}
      {
        comparacoesFinal.map((c, idx) => (
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

              {/* ==== FILA COM OS DOIS BLOCOS (TAMANHO IGUAL) ==== */}
              <div className="row mt-4">

                {/* ====== BLOCO: CUSTOS ====== */}
                <div className="col-md-6 mb-4">
                  <div className="p-4 rounded shadow-sm h-100" style={{ background: "#f8f9fa" }}>
                    <h6 className="fw-bold mb-4">📦 Custos</h6>

                    <div style={{ position: "relative" }}>

                      {/* Seta central */}
                      {mudou(c.custoJson, c.custoAtual) && (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "63%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "22px",
                            fontWeight: "bold",
                            zIndex: 10,
                            pointerEvents: "none",
                          }}
                        >
                          →
                        </div>
                      )}


                      <table className="table text-center m-0" style={{ tableLayout: "fixed" }}>
                        <thead>
                          <tr>
                            {mudou(c.custoJson, c.custoAtual) && <th className="fw-bold">Antiga</th>}
                            <th className="fw-bold">Atual</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr>
                            {mudou(c.custoJson, c.custoAtual) && (
                              <td className="text-muted">{fix(c.custoJson)} €</td>
                            )}

                            <td className={corCusto(c.custoAtual, c.custoJson)}>
                              {fix(c.custoAtual)} €
                            </td>

                          </tr>
                        </tbody>
                      </table>

                    </div>
                  </div>
                </div>

                {/* ====== BLOCO: LUCRO + MARGEM ====== */}
                <div className="col-md-6 mb-4">
                  <div className="p-4 rounded shadow-sm h-100" style={{ background: "#f8f9fa" }}>
                    <h6 className="fw-bold mb-4">💰 Lucro / Margens</h6>

                    {/* LAYOUT LADO A LADO */}
                    <div className="d-flex flex-column flex-md-row gap-4">

                      {/* ==== BLOCO LUCRO ==== */}
                      <div className="flex-fill text-center">
                        <h6 className="fw-bold mb-3">Lucro</h6>

                        <div style={{ position: "relative" }}>
                          {mudou(c.custoJson, c.custoAtual) && (
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "63%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "22px",
                                fontWeight: "bold",
                                zIndex: 10,
                                pointerEvents: "none",
                              }}
                            >
                              →
                            </div>
                          )}


                          <table className="table text-center m-0" style={{ tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                {mudou(c.lucroJson, c.lucroBD) && <th className="fw-bold">Antigo</th>}
                                <th className="fw-bold">Atual</th>
                              </tr>
                            </thead>

                            <tbody>
                              <tr>
                                {mudou(c.lucroJson, c.lucroBD) && (
                                  <td className="text-muted">{fix(c.lucroJson)} €</td>
                                )}

                                <td className={corDiferenca(c.lucroBD, c.lucroJson)}>
                                  {fix(c.lucroBD)} €
                                </td>
                              </tr>
                            </tbody>


                          </table>

                        </div>
                      </div>

                      {/* ==== BLOCO MARGEM ==== */}
                      <div className="flex-fill text-center">
                        <h6 className="fw-bold mb-3">Margem</h6>

                        <div style={{ position: "relative" }}>
                          {mudou(c.custoJson, c.custoAtual) && (
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "63%",
                                transform: "translate(-50%, -50%)",
                                fontSize: "22px",
                                fontWeight: "bold",
                                zIndex: 10,
                                pointerEvents: "none",
                              }}
                            >
                              →
                            </div>
                          )}


                          <table className="table text-center m-0" style={{ tableLayout: "fixed" }}>
                            <thead>
                              <tr>
                                {mudou(c.margemAntiga, c.margemAtual) && <th className="fw-bold">Antiga</th>}
                                <th className="fw-bold">Atual</th>
                              </tr>
                            </thead>

                            <tbody>
                              <tr>
                                {mudou(c.margemAntiga, c.margemAtual) && (
                                  <td className="text-muted">{fix(c.margemAntiga)}%</td>
                                )}

                                <td className={corDiferenca(c.margemAtual, c.margemAntiga)}>
                                  {fix(c.margemAtual)}%
                                </td>
                              </tr>
                            </tbody>

                          </table>

                        </div>
                      </div>

                    </div>
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
