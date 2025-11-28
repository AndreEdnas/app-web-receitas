import React, { useEffect, useState } from "react";
import { getReceitas } from "../services/receitasService";
import { getProdutos, updateProduto, getVendasByDate, saveAbate } from "../services/produtosService";

export default function ProduzirReceitaPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [receitas, setReceitas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [pendentes, setPendentes] = useState([]); // preview
  const [resultado, setResultado] = useState(null); // aplicados
  const [modo, setModo] = useState("manual"); // "manual" | "ficheiro"
  const [dataTalao, setDataTalao] = useState(null); // 📅 data extraída do TXT
  const [showDropdown, setShowDropdown] = useState(false);
  const [textoReceita, setTextoReceita] = useState("");

  useEffect(() => {
    if (!apiUrl) return;
    (async () => {
      const receitasData = await getReceitas(apiUrl);
      const produtosData = await getProdutos(apiUrl);
      setReceitas(receitasData);
      setProdutos(produtosData);
    })();
  }, [apiUrl]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".form-group-receita")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);


  // 📂 Processa TXT (produtos + receitas + vendas BD)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;

      // 👉 extrai a data (sem hora)
      const matchData = text.match(/TALÃO - (\d{2}-\d{2}-\d{4})/);
      if (matchData) {
        const soData = matchData[1];     // "28-11-2025"
        const partes = soData.split("-");
        // converter para yyyy-mm-dd
        const dataISO = `${partes[2]}-${partes[1]}-${partes[0]}`;
        setDataTalao(dataISO);
      }


      const dataExtraida = matchData ? matchData[1] : null;


      const linhas = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const produtosAtualizados = await getProdutos(apiUrl);
      let lista = [];

      // --- Produtos e receitas do ficheiro ---
      for (const linha of linhas) {
        const match = linha.match(/(\d+)\s*:\s*(\d+)\s*x/i);
        if (!match) continue;

        const codigo = parseInt(match[1], 10);
        const qtd = parseFloat(match[2]);

        const receita = receitas.find((r) => r.id === codigo);

        if (receita) {
          let produtosReceita = [];
          for (const ing of receita.ingredientes) {
            const produto = produtosAtualizados.find((p) => p.codigo === ing.id);
            if (!produto) continue;

            const qtdAbater = parseFloat(ing.quantidade) * qtd;
            const stockAntes = Number(produto.qtdstock) || 0;
            const novoStock = stockAntes - qtdAbater;

            produtosReceita.push({
              codigo: produto.codigo,
              produto: produto.descricao,
              antes: stockAntes,
              abate: qtdAbater,
              depois: novoStock,
            });
          }

          lista.push({
            tipo: "receita",
            nome: receita.nome,
            qtd,
            produtos: produtosReceita,
          });
        } else {
          const produto = produtosAtualizados.find((p) => p.codigo === codigo);
          if (!produto) continue;

          const stockAntes = Number(produto.qtdstock) || 0;
          const novoStock = stockAntes - qtd;

          lista.push({
            tipo: "produto",
            codigo,
            produto: produto.descricao,
            antes: stockAntes,
            abate: qtd,
            depois: novoStock,
          });
        }
      }

      // --- Vendas da BD (se houver data no talão) ---
      if (dataExtraida) {
        const vendas = await getVendasByDate(apiUrl, dataExtraida);

        for (const venda of vendas) {
          const receitaVenda =
            receitas.find(r => r.id === venda.codigo) ||
            receitas.find(r => r.nome.toLowerCase() === venda.descricao.toLowerCase());

          if (receitaVenda) {
            let produtosReceita = [];

            for (const ing of receitaVenda.ingredientes) {
              const produtoIng = produtosAtualizados.find(p => p.codigo === ing.id);
              if (!produtoIng) continue;

              const qtdAbater = parseFloat(ing.quantidade) * venda.qtd;
              const stockAntes = Number(produtoIng.qtdstock) || 0;
              const novoStock = stockAntes - qtdAbater;

              produtosReceita.push({
                codigo: produtoIng.codigo,
                produto: produtoIng.descricao,
                antes: stockAntes,
                abate: qtdAbater,
                depois: novoStock,
              });
            }

            lista.push({
              tipo: "receita",
              origem: "bd",   // 👈 IDENTIFICA QUE É VENDA DA BD
              nome: receitaVenda.nome,
              qtd: venda.qtd,
              produtos: produtosReceita
            });

            continue;
          }

          // produto simples (lógica antiga)
          const produto = produtosAtualizados.find(
            p => p.descricao === venda.descricao
          );
          if (!produto) continue;

          const stockAntes = Number(produto.qtdstock) || 0;
          const novoStock = stockAntes - venda.qtd;

          lista.push({
            tipo: "venda",
            origem: "bd",
            codigo: produto.codigo,
            produto: produto.descricao,
            antes: stockAntes,
            abate: venda.qtd,
            depois: novoStock,
          });
        }
      }

      // Agrupar abates por produto
      const mapa = {};

      for (const item of lista) {
        if (item.tipo === "receita") {
          for (const prod of item.produtos) {
            if (!mapa[prod.codigo]) {
              mapa[prod.codigo] = {
                inicial: prod.antes,
                totalAbate: 0
              };
            }
            mapa[prod.codigo].totalAbate += prod.abate;
          }
        } else if (item.tipo === "produto" || item.tipo === "venda") {
          if (!mapa[item.codigo]) {
            mapa[item.codigo] = {
              inicial: item.antes,
              totalAbate: 0
            };
          }
          mapa[item.codigo].totalAbate += item.abate;
        }
      }

      // Aplicar o valor final (depois) real a cada item
      for (const item of lista) {
        if (item.tipo === "receita") {
          for (const prod of item.produtos) {
            const m = mapa[prod.codigo];
            prod.depois = m.inicial - m.totalAbate;
          }
        } else if (item.tipo === "produto" || item.tipo === "venda") {
          const m = mapa[item.codigo];
          item.depois = m.inicial - m.totalAbate;
        }
      }


      setPendentes(lista);
      setResultado(null);
    };

    reader.readAsText(file);
  };

  // 📊 Preview manual (receita escolhida)
  const handlePreviewReceita = async () => {
    if (!receitaSelecionada || quantidade <= 0) return;

    const receita = receitas.find((r) => r.id === receitaSelecionada);

    if (!receita) return;

    const produtosAtualizados = await getProdutos(apiUrl);
    let produtosReceita = [];

    for (const ing of receita.ingredientes) {
      const produto = produtosAtualizados.find((p) => p.codigo === ing.id);
      if (!produto) continue;

      const qtdAbater = parseFloat(ing.quantidade) * quantidade;
      const stockAntes = Number(produto.qtdstock) || 0;
      const novoStock = stockAntes - qtdAbater;

      produtosReceita.push({
        codigo: produto.codigo,
        produto: produto.descricao,
        antes: stockAntes,
        abate: qtdAbater,
        depois: novoStock,
      });
    }

    setPendentes([
      { tipo: "receita", nome: receita.nome, qtd: quantidade, produtos: produtosReceita },
    ]);
    setResultado(null);
    setDataTalao(null);
  };

  // ✅ Confirmar abates
  const handleConfirmar = async () => {
    for (const item of pendentes) {
      if (item.tipo === "produto" || item.tipo === "venda") {
        await updateProduto(apiUrl, item.codigo, { qtdstock: item.depois });
      } else if (item.tipo === "receita") {
        for (const p of item.produtos) {
          await updateProduto(apiUrl, p.codigo, { qtdstock: p.depois });
        }
      }
    }

    // 👉 Guardar no histórico
    await saveAbate(apiUrl, {
      data: dataTalao ? dataTalao : new Date().toISOString().slice(0, 10),

      registros: pendentes,
    });

    setResultado(pendentes);
    setPendentes([]);
    const atualizados = await getProdutos(apiUrl);
    setProdutos(atualizados);
  };

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  return (
    <div className="container mt-4">
      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">⚙️ Produção / Abate de Stock</h2>
          <small className="text-muted">
            Gere abates a partir de receitas ou talões TXT, com pré-visualização antes de gravar.
          </small>
        </div>

        {/* Seletor modo */}
        <div className="btn-group mt-3 mt-md-0 shadow-sm">
          <button
            className={`btn ${modo === "manual" ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => {
              setModo("manual");
              setPendentes([]);
              setResultado(null);
              setDataTalao(null);
            }}
          >
            📝 Modo Manual
          </button>
          <button
            className={`btn ${modo === "ficheiro" ? "btn-primary" : "btn-outline-primary"
              }`}
            onClick={() => {
              setModo("ficheiro");
              setPendentes([]);
              setResultado(null);
              setDataTalao(null);
            }}
          >
            📄 Talão TXT
          </button>
        </div>
      </div>

      <div className="row">
        {/* COLUNA ESQUERDA: FORM / FICHEIRO */}
        <div className="col-lg-4 mb-4">
          {modo === "manual" && (
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-light">
                <h5 className="mb-0 fw-bold text-secondary">
                  📝 Produção Manual
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="mb-3 form-group-receita">
                    <label className="form-label fw-bold">Receita</label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="🔍 Procurar receita..."
                      value={textoReceita}
                      onChange={(e) => {
                        setTextoReceita(e.target.value);
                        setShowDropdown(true);
                        setReceitaSelecionada(null);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      autoComplete="off"
                    />

                    {showDropdown && (
                      <ul
                        className="list-group position-absolute shadow"
                        style={{
                          zIndex: 50,
                          width: "95%",
                          maxHeight: "250px",
                          overflowY: "auto",
                          cursor: "pointer",
                        }}
                      >
                        {receitas
                          .filter((r) =>
                            r.nome.toLowerCase().includes(textoReceita.toLowerCase())
                          )
                          .map((r) => (
                            <li
                              key={r.id}
                              className="list-group-item list-group-item-action"
                              onMouseDown={() => {
                                setReceitaSelecionada(r.id);
                                setTextoReceita(r.nome);
                                setShowDropdown(false);
                              }}
                            >
                              {r.nome}
                            </li>
                          ))}

                        {receitas.filter((r) =>
                          r.nome.toLowerCase().includes(textoReceita.toLowerCase())
                        ).length === 0 && (
                            <li className="list-group-item text-muted text-center">
                              Nenhuma receita encontrada
                            </li>
                          )}
                      </ul>
                    )}

                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Quantidade</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantidade}
                    min="1"
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  />
                </div>

                <button
                  className="btn btn-warning w-100"
                  onClick={handlePreviewReceita}
                >
                  👀 Gerar Preview
                </button>
              </div>
            </div>
          )}

          {modo === "ficheiro" && (
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-light">
                <h5 className="mb-0 fw-bold text-secondary">
                  📄 Importar Talão TXT
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                  Carrega o ficheiro TXT exportado da caixa. O sistema vai:
                  <br />• Ler produtos e receitas do talão
                  <br />• Procurar vendas na BD pela mesma data
                  <br />• Gerar um preview completo dos abates
                </p>
                <label className="form-label">Ficheiro TXT</label>
                <input
                  type="file"
                  accept=".txt"
                  className="form-control"
                  onChange={handleFileUpload}
                />

                {dataTalao && (
                  <div className="alert alert-info mt-3 mb-0 py-2">
                    <strong>Data do Talão:</strong> {dataTalao}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: PREVIEW / RESULTADOS */}
        <div className="col-lg-8 mb-4">
          {/* PREVIEW */}
          {pendentes.length > 0 && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-secondary">
                  📋 Abates pendentes (Preview)
                </h5>
                {dataTalao && (
                  <span className="badge text-bg-secondary">
                    📅 Talão: {dataTalao}
                  </span>
                )}
              </div>
              <div className="card-body">
                <div className="row">
                  <div className={modo === "manual" ? "col-12 mb-3" : "col-md-6 mb-3"}>

                    <h6 className="text-primary fw-bold mb-2">
                      {modo === "manual" ? "🍽 Receita" : "📄 Talão & Receitas"}
                    </h6>


                    {/* Produtos diretos */}
                    {pendentes.some((p) => p.tipo === "produto") && (
                      <div className="mb-3">
                        <h6 className="fw-bold" style={{ fontSize: "0.9rem" }}>
                          📦 Produtos diretos
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Produto</th>
                                <th className="text-end">Antes</th>
                                <th className="text-end">Abate</th>
                                <th className="text-end">Depois</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendentes
                                .filter((p) => p.tipo === "produto")
                                .map((item, i) => (
                                  <tr key={`produto-${i}`}>
                                    <td>{item.produto}</td>
                                    <td className="text-end">{item.antes}</td>
                                    <td className="text-end text-danger fw-bold">
                                      -{item.abate}
                                    </td>
                                    <td className="text-end">{item.depois}</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Receitas */}
                    <div className="accordion" id="accordionPreview">
                      {pendentes
                        .filter((p) => p.tipo === "receita" && p.origem !== "bd")
                        .map((item, i) => (
                          <div className="accordion-item" key={`receita-${i}`}>
                            <h2 className="accordion-header" id={`heading${i}`}>
                              <button
                                className="accordion-button collapsed fw-bold text-primary"
                                style={{ backgroundColor: "#eef5ff", borderRadius: "8px" }}

                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#collapse${i}`}
                              >
                                🍽 Receita: {item.nome} ({item.qtd}x)
                              </button>
                            </h2>
                            <div
                              id={`collapse${i}`}
                              className="accordion-collapse collapse"
                              data-bs-parent="#accordionPreview"
                            >
                              <div className="accordion-body p-2">
                                <div className="table-responsive">
                                  <table className="table table-sm mb-0 align-middle">
                                    <thead>
                                      <tr>
                                        <th>Produto</th>
                                        <th className="text-end">Antes</th>
                                        <th className="text-end">Abate</th>
                                        <th className="text-end">Depois</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.produtos.map((p, j) => (
                                        <tr key={j}>
                                          <td>{p.produto}</td>
                                          <td className="text-end">
                                            {p.antes}
                                          </td>
                                          <td className="text-end text-danger">
                                            -{p.abate}
                                          </td>
                                          <td className="text-end">
                                            {p.depois}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* --- Coluna 2: Vendas BD (SÓ NO MODO TXT) --- */}
                  {modo === "ficheiro" && (
                    <div className="col-md-6 mb-3">
                      <h6 className="text-success fw-bold mb-2">
                        🛒 Vendas na BD
                      </h6>

                      {pendentes.some((p) => p.origem === "bd") ? (

                        <div className="accordion" id="accordionBD">

                          {/* RECEITAS DA BD */}
                          {pendentes.filter(p => p.tipo === "receita" && p.origem === "bd")
                            .map((item, i) => (
                              <div className="accordion-item" key={`bd-rec-${i}`}>
                                <h2 className="accordion-header">
                                  <button
                                    className="accordion-button collapsed fw-bold text-success"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#bd-collapse-${i}`}
                                  >
                                    🍽 Receita: {item.nome} (BD – {item.qtd}x)
                                  </button>
                                </h2>

                                <div id={`bd-collapse-${i}`} className="accordion-collapse collapse">
                                  <div className="accordion-body p-2">
                                    <table className="table table-sm mb-0 align-middle">
                                      <thead>
                                        <tr>
                                          <th>Produto</th>
                                          <th className="text-end">Antes</th>
                                          <th className="text-end">Abate</th>
                                          <th className="text-end">Depois</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.produtos.map((p, j) => (
                                          <tr key={j}>
                                            <td>{p.produto}</td>
                                            <td className="text-end">{p.antes}</td>
                                            <td className="text-end text-danger">-{p.abate}</td>
                                            <td className="text-end">{p.depois}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            ))}

                          {/* PRODUTOS SIMPLES DA BD */}
                          {pendentes.filter(p => p.tipo === "venda" && p.origem === "bd")
                            .map((item, i) => (
                              <table key={`bd-prod-${i}`} className="table table-sm table-bordered">
                                <tbody>
                                  <tr>
                                    <td>{item.produto}</td>
                                    <td className="text-end">{item.antes}</td>
                                    <td className="text-end text-danger fw-bold">-{item.abate}</td>
                                    <td className="text-end">{item.depois}</td>
                                  </tr>
                                </tbody>
                              </table>
                            ))}

                        </div>

                      ) : (
                        <p className="text-muted mb-0">
                          Nenhuma venda encontrada na BD para esta data.
                        </p>
                      )}

                    </div>
                  )}

                </div>

                <div className="d-flex flex-wrap gap-2 mt-3 justify-content-end">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setPendentes([]);
                      setResultado(null);
                      setDataTalao(null);
                    }}
                    type="button"
                  >
                    ❌ Limpar Preview
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleConfirmar}
                  >
                    ✅ Confirmar Abate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESULTADO FINAL (opcional – mesma lógica, só visual) */}
          {resultado && Array.isArray(resultado) && resultado.length > 0 && (
            <div className="card shadow-sm border-0">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0 fw-bold">✅ Abates aplicados</h6>
              </div>
              <div className="card-body">
                <p className="mb-2 text-muted">
                  Os seguintes abates foram gravados no histórico e o stock foi
                  atualizado.
                </p>
                <ul className="mb-0">
                  {resultado.map((item, idx) => (
                    <li key={idx} style={{ fontSize: "0.9rem" }}>
                      {item.tipo === "receita"
                        ? `Receita "${item.nome}" (${item.qtd}x)`
                        : `${item.tipo === "venda" ? "Venda" : "Produto"} - ${item.produto
                        }`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
