import React, { useState } from "react";

export default function LoginPage({ apiUrl, onLogin }) {
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  async function entrar() {
    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, password }),
      });

      const json = await res.json();
      if (json.error) return setErro(json.error);

      onLogin(json.user);
    } catch (e) {
      setErro("Erro a ligar ao servidor");
    }
  }

  return (
    <div className="container-fluid d-flex vh-100 bg-warning justify-content-center align-items-center">
      <div className="card p-4 shadow" style={{ width: "350px" }}>
        <h4 className="text-center mb-3">Login Funcionário</h4>

        <input
          className="form-control mb-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="form-control mb-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {erro && <p className="text-danger">{erro}</p>}

        <button className="btn btn-success w-100 mt-3" onClick={entrar}>
          Entrar
        </button>
      </div>
    </div>
  );
}
