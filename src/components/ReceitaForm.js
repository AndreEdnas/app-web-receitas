import React, { useState, useEffect, useRef } from "react";
import { getProdutos } from "../services/produtosService";

export function ReceitaForm({ apiUrl, onAdicionar, onAtualizar, receitaEditando, limparEdicao }) {
  const [nome, setNome] = useState("");
  const [ingredientes, setIngredientes] = useState([{ produto: "", quantidade: "", unidade: "", preco: 0 }]);
  const [produtos, setProdutos] = useState([]);

  // mensagens
  const [msg, setMsg] = useState("");
  const [msgTipo, setMsgTipo] = useState("success"); // success | warning | danger

  // --- autocomplete Nome da Receita ---
  const [nomeOpen, setNomeOpen] = useState(false);
  const [nomeHl, setNomeHl] = useState(-1);
  const [produtoSelecionadoParaReceita, setProdutoSelecionadoParaReceita] = useState(null);
  const nomeDropdownRef = useRef(null);

  // --- autocomplete Ingredientes ---
  const [openIdx, setOpenIdx] = useState(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRefs = useRef({});

  // carregar produtos da BD
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

  // atualizar o form quando entrar em edição (já com preços da BD)
  // atualizar o form quando entrar em edição (já com preços atuais da BD)
  useEffect(() => {
    if (!receitaEditando) return;
    if (!produtos.length) return; // espera até produtos estarem carregados

    setNome(receitaEditando.nome);

    const ingredientesAtualizados = (receitaEditando.ingredientes || []).map((ing) => {
      const prod = produtos.find(
        (p) => (p.descricao || "").toLowerCase() === (ing.produto || "").toLowerCase()
      );

      const quantidade = parseFloat(ing.quantidade) || 0;
      const precoAtual = prod ? Number(prod.precocompra) || 0 : Number(ing.preco) || 0;
      const unidadeAtual = prod?.unidade?.descricao || ing.unidade || "";

      return {
        ...ing,
        unidade: unidadeAtual,
        preco: precoAtual,
        subtotal: precoAtual * quantidade,
      };
    });

    setIngredientes(ingredientesAtualizados);
  }, [receitaEditando, produtos]);



  useEffect(() => {
    if (!nome || !produtos.length) return;
    const prod = produtos.find(p => (p.descricao || "").toLowerCase() === nome.toLowerCase());
    setProdutoSelecionadoParaReceita(prod || null);
  }, [nome, produtos]);

  // fechar dropdowns ao clicar fora
  useEffect(() => {
    function onClickOutside(e) {
      if (nomeOpen && nomeDropdownRef.current && !nomeDropdownRef.current.contains(e.target)) {
        setNomeOpen(false); setNomeHl(-1);
      }
      if (openIdx !== null && dropdownRefs.current[openIdx] && !dropdownRefs.current[openIdx].contains(e.target)) {
        setOpenIdx(null); setHighlightIdx(-1);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [nomeOpen, openIdx]);

  const filtrar = (texto) => {
    const t = (texto || "").trim().toLowerCase();
    if (t.length < 2) return [];
    return produtos.filter(p => (p.descricao || "").toLowerCase().includes(t)).slice(0, 50);
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
    if (e.key === "ArrowDown") { e.preventDefault(); setNomeHl((prev) => (prev + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setNomeHl((prev) => (prev - 1 + items.length) % items.length); }
    else if (e.key === "Enter") {
      if (nomeHl >= 0 && nomeHl < items.length) { e.preventDefault(); escolherNomeProduto(items[nomeHl]); }
    } else if (e.key === "Escape") { setNomeOpen(false); setNomeHl(-1); }
  };

  const removerIngrediente = (index) => {
    const novos = ingredientes.filter((_, i) => i !== index);
    setIngredientes(novos);
  };

  const handleIngredienteChange = (index, field, value) => {
    const novos = [...ingredientes];
    novos[index][field] = value;

    if (field === "produto") {
      const lower = value.toLowerCase();
      const produtoSelecionado = produtos.find(p => (p.descricao || "").toLowerCase() === lower) || null;
      novos[index].unidade = produtoSelecionado?.unidade?.descricao || "";
      const preco = produtoSelecionado?.precocompra;
      novos[index].preco = preco !== undefined && preco !== null ? Number(preco) : 0;
    }

    setIngredientes(novos);
  };

  const escolherProdutoIngrediente = (rowIdx, produtoObj) => {
  const novos = [...ingredientes];
  novos[rowIdx] = {
    ...novos[rowIdx],
    id: produtoObj.codigo, // 👈 guarda o código do produto da BD
    produto: produtoObj.descricao,
    unidade: produtoObj?.unidade?.descricao || "",
    preco: produtoObj?.precocompra !== undefined && produtoObj?.precocompra !== null
      ? Number(produtoObj.precocompra)
      : 0
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

  const validar = () => {
    // nome obrigatório e tem de ser produto válido (para obter codigo)
    const prodReceita = produtoSelecionadoParaReceita
      || produtos.find(p => (p.descricao || "").toLowerCase() === (nome || "").toLowerCase());
    if (!nome.trim()) { mostrarMsg("Preencha o Nome da Receita.", "warning"); return null; }
    if (!prodReceita) { mostrarMsg("Selecione um produto válido para o Nome da Receita (use a lista).", "warning"); return null; }

    if (!ingredientes.length) { mostrarMsg("Adicione pelo menos um ingrediente.", "warning"); return null; }

    // cada ingrediente: produto, quantidade > 0, unidade e preço (unidade/preço são auto, mas validamos)
    for (let i = 0; i < ingredientes.length; i++) {
      const ing = ingredientes[i];
      if (!ing.produto || !ing.produto.trim()) {
        mostrarMsg(`Preencha o produto do ingrediente #${i + 1}.`, "warning"); return null;
      }
      const prod = produtos.find(p => (p.descricao || "").toLowerCase() === (ing.produto || "").toLowerCase());
      if (!prod) { mostrarMsg(`Selecione um produto válido no ingrediente #${i + 1}.`, "warning"); return null; }
      const qtd = parseFloat(ing.quantidade);
      if (!(qtd > 0)) { mostrarMsg(`Quantidade inválida no ingrediente #${i + 1}.`, "warning"); return null; }
      const un = ing.unidade || prod?.unidade?.descricao || "";
      const pr = Number(ing.preco ?? prod?.precocompra ?? 0);
      if (!un) { mostrarMsg(`Unidade em falta no ingrediente #${i + 1}.`, "warning"); return null; }
      if (!(pr > 0)) { mostrarMsg(`Preço inválido no ingrediente #${i + 1}.`, "warning"); return null; }
    }

    return prodReceita; // válido
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const prodReceita = validar();
    if (!prodReceita) return;

    const ingredientesComUnidade = ingredientes.map((ing) => {
  const prod = produtos.find(
    (p) => (p.descricao || "").toLowerCase() === (ing.produto || "").toLowerCase()
  );

  const quantidade = parseFloat(ing.quantidade) || 0;
  const precoAtual = prod ? Number(prod.precocompra) || 0 : Number(ing.preco) || 0;
  const unidadeAtual = prod?.unidade?.descricao || ing.unidade || "";

  return {
    id: prod?.codigo || ing.id, // 👈 garante que o id vem do produto
    produto: ing.produto,
    quantidade,
    unidade: unidadeAtual,
    preco: precoAtual,
    subtotal: precoAtual * quantidade,
  };
});



    const receitaFinal = {
      id: prodReceita.codigo,           // id = codigo do produto
      nome: prodReceita.descricao,      // nome alinhado com a descrição
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

    // reset
    setNome("");
    setProdutoSelecionadoParaReceita(null);
    setIngredientes([{ id: null, produto: "", quantidade: "", unidade: "", preco: 0 }]);

  };

  return (
    <form onSubmit={handleSubmit} className="p-4 mb-4 bg-light rounded shadow">
      {/* ALERTA por cima do título */}
      {msg && (
        <div className={`alert alert-${msgTipo} mb-3`} role="alert">
          {msg}
        </div>
      )}

      <h2 className="text-center text-primary mb-4">
        {receitaEditando ? "✏️ Editar Receita" : "➕ Adicionar Nova Receita"}
      </h2>

      {/* NOME DA RECEITA (autocomplete) */}
      <div className="mb-3" ref={nomeDropdownRef} style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Nome da Receita (selecione um produto)"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setProdutoSelecionadoParaReceita(null); setNomeOpen(true); setNomeHl(-1); }}
          onFocus={() => setNomeOpen(true)}
          onKeyDown={onKeyDownNome}
          className="form-control form-control-lg"
          autoComplete="off"
        />
        {nomeOpen && sugestoesNome.length > 0 && (
          <ul className="list-group position-absolute w-100"
            style={{ zIndex: 1000, maxHeight: "220px", overflowY: "auto", top: "100%", left: 0 }}>
            {sugestoesNome.map((p, idx) => (
              <li
                key={p.codigo ?? p.codbarras ?? `${p.descricao}-${idx}`}
                className={`list-group-item list-group-item-action ${idx === nomeHl ? "active" : ""}`}
                onMouseEnter={() => setNomeHl(idx)}
                onMouseDown={(e) => { e.preventDefault(); escolherNomeProduto(p); }}
                style={{ cursor: "pointer" }}
                title={p.descricao}
              >
                <div className="d-flex justify-content-between">
                  <span>{p.descricao}</span>
                  <small>
                    {p.unidade?.descricao ? `(${p.unidade.descricao})` : ""} {p.precocompra ? `• ${Number(p.precocompra).toFixed(2)} €` : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* INGREDIENTES (autocomplete por linha) */}
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
                      setHighlightIdx((prev) => (prev - 1 + items.length) % items.length);
                    } else if (e.key === "Enter") {
                      if (highlightIdx >= 0 && highlightIdx < items.length) {
                        e.preventDefault();
                        escolherProdutoIngrediente(i, items[highlightIdx]);
                      }
                    } else if (e.key === "Escape") {
                      setOpenIdx(null);
                      setHighlightIdx(-1);
                    }
                  }}
                  className="form-control"
                  autoComplete="off"
                />
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

              <input
                type="number"
                placeholder="Qtd"
                value={ing.quantidade}
                onChange={(e) =>
                  handleIngredienteChange(i, "quantidade", e.target.value)
                }
                className="form-control"
                style={{ maxWidth: "100px" }}
                min="0"
                step="any"
                required
              />
              <span style={{ minWidth: 60 }}>{ing.unidade}</span>
              <span style={{ minWidth: 90 }}>
                {ing.preco ? `${Number(ing.preco).toFixed(2)} €` : ""}
              </span>

              {/* Botão de apagar ingrediente */}
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
        <strong>Valor Total da Receita: </strong> {calcularTotal().toFixed(2)} €
      </div>

      <div className="d-flex gap-2 mt-3">
        <button type="button" className="btn btn-primary" onClick={() => setIngredientes([...ingredientes, { produto: "", quantidade: "", unidade: "", preco: 0 }])}>
          ➕ Ingrediente
        </button>
        <button type="submit" className="btn btn-success">
          {receitaEditando ? "💾 Atualizar" : "💾 Guardar"}
        </button>
        {receitaEditando && (
          <button type="button" className="btn btn-secondary" onClick={limparEdicao}>
            ❌ Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
