import React, { useState, useEffect, useRef } from "react";
import { getProdutos } from "../services/produtosService";
import { getReceitas } from "../services/receitasService";

export default function CalculadoraOnlinePage() {
  const apiUrl = localStorage.getItem("apiUrl");

  const [produtos, setProdutos] = useState([]);
  const [receitas, setReceitas] = useState([]);

  const [fcPretendido, setFcPretendido] = useState(0.29);
  const [ivaPlataforma, setIvaPlataforma] = useState(0.23);

  const [artigo, setArtigo] = useState("");
  const [plataforma, setPlataforma] = useState("uber");
  const [percPlataforma, setPercPlataforma] = useState(0.3);
  const [custoPrato, setCustoPrato] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");

  // Pesquisa inteligente
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHL, setSearchHL] = useState(-1);
  const searchRef = useRef(null);

  const fix = (n, d = 2) => Number(n ?? 0).toFixed(d);

  // Load inicial
  useEffect(() => {
    if (!apiUrl) return;

    (async () => {
      const prods = await getProdutos(apiUrl);
      const recs = await getReceitas(apiUrl);

      setProdutos(prods || []);
      setReceitas(recs || []);
    })();
  }, [apiUrl]);

  useEffect(() => {
    const click = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  const filtrarProdutos = (texto) => {
    const t = (texto || "").trim().toLowerCase();
    if (!t) return [];
    return produtos
      .filter((p) => p.descricao.toLowerCase().includes(t))
      .slice(0, 40);
  };

  function escolherArtigo(produto) {
    setArtigo(produto.descricao);
    setPrecoVenda(produto.precovenda || "");
    setSearch(produto.descricao);
    setSearchOpen(false);
    setSearchHL(-1);

    const receita = receitas.find((r) => r.id === Number(produto.codigo));
    if (receita) {
      const total = receita.ingredientes.reduce(
        (acc, ing) => acc + Number(ing.subtotal || 0),
        0
      );
      setCustoPrato(total.toFixed(2));
    } else {
      setCustoPrato("");
    }
  }

  // ================= Cálculos =======================
  const p = Number(percPlataforma) || 0;
  const c = Number(custoPrato) || 0;
  const pv = Number(precoVenda) || 0;
  const iva = Number(ivaPlataforma) || 0;
  const fcTarget = Number(fcPretendido) || 0;

  let comissao = pv * p;
  let ivaComissao = comissao * iva;
  let despesasOnline = comissao + ivaComissao;
  let valorReceber = pv - despesasOnline;
  let fcReal = valorReceber > 0 ? c / valorReceber : 0;

  const denom = 1 - p * (1 + iva);
  const precoRecomendado =
    c > 0 && denom > 0 ? c / (fcTarget * denom) : 0;

  return (
    <div className="container mt-4">

      {/* ====================== HEADER ======================= */}
      <div className="py-3 mb-4 border-bottom">
        <h2 className="text-primary fw-bold d-flex align-items-center gap-2">
          🧮 Calculadora de Preços Online
        </h2>
        <p className="text-muted mb-0">
          Simule preços e custos para plataformas como Uber, Glovo, Bolt.
        </p>
      </div>

      {/* ====================== 1. GLOBAL ======================= */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary bg-opacity-10">
          <h5 className="mb-0 text-primary fw-bold">⚙️ Definições Globais</h5>
        </div>

        <div className="card-body p-4">
          <div className="row g-4">

            <div className="col-md-4">
              <label className="form-label fw-bold">Food cost pretendido</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min="0"
                max="1"
                value={fcPretendido}
                onChange={(e) => setFcPretendido(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">IVA da plataforma</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min="0"
                max="1"
                value={ivaPlataforma}
                onChange={(e) => setIvaPlataforma(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Plataforma</label>
              <input
                type="text"
                className="form-control"
                value={plataforma}
                onChange={(e) => setPlataforma(e.target.value)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ====================== 2. ARTIGO ======================= */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-bold text-secondary">🍽️ Cálculo por Artigo</h5>
        </div>

        <div className="card-body p-4">
          <div className="row g-4">

            {/* PESQUISA ARTIGO */}
            <div className="col-md-5 position-relative" ref={searchRef}>
              <label className="form-label fw-bold">Artigo</label>
              <input
                type="text"
                value={search}
                placeholder="Pesquisar artigo..."
                className="form-control"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                  setSearchHL(-1);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  const lista = filtrarProdutos(search);
                  if (!lista.length) return;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSearchHL((prev) => (prev + 1) % lista.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSearchHL((prev) => (prev - 1 + lista.length) % lista.length);
                  } else if (e.key === "Enter") {
                    if (searchHL >= 0) escolherArtigo(lista[searchHL]);
                  }
                }}
              />

              {searchOpen && filtrarProdutos(search).length > 0 && (
                <ul className="list-group position-absolute w-100 shadow"
                  style={{
                    top: "100%",
                    left: 0,
                    zIndex: 50,
                    maxHeight: "260px",
                    overflowY: "auto",
                  }}
                >
                  {filtrarProdutos(search).map((p, idx) => (
                    <li
                      key={p.codigo}
                      className={`list-group-item list-group-item-action ${
                        idx === searchHL ? "active" : ""
                      }`}
                      onMouseEnter={() => setSearchHL(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        escolherArtigo(p);
                      }}
                    >
                      <div className="d-flex justify-content-between">
                        <span>{p.descricao}</span>
                        <small className="text-muted">
                          {fix(p.precovenda)} €
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* % plataforma */}
            <div className="col-md-3">
              <label className="form-label fw-bold">% pela plataforma</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                min="0"
                max="1"
                value={percPlataforma}
                onChange={(e) => setPercPlataforma(e.target.value)}
              />
            </div>

            {/* custo prato */}
            <div className="col-md-2">
              <label className="form-label fw-bold">Custo prato</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                value={custoPrato}
                onChange={(e) => setCustoPrato(e.target.value)}
              />
            </div>

            {/* preco venda */}
            <div className="col-md-2">
              <label className="form-label fw-bold">Preço venda</label>
              <input
                type="number"
                className="form-control"
                step="0.01"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
              />
            </div>

          </div>

          {/* PREÇO RECOMENDADO */}
          <div className="row mt-4">
            <div className="col-md-4">
              <label className="form-label fw-bold">Preço recomendado</label>
              <input
                type="text"
                className="form-control bg-light fw-bold"
                readOnly
                value={fix(precoRecomendado)}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ====================== RESULTADOS ======================= */}
      {c > 0 && pv > 0 && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-success bg-opacity-10">
            <h5 className="mb-0 text-success fw-bold">📈 Resultados</h5>
          </div>

          <div className="card-body p-4">
            <table className="table table-striped table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Plataforma</th>
                  <th className="text-end">Comissão</th>
                  <th className="text-end">IVA Comissão</th>
                  <th className="text-end">Despesas</th>
                  <th className="text-end">Valor a receber</th>
                  <th className="text-end">Food cost</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{plataforma}</td>
                  <td className="text-end">{fix(comissao)} €</td>
                  <td className="text-end">{fix(ivaComissao)} €</td>
                  <td className="text-end">{fix(despesasOnline)} €</td>
                  <td className="text-end">{fix(valorReceber)} €</td>
                  <td
                    className={`text-end fw-bold ${
                      fcReal > fcTarget ? "text-danger" : "text-success"
                    }`}
                  >
                    {fix(fcReal * 100, 1)} %
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
