import React, { useState, useEffect } from "react";
import { ReceitaForm } from "../components/ReceitaForm";
import ReceitaList from "../components/ReceitaList";
import AlertaMensagem from "../components/AlertaMensagem";
import { getReceitas, addReceita, deleteReceita, updateReceita } from "../services/receitasService";
import { useNgrokUrl } from "../hooks/useNgrokUrl";

export default function ReceitasPage() {
  const apiUrl = useNgrokUrl("Mimos"); // 👈 podes trocar a loja aqui
  const [receitas, setReceitas] = useState([]);
  const [receitaEditando, setReceitaEditando] = useState(null);
  const [alerta, setAlerta] = useState({ mensagem: "", tipo: "success" });

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

  if (!apiUrl) return <p>🔄 A carregar ligação à API...</p>;

  return (
    <div className="container mt-5">
      <ReceitaForm
        apiUrl={apiUrl}
        onAdicionar={handleAdicionar}
        onAtualizar={handleAtualizar}
        receitaEditando={receitaEditando}
        limparEdicao={limparEdicao}
      />
      <ReceitaList
        receitas={receitas}
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
