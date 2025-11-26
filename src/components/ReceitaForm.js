// ReceitaForm.js
import React, { useState, useEffect, useRef } from "react";
import { getProdutos } from "../services/produtosService";

export function ReceitaForm({
  apiUrl,
  onAdicionar,
  onAtualizar,
  receitaEditando,
  limparEdicao,
}) {
  const [nome, setNome] = useState("");
  const [ingredientes, setIngredientes] = useState([
    { id: null, produto: "", quantidade: "", unidade: "", preco: 0 },
  ]);
  const [produtos, setProdutos] = useState([]);

  const [msg, setMsg] = useState("");
  const [msgTipo, setMsgTipo] = useState("success");

  const [nomeOpen, setNomeOpen] = useState(false);
  const [nomeHl, setNomeHl] = useState(-1);
  const [produtoSelecionadoParaReceita, setProdutoSelecionadoParaReceita] =
    useState(null);
  const nomeDropdownRef = useRef(null);

  const [openIdx, setOpenIdx] = useState(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRefs = useRef({});

  // =======================
  // CARREGAR PRODUTOS
  // =======================
  useEffect(() => {
    if (!apiUrl) return;
    (async () => {
      try {
        const data = await getProdutos(apiUrl);
        setProdutos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erro a carregar produtos:", e);
        setProdutos([]);
      }
    })();
  }, [apiUrl]);

  // =======================
  // EDITAR RECEITA — preencher dados
  // =======================
  useEffect(() => {
    if (!receitaEditando || !produtos.length) return;

    setNome(receitaEditando.nome);

    const ingredientesAtualizados = (receitaEditando.ingredientes || []).map(
      (ing) => {
        const prod = produtos.find(
          (p) =>
            (p.descricao || "").toLowerCase() ===
            (ing.produto || "").toLowerCase()
        );

        const quantidade = parseFloat(ing.quantidade) || 0;
        const precoAtual = prod
          ? Number(prod.precocompra) || 0
          : Number(ing.preco) || 0;
        const unidadeAtual = prod?.unidade?.descricao || ing.unidade || "";

        return {
          ...ing,
          unidade: unidadeAtual,
          preco: precoAtual,
          subtotal: precoAtual * quantidade,
        };
      }
    );

    setIngredientes(ingredientesAtualizados);
  }, [receitaEditando, produtos]);

  // =======================
  // RESET DO FORMULÁRIO QUANDO CANCELAR
  // =======================
  useEffect(() => {
    if (!receitaEditando) {
      setNome("");
      setProdutoSelecionadoParaReceita(null);
      setIngredientes([
        { id: null, produto: "", quantidade: "", unidade: "", preco: 0 },
      ]);
    }
  }, [receitaEditando]);

  // =======================
  // Dropdown do NOME
  // =======================
  useEffect(() => {
    if (!nome || !produtos.length) return;
    const prod = produtos.find(
      (p) => (p.descricao || "").toLowerCase() === nome.toLowerCase()
    );
    setProdutoSelecionadoParaReceita(prod || null);
  }, [nome, produtos]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function onClickOutside(e) {
      if (
        nomeOpen &&
        nomeDropdownRef.current &&
        !nomeDropdownRef.current.contains(e.target)
      ) {
        setNomeOpen(false);
        setNomeHl(-1);
      }
      if (
        openIdx !== null &&
        dropdownRefs.current[openIdx] &&
        !dropdownRefs.current[openIdx].contains(e.target)
      ) {
        setOpenIdx(null);
        setHighlightIdx(-1);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [nomeOpen, openIdx]);

  // Filtrar produtos pelo texto
  const filtrar = (texto) => {
    const t = (texto || "").trim().toLowerCase();
    if (t.length < 2) return [];
    return produtos
      .filter((p) => (p.descricao || "").toLowerCase().includes(t))
      .slice(0, 50);
  };

  const sugestoesNome = filtrar(nome);

  const escolherNomeProduto = (produto) => {
    setNome(produto.descricao);
    setProdutoSelecionadoParaReceita(produto);
    setNomeOpen(false);
    setNomeHl(-1);
  };

  const onKeyDownNome = (e) => {
    const items = sugestoesNome;
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setNomeHl((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setNomeHl((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      if (nomeHl >= 0 && nomeHl < items.length) {
        e.preventDefault();
        escolherNomeProduto(items[nomeHl]);
      }
    } else if (e.key === "Escape") {
      setNomeOpen(false);
      setNomeHl(-1);
    }
  };

  // =======================
  // INGREDIENTES
  // =======================
  const removerIngrediente = (index) => {
    const novos = ingredientes.filter((_, i) => i !== index);
    setIngredientes(
      novos.length
        ? novos
        : [{ id: null, produto: "", quantidade: "", unidade: "", preco: 0 }]
    );
  };

  const handleIngredienteChange = (index, field, value) => {
    const novos = [...ingredientes];
    novos[index][field] = value;

    if (field === "produto") {
      const lower = value.toLowerCase();
      const produtoSelecionado =
        produtos.find(
          (p) => (p.descricao || "").toLowerCase() === lower
        ) || null;

      novos[index].unidade = produtoSelecionado?.unidade?.descricao || "";
      const preco = produtoSelecionado?.precocompra;
      novos[index].preco =
        preco !== undefined && preco !== null ? Number(preco) : 0;
    }

    setIngredientes(novos);
  };

  const escolherProdutoIngrediente = (rowIdx, produtoObj) => {
    const novos = [...ingredientes];
    novos[rowIdx] = {
      ...novos[rowIdx],
      id: produtoObj.codigo,
      produto: produtoObj.descricao,
      unidade: produtoObj?.unidade?.descricao || "",
      preco:
        produtoObj?.precocompra !== undefined &&
          produtoObj?.precocompra !== null
          ? Number(produtoObj.precocompra)
          : 0,
    };
    setIngredientes(novos);
    setOpenIdx(null);
    setHighlightIdx(-1);
  };

  const calcularTotal = () => {
    return ingredientes.reduce((total, ing) => {
      const preco = Number(ing.preco) || 0;
      const quantidade = parseFloat(ing.quantidade) || 0;
      return total + preco * quantidade;
    }, 0);
  };

  const mostrarMsg = (texto, tipo = "success") => {
    setMsg(texto);
    setMsgTipo(tipo);
    setTimeout(() => setMsg(""), 4000);
  };

  // =======================
  // VALIDAR FORMULÁRIO
  // =======================
  const validar = () => {
    const prodReceita =
      produtoSelecionadoParaReceita ||
      produtos.find(
        (p) =>
          (p.descricao || "").toLowerCase() === (nome || "").toLowerCase()
      );

    if (!nome.trim()) {
      mostrarMsg("Preencha o Nome da Receita.", "warning");
      return null;
    }
    if (!prodReceita) {
      mostrarMsg(
        "Selecione um produto válido para o Nome da Receita (use a lista).",
        "warning"
      );
      return null;
    }

    if (!ingredientes.length) {
      mostrarMsg("Adicione pelo menos um ingrediente.", "warning");
      return null;
    }

    for (let i = 0; i < ingredientes.length; i++) {
      const ing = ingredientes[i];
      if (!ing.produto || !ing.produto.trim()) {
        mostrarMsg(
          `Preencha o produto do ingrediente #${i + 1}.`,
          "warning"
        );
        return null;
      }
      const prod = produtos.find(
        (p) =>
          (p.descricao || "").toLowerCase() ===
          (ing.produto || "").toLowerCase()
      );
      if (!prod) {
        mostrarMsg(
          `Selecione um produto válido no ingrediente #${i + 1}.`,
          "warning"
        );
        return null;
      }
      const qtd = parseFloat(ing.quantidade);
      if (!(qtd > 0)) {
        mostrarMsg(
          `Quantidade inválida no ingrediente #${i + 1}.`,
          "warning"
        );
        return null;
      }
      const un = ing.unidade || prod?.unidade?.descricao || "";
      const pr = Number(ing.preco ?? prod?.precocompra ?? 0);
      if (!un) {
        mostrarMsg(
          `Unidade em falta no ingrediente #${i + 1}.`,
          "warning"
        );
        return null;
      }
      if (!(pr > 0)) {
        mostrarMsg(
          `Preço inválido no ingrediente #${i + 1}.`,
          "warning"
        );
        return null;
      }
    }

    return prodReceita;
  };

  // =======================
  // SUBMETER FORM
  // =======================
  const handleSubmit = (e) => {
    e.preventDefault();

    const prodReceita = validar();
    if (!prodReceita) return;

    // ===============================
    // BLOQUEAR RECEITAS DUPLICADAS
    // ===============================

    const todasReceitas = JSON.parse(localStorage.getItem("todasReceitas") || "[]");

    // Normalizar nome
    const nomeLower = nome.trim().toLowerCase();

    // 1️⃣ Verificar nome duplicado (exceto quando estamos a editar a mesma)
    const nomeDuplicado = todasReceitas.some(
      (r) =>
        r.id !== (receitaEditando?.id || null) &&
        (r.nome || "").trim().toLowerCase() === nomeLower
    );

    if (nomeDuplicado) {
      mostrarMsg("❌ Já existe uma receita com este nome!", "danger");
      return;
    }

    // 2️⃣ Verificar ID (produto principal da receita) duplicado
    const idDuplicado = todasReceitas.some(
      (r) =>
        r.id !== (receitaEditando?.id || null) &&
        r.id === prodReceita.codigo
    );

    if (idDuplicado) {
      mostrarMsg("❌ Já existe uma receita associada a este produto!", "danger");
      return;
    }


    const ingredientesComUnidade = ingredientes.map((ing) => {
      const prod = produtos.find(
        (p) =>
          (p.descricao || "").toLowerCase() ===
          (ing.produto || "").toLowerCase()
      );

      const quantidade = parseFloat(ing.quantidade) || 0;
      const precoAtual = prod
        ? Number(prod.precocompra) || 0
        : Number(ing.preco) || 0;
      const unidadeAtual = prod?.unidade?.descricao || ing.unidade || "";

      return {
        id: prod?.codigo || ing.id,
        produto: ing.produto,
        quantidade,
        unidade: unidadeAtual,
        preco: precoAtual,
        subtotal: precoAtual * quantidade,
      };
    });

    const receitaFinal = {
      id: prodReceita.codigo,
      nome: prodReceita.descricao,
      ingredientes: ingredientesComUnidade,
      total: ingredientesComUnidade.reduce((acc, i) => acc + i.subtotal, 0),
    };

    if (receitaEditando) {
      if (receitaEditando.id !== receitaFinal.id) {
        onAtualizar({ ...receitaFinal, substituir: receitaEditando.id });
        mostrarMsg("Receita substituída com sucesso!", "success");
      } else {
        onAtualizar(receitaFinal);
        mostrarMsg("Receita atualizada com sucesso!", "success");
      }
      limparEdicao();
    } else {
      onAdicionar(receitaFinal);
      mostrarMsg("Receita adicionada com sucesso!", "success");
    }

    // Reset final
    setNome("");
    setProdutoSelecionadoParaReceita(null);
    setIngredientes([
      { id: null, produto: "", quantidade: "", unidade: "", preco: 0 },
    ]);
  };

  // =======================
  // RENDER
  // =======================
  return (
    <form onSubmit={handleSubmit}>
      {/* ALERTA */}
      {msg && (
        <div className={`alert alert-${msgTipo} mb-3`} role="alert">
          {msg}
        </div>
      )}

      {/* NOME DA RECEITA */}
      <div
        className="mb-3"
        ref={nomeDropdownRef}
        style={{ position: "relative" }}
      >
        <label className="form-label fw-bold">Nome da Receita</label>
        <input
          type="text"
          placeholder="Nome da Receita (selecione um produto)"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setProdutoSelecionadoParaReceita(null);
            setNomeOpen(true);
            setNomeHl(-1);
          }}
          onFocus={() => setNomeOpen(true)}
          onKeyDown={onKeyDownNome}
          className="form-control form-control-sm"
          autoComplete="off"
        />

        {produtoSelecionadoParaReceita && (
          <small className="text-muted">
            Produto ligado: {produtoSelecionadoParaReceita.descricao} • Cód:{" "}
            {produtoSelecionadoParaReceita.codigo}
          </small>
        )}

        {nomeOpen && sugestoesNome.length > 0 && (
          <ul
            className="list-group position-absolute w-100"
            style={{
              zIndex: 1000,
              maxHeight: "220px",
              overflowY: "auto",
              top: "100%",
              left: 0,
            }}
          >
            {sugestoesNome.map((p, idx) => (
              <li
                key={p.codigo ?? p.codbarras ?? `${p.descricao}-${idx}`}
                className={`list-group-item list-group-item-action ${idx === nomeHl ? "active" : ""
                  }`}
                onMouseEnter={() => setNomeHl(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolherNomeProduto(p);
                }}
                style={{ cursor: "pointer" }}
                title={p.descricao}
              >
                <div className="d-flex justify-content-between">
                  <span>{p.descricao}</span>
                  <small>
                    {p.unidade?.descricao ? `(${p.unidade.descricao})` : ""}{" "}
                    {p.precocompra
                      ? `• ${Number(p.precocompra).toFixed(2)} €`
                      : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* INGREDIENTES */}
      <label className="form-label fw-bold">Ingredientes</label>
      {ingredientes.map((ing, i) => {
        const sugestoes = filtrar(ing.produto);
        return (
          <div
            key={i}
            className="mb-2"
            ref={(el) => (dropdownRefs.current[i] = el)}
            style={{ position: "relative" }}
          >
            <div className="d-flex gap-2 align-items-center">
              {/* Produto */}
              <div style={{ flex: 2 }}>
                <input
                  type="text"
                  placeholder="Produto"
                  value={ing.produto}
                  onChange={(e) => {
                    handleIngredienteChange(i, "produto", e.target.value);
                    setOpenIdx(i);
                    setHighlightIdx(-1);
                  }}
                  onFocus={() => setOpenIdx(i)}
                  onKeyDown={(e) => {
                    const items = sugestoes;
                    if (!items.length) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightIdx((prev) => (prev + 1) % items.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightIdx(
                        (prev) => (prev - 1 + items.length) % items.length
                      );
                    } else if (e.key === "Enter") {
                      if (
                        highlightIdx >= 0 &&
                        highlightIdx < items.length
                      ) {
                        e.preventDefault();
                        escolherProdutoIngrediente(i, items[highlightIdx]);
                      }
                    } else if (e.key === "Escape") {
                      setOpenIdx(null);
                      setHighlightIdx(-1);
                    }
                  }}
                  className="form-control form-control-sm"
                  autoComplete="off"
                />

                {/* Dropdown de produtos */}
                {openIdx === i && sugestoes.length > 0 && (
                  <ul
                    className="list-group position-absolute w-100"
                    style={{
                      zIndex: 1000,
                      maxHeight: "220px",
                      overflowY: "auto",
                      top: "100%",
                      left: 0,
                    }}
                  >
                    {sugestoes.map((p, idx) => (
                      <li
                        key={p.codigo ?? p.codbarras ?? `${p.descricao}-${idx}`}
                        className={`list-group-item list-group-item-action ${idx === highlightIdx ? "active" : ""
                          }`}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          escolherProdutoIngrediente(i, p);
                        }}
                        style={{ cursor: "pointer" }}
                        title={p.descricao}
                      >
                        <div className="d-flex justify-content-between">
                          <span>{p.descricao}</span>
                          <small>
                            {p.unidade?.descricao
                              ? `(${p.unidade.descricao})`
                              : ""}{" "}
                            {p.precocompra
                              ? `• ${Number(p.precocompra).toFixed(2)} €`
                              : ""}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Quantidade */}
              <input
                type="number"
                placeholder="Qtd"
                value={ing.quantidade}
                onChange={(e) =>
                  handleIngredienteChange(i, "quantidade", e.target.value)
                }
                className="form-control form-control-sm"
                style={{ maxWidth: "90px" }}
                min="0"
                step="any"
                required
              />

              {/* Unidade */}
              <span style={{ minWidth: 60, fontSize: "0.85rem" }}>
                {ing.unidade}
              </span>

              {/* Preço */}
              <span style={{ minWidth: 90, fontSize: "0.85rem" }}>
                {ing.preco ? `${Number(ing.preco).toFixed(2)} €` : ""}
              </span>

              {/* Remover */}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => removerIngrediente(i)}
              >
                ❌
              </button>
            </div>
          </div>
        );
      })}

      <div className="mt-3">
        <strong>Valor Total da Receita: </strong>{" "}
        {calcularTotal().toFixed(2)} €
      </div>

      {/* BOTÕES */}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() =>
            setIngredientes([
              ...ingredientes,
              {
                id: null,
                produto: "",
                quantidade: "",
                unidade: "",
                preco: 0,
              },
            ])
          }
        >
          ➕ Ingrediente
        </button>

        <button type="submit" className="btn btn-success btn-sm">
          {receitaEditando ? "💾 Atualizar" : "💾 Guardar"}
        </button>

        {receitaEditando && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={limparEdicao}
          >
            ❌ Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
