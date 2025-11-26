import React, { useEffect, useState } from "react";

export default function LojaSelectPage({ onLoginSucesso }) {
  const [lojas, setLojas] = useState({});
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("https://ednas-cloud.andre-86d.workers.dev/config", {
        headers: { "X-App-Key": "3dNas" }
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

    if (token === loja.token.toString()) {
      localStorage.setItem("loja", lojaSelecionada);
      localStorage.setItem("apiUrl", loja.url);
      onLoginSucesso(lojaSelecionada);
    } else {
      setErro("Token errado");
    }
  }

  const fundo = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #FFB800 0%, #FF9900 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  };

  const card = {
    width: "380px",
    borderRadius: "18px",
    padding: "32px",
    background: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    animation: "fadeIn 0.3s ease"
  };

  return (
    <div style={fundo}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loja-btn {
          font-size: 1.1rem;
          padding: 12px 0;
          border-radius: 10px;
          transition: transform 0.15s ease;
        }
        .loja-btn:hover {
          transform: scale(1.03);
        }
      `}</style>

      {!lojaSelecionada && (
        <div style={card}>
          <h3 className="text-center mb-4 fw-bold">
            🏪 Escolha a Loja
          </h3>

          {Object.keys(lojas).map((nome) => (
            <button
              key={nome}
              className="btn btn-primary w-100 loja-btn mb-2"
              onClick={() => {
                setErro("");
                setToken("");
                setLojaSelecionada(nome);
              }}
            >
              {lojas[nome].nome || nome}
            </button>
          ))}
        </div>
      )}

      {lojaSelecionada && (
        <div style={card}>
          <h3 className="text-center fw-bold mb-3">
            🔐 {lojaSelecionada}
          </h3>

          <p className="text-muted text-center mb-3">
            Introduza o token de acesso
          </p>

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ padding: "12px", borderRadius: "10px" }}
          />

          {erro && (
            <p className="text-danger text-center mb-3 fw-bold">
              {erro}
            </p>
          )}

          <button className="btn btn-success w-100 loja-btn mb-2" onClick={continuar}>
            Entrar
          </button>

          <button
            className="btn btn-secondary w-100 loja-btn"
            onClick={() => {
              setErro("");
              setToken("");
              setLojaSelecionada(null);
            }}
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
