import React, { useEffect, useState } from "react";

export default function LojaSelectPage({ onLoginSucesso }) {
  const [lojas, setLojas] = useState({});
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("https://ednas-cloud.andre-86d.workers.dev/config", {
        headers: {
          "X-App-Key": "3dNas"
        }
      });

      const json = await res.json();
      setLojas(json.lojas || {});
    }
    load();
  }, []);


  function continuar() {
    const loja = lojas[lojaSelecionada];

    if (!loja) {
      setErro("Loja inválida");
      return;
    }

    // Verificar token da loja
    if (token === loja.token.toString()) {
      // Guardar no localStorage o necessário
      localStorage.setItem("loja", lojaSelecionada);
      localStorage.setItem("apiUrl", loja.url);

      onLoginSucesso();
    } else {
      setErro("Token errado");
    }
  }

  if (!lojaSelecionada) {
    return (
      <div className="container d-flex vh-100 justify-content-center align-items-center bg-warning">
        <div className="card p-4 shadow" style={{ width: "350px" }}>
          <h3 className="text-center mb-3">Escolha a loja</h3>
          {Object.keys(lojas).map((nome) => (
            <button key={nome} className="btn btn-primary w-100 mb-2" onClick={() => setLojaSelecionada(nome)}>
              {nome}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container d-flex vh-100 justify-content-center align-items-center bg-warning">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h3 className="text-center">{lojaSelecionada}</h3>
        <input
          className="form-control mt-3"
          type="password"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {erro && <p className="text-danger mt-2">{erro}</p>}
        <button className="btn btn-success w-100 mt-3" onClick={continuar}>
          Entrar
        </button>
        <button className="btn btn-secondary w-100 mt-2" onClick={() => { setErro(""); setLojaSelecionada(null); }}>
          Voltar
        </button>
      </div>
    </div>
  );
}
