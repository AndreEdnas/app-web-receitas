// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LojaSelectPage from "./pages/LojaSelectPage";
import MenuPrincipal from "./pages/MenuPrincipal";

import ReceitasPage from "./pages/ReceitasPage";
import ProducaoPage from "./pages/ProduzirReceitaPage";
import CalculoPage from "./pages/CalculoPage";
import AbatesPage from "./pages/AbatesPage";

function App() {
  const [loja, setLoja] = useState(localStorage.getItem("loja"));
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("apiUrl"));

  if (!loja || !apiUrl) {
    return (
      <LojaSelectPage
        onLoginSucesso={(loja, apiURL) => {
          localStorage.setItem("loja", loja);
          localStorage.setItem("apiUrl", apiURL);
          setLoja(loja);
          setApiUrl(apiURL);
        }}
      />
    );
  }

  return (
    <Router>
      <MenuPrincipal
        loja={loja}
        onLogout={() => {
          localStorage.clear();
          setLoja(null);
          setApiUrl(null);
        }}
      />

      <Routes>
        <Route path="/calculo" element={<CalculoPage apiUrl={apiUrl} />} />
        <Route path="/receitas" element={<ReceitasPage apiUrl={apiUrl} />} />
        <Route path="/producao" element={<ProducaoPage apiUrl={apiUrl} />} />
        <Route path="/abates" element={<AbatesPage apiUrl={apiUrl} />} />
      </Routes>
    </Router>
  );
}

export default App;
