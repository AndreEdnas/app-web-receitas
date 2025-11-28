// ReceitasPage.js
import React, { useEffect, useState, useRef } from "react";

import { ReceitaForm } from "../components/ReceitaForm";
import ReceitaList from "../components/ReceitaList";
import AlertaMensagem from "../components/AlertaMensagem";
import { getProdutos } from "../services/produtosService";

import {
  getReceitas,
  addReceita,
  deleteReceita,
  updateReceita,
} from "../services/receitasService";

export default function ReceitasPage() {
  const apiUrl = localStorage.getItem("apiUrl");
  const [receitas, setReceitas] = useState([]);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [alerta, setAlerta] = useState({ mensagem: "", tipo: "success" });

  const formRef = useRef(null);
  const [pesquisa, setPesquisa] = useState("");

  const handleAtualizarDireto = async (receitaOriginal) => {
    try {
      // Usar a receita já sincronizada (a versão "corrigida")
      const receitaCorrigida = receitas.find(r => r.id === receitaOriginal.id);

      const novaReceitaFinal = {
        id: receitaCorrigida.id,
        nome: receitaCorrigida.nomeNovo || receitaCorrigida.nome,
        ingredientes: (receitaCorrigida.ingredientesNovos || receitaCorrigida.ingredientes).map(i => ({
          id: i.id,
          produto: i.produto,
          quantidade: i.quantidade,
          unidade: i.unidade,
          preco: i.preco,
          subtotal: i.subtotal
        })),
        total: (receitaCorrigida.ingredientesNovos || receitaCorrigida.ingredientes)
          .reduce((acc, i) => acc + i.subtotal, 0)
      };

      await updateReceita(apiUrl, receitaCorrigida.id, novaReceitaFinal);


      // Recarregar receitas da API
      const data = await getReceitas(apiUrl);
      setReceitas(Array.isArray(data) ? data : []);

      mostrarAlerta("Receita atualizada com sucesso!", "success");

    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro ao atualizar receita", "danger");
    }
  };


  useEffect(() => {
    if (!apiUrl) return;

    async function fetchReceitas() {
      const receitasJson = await getReceitas(apiUrl);
      const produtos = await getProdutos(apiUrl);

      const receitasMarcadas = receitasJson.map((r) => {

        const prodReceita = produtos.find(p => p.codigo === r.id);
        const nomeNovo = prodReceita?.descricao || r.nome;

        let desatualizada = nomeNovo !== r.nome;

        const ingredientesAntigos = r.ingredientes || [];
        const difIngredientes = [];

        const ingredientesNovos = ingredientesAntigos.map((ing, idx) => {
          const prodIng = produtos.find(p => p.codigo === Number(ing.id));

          const produtoNovo = prodIng?.descricao || ing.produto;
          const precoNovo = prodIng?.precocompra ?? ing.preco;
          const unidadeNova = prodIng?.unidade?.descricao || ing.unidade;

          // diferenças reais
          if (produtoNovo !== ing.produto) {
            difIngredientes.push({
              index: idx,
              campo: "produto",
              antigo: ing.produto,
              novo: produtoNovo
            });
            desatualizada = true;
          }

          if (precoNovo !== ing.preco) {
            difIngredientes.push({
              index: idx,
              campo: "preco",
              antigo: ing.preco,
              novo: precoNovo
            });
            desatualizada = true;
          }

          if (unidadeNova !== ing.unidade) {
            difIngredientes.push({
              index: idx,
              campo: "unidade",
              antigo: ing.unidade,
              novo: unidadeNova
            });
            desatualizada = true;
          }

          return {
            ...ing,
            produto: produtoNovo,
            preco: precoNovo,
            unidade: unidadeNova,
            subtotal: precoNovo * ing.quantidade
          };
        });

        return {
          ...r,
          nomeNovo,
          ingredientesNovos,
          desatualizada,
          differences: {
            nome: nomeNovo !== r.nome ? { antigo: r.nome, novo: nomeNovo } : null,
            ingredientes: difIngredientes
          }
        };
      });




      setReceitas(receitasMarcadas);
    }

    fetchReceitas();
  }, [apiUrl]);


  const mostrarAlerta = (mensagem, tipo = "success") => {
    setAlerta({ mensagem, tipo });
    setTimeout(() => setAlerta({ mensagem: "", tipo: "success" }), 3000);
  };

  const handleAdicionar = async (novaReceita) => {
    await addReceita(apiUrl, novaReceita);
    const data = await getReceitas(apiUrl);
    setReceitas(Array.isArray(data) ? data : []);
    localStorage.setItem("todasReceitas", JSON.stringify(data));
    mostrarAlerta("Receita adicionada com sucesso!", "success");
  };

  const handleApagar = async (id) => {
    await deleteReceita(apiUrl, id);
    const data = await getReceitas(apiUrl);
    setReceitas(Array.isArray(data) ? data : []);
    localStorage.setItem("todasReceitas", JSON.stringify(data));
    mostrarAlerta("Receita apagada com sucesso!", "danger");
  };

  const handleEditar = (receita) => {
    const receitaAtualizada = {
      ...receita,
      nome: receita.nomeNovo || receita.nome,
      ingredientes: receita.ingredientesNovos || receita.ingredientes,
    };

    setReceitaEditando(receitaAtualizada);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };



  const handleAtualizar = async (receitaAtualizada) => {
    try {
      if (receitaAtualizada.substituir) {
        await deleteReceita(apiUrl, receitaAtualizada.substituir);
        await addReceita(apiUrl, {
          id: receitaAtualizada.id,
          nome: receitaAtualizada.nome,
          ingredientes: receitaAtualizada.ingredientes,
          total: receitaAtualizada.total,
        });

        const data = await getReceitas(apiUrl);
        setReceitas(Array.isArray(data) ? data : []);
        localStorage.setItem("todasReceitas", JSON.stringify(data));
        mostrarAlerta("Receita substituída com sucesso!", "success");
      } else {
        await updateReceita(apiUrl, receitaAtualizada.id, receitaAtualizada);
        const novas = receitas.map((r) =>
          r.id === receitaAtualizada.id ? receitaAtualizada : r
        );
        setReceitas(novas);
        localStorage.setItem("todasReceitas", JSON.stringify(novas));
        mostrarAlerta("Receita atualizada com sucesso!", "success");
      }

      setReceitaEditando(null);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro ao atualizar receita", "danger");
    }
  };

  const limparEdicao = () => setReceitaEditando(null);

  const receitasFiltradas = receitas.filter((r) =>
    (r.nome || "").toLowerCase().includes(pesquisa.toLowerCase())
  );

  const totalIngreds = receitasFiltradas.reduce(
    (acc, r) => acc + (r.ingredientes?.length || 0),
    0
  );

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  return (
    <div className="container mt-4">
      {/* TÍTULO + RESUMO */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-primary fw-bold mb-1">🍽️ Gestão de Receitas</h2>
          <small className="text-muted">
            {receitasFiltradas.length} receita(s) • {totalIngreds} ingrediente(s)
          </small>
        </div>

        {/* PESQUISA RÁPIDA */}
        <div style={{ minWidth: "260px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Procurar receitas..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
      </div>

      {/* FORM + LISTA */}
      <div className="row">
        {/* FORM DE NOVA/EDIÇÃO */}
        <div className="col-lg-5 mb-4" ref={formRef}>
          <div
            className="card shadow-sm border-0"
            style={{
              height: "calc(100vh - 220px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="card-body d-flex flex-column"
              style={{ overflowY: "auto", paddingRight: "6px" }}
            >
              <h5 className="fw-bold text-secondary mb-3">
                {receitaEditando ? "✏️ Editar Receita" : "➕ Adicionar Nova Receita"}
              </h5>

              <ReceitaForm
                apiUrl={apiUrl}
                onAdicionar={handleAdicionar}
                onAtualizar={handleAtualizar}
                receitaEditando={receitaEditando}
                limparEdicao={limparEdicao}
              />
            </div>
          </div>
        </div>

        {/* LISTA DE RECEITAS */}
        <div className="col-lg-7 mb-4">
          <div
            className="card shadow-sm border-0"
            style={{
              height: "calc(100vh - 220px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="card-body d-flex flex-column"
              style={{ overflow: "hidden" }}
            >
              <h5 className="text-primary fw-bold mb-3">📋 Lista de Receitas</h5>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: "6px" }}>
                {receitasFiltradas.length === 0 ? (
                  <p className="text-muted">Nenhuma receita encontrada.</p>
                ) : (
                  <ReceitaList
                    receitas={receitasFiltradas}
                    onApagar={handleApagar}
                    onEditar={handleEditar}
                    onAtualizarDireto={handleAtualizarDireto}
                  />

                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertaMensagem
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        onClose={() => setAlerta({ mensagem: "", tipo: "success" })}
      />
    </div>
  );
}
