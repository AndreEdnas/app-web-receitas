import React, { useEffect, useState } from "react";
import { getReceitas } from "../services/receitasService";
import { getProdutos, updateProduto } from "../services/produtosService";
import { useNgrokUrl } from "../hooks/useNgrokUrl";

export default function ProduzirReceitaPage() {
  const apiUrl = useNgrokUrl("Mimos");
  const [receitas, setReceitas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [pendentes, setPendentes] = useState([]); // preview
  const [resultado, setResultado] = useState(null); // aplicados
  const [modo, setModo] = useState("manual"); // "manual" | "ficheiro"
  const [dataTalao, setDataTalao] = useState(null); // 📅 data extraída do TXT

  useEffect(() => {
    if (!apiUrl) return;
    (async () => {
      const receitasData = await getReceitas(apiUrl);
      const produtosData = await getProdutos(apiUrl);
      setReceitas(receitasData);
      setProdutos(produtosData);
    })();
  }, [apiUrl]);

  // 📂 Processa TXT (mistura produtos e receitas)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;

      // 👉 extrai apenas a data (sem hora)
      const matchData = text.match(/TALÃO - (\d{2}-\d{2}-\d{4})/);
      const dataExtraida = matchData ? matchData[1] : null;
      setDataTalao(dataExtraida);

      const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

      const produtosAtualizados = await getProdutos(apiUrl);
      let lista = [];

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

      setPendentes(lista);
      setResultado(null);
    };

    reader.readAsText(file);
  };

  // 📊 Preview manual (receita escolhida)
  const handlePreviewReceita = async () => {
    if (!receitaSelecionada || quantidade <= 0) return;

    const receita = receitas.find((r) => r.id === Number(receitaSelecionada));
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
  };

  // ✅ Confirmar abates
  const handleConfirmar = async () => {
    for (const item of pendentes) {
      if (item.tipo === "produto") {
        await updateProduto(apiUrl, item.codigo, { qtdstock: item.depois });
      } else if (item.tipo === "receita") {
        for (const p of item.produtos) {
          await updateProduto(apiUrl, p.codigo, { qtdstock: p.depois });
        }
      }
    }
    setResultado(pendentes);
    setPendentes([]);
    const atualizados = await getProdutos(apiUrl);
    setProdutos(atualizados);
  };

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary">⚙️ Produzir Receitas / Produtos</h2>

      {/* Seletor modo */}
      <div className="btn-group mb-4">
        <button
          className={`btn ${modo === "manual" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setModo("manual");
            setPendentes([]);
            setResultado(null);
            setDataTalao(null);
          }}
        >
          📝 Manual
        </button>
        <button
          className={`btn ${modo === "ficheiro" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setModo("ficheiro");
            setPendentes([]);
            setResultado(null);
            setDataTalao(null);
          }}
        >
          📄 Ficheiro TXT
        </button>
      </div>

      {/* --- MODO MANUAL --- */}
      {modo === "manual" && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Receita</label>
              <select
                className="form-select"
                value={receitaSelecionada || ""}
                onChange={(e) => {
                  setReceitaSelecionada(e.target.value);
                  setPendentes([]);
                  setResultado(null);
                }}
              >
                <option value="">-- Escolhe uma receita --</option>
                {receitas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
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

            <button className="btn btn-warning" onClick={handlePreviewReceita}>
              👀 Gerar Preview
            </button>
          </div>
        </div>
      )}

      {/* --- MODO FICHEIRO --- */}
      {modo === "ficheiro" && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <label className="form-label">Carregar talão TXT</label>
            <input type="file" accept=".txt" className="form-control" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {/* --- PREVIEW --- */}
      {pendentes.length > 0 && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h5>📋 Abates pendentes (preview):</h5>

            {/* Mostra data do talão se existir */}
            {dataTalao && (
              <p className="fw-bold text-secondary">
                📅 Data do Talão: {dataTalao}
              </p>
            )}

            {/* Tabela geral para produtos diretos */}
            {pendentes.some((p) => p.tipo === "produto") && (
              <table className="table table-sm table-bordered mb-4">
                <thead className="table-light">
                  <tr>
                    <th>Produto</th>
                    <th>Antes</th>
                    <th>Abate</th>
                    <th>Depois</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes
                    .filter((p) => p.tipo === "produto")
                    .map((item, i) => (
                      <tr key={`produto-${i}`}>
                        <td>📦 {item.produto}</td>
                        <td>{item.antes}</td>
                        <td className="text-danger fw-bold">-{item.abate}</td>
                        <td>{item.depois}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* Accordion para receitas */}
            <div className="accordion" id="accordionPreview">
              {pendentes
                .filter((p) => p.tipo === "receita")
                .map((item, i) => (
                  <div className="accordion-item" key={`receita-${i}`}>
                    <h2 className="accordion-header" id={`heading${i}`}>
                      <button
                        className="accordion-button collapsed fw-bold text-primary"
                        style={{ backgroundColor: "#e7f1ff" }}
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
                      <div className="accordion-body">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Antes</th>
                              <th>Abate</th>
                              <th>Depois</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.produtos.map((p, j) => (
                              <tr key={j}>
                                <td>{p.produto}</td>
                                <td>{p.antes}</td>
                                <td className="text-danger">-{p.abate}</td>
                                <td>{p.depois}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <button className="btn btn-danger mt-3" onClick={handleConfirmar}>
              ✅ Confirmar Abate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
