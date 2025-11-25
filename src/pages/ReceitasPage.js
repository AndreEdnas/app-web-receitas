import React, { useState, useEffect, useRef } from "react";
import { ReceitaForm } from "../components/ReceitaForm";
import ReceitaList from "../components/ReceitaList";
import AlertaMensagem from "../components/AlertaMensagem";
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

  useEffect(() => {
    if (!apiUrl) return;
    async function fetchReceitas() {
      const data = await getReceitas(apiUrl);
      setReceitas(data);
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
    setReceitas(data);
  };

  const handleApagar = async (id) => {
    await deleteReceita(apiUrl, id);
    const data = await getReceitas(apiUrl);
    setReceitas(data);
    mostrarAlerta("Receita apagada com sucesso!", "danger");
  };

  const handleEditar = (receita) => {
    setReceitaEditando(receita);
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
        setReceitas(data);
        mostrarAlerta("Receita substituída com sucesso!");
      } else {
        await updateReceita(apiUrl, receitaAtualizada.id, receitaAtualizada);
        const novas = receitas.map((r) =>
          r.id === receitaAtualizada.id ? receitaAtualizada : r
        );
        setReceitas(novas);
        mostrarAlerta("Receita atualizada com sucesso!");
      }
      setReceitaEditando(null);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro ao atualizar receita", "danger");
    }
  };

  const limparEdicao = () => setReceitaEditando(null);

  const receitasFiltradas = receitas.filter((r) =>
    r.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  return (
    <div className="container mt-5">
      <div ref={formRef}>
        <ReceitaForm
          apiUrl={apiUrl}
          onAdicionar={handleAdicionar}
          onAtualizar={handleAtualizar}
          receitaEditando={receitaEditando}
          limparEdicao={limparEdicao}
        />
      </div>

  
        {/* 🔖 Título Receitas */}
       <h2 className="mt-5 mb-4 text-primary">📋 Receitas</h2>

<div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Procurar receita por nome..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>

        <ReceitaList
          receitas={receitasFiltradas}
          onApagar={handleApagar}
          onEditar={handleEditar}
        />

        <AlertaMensagem
          mensagem={alerta.mensagem}
          tipo={alerta.tipo}
          onClose={() => setAlerta({ mensagem: "", tipo: "success" })}
        />
    </div>
  );
}
