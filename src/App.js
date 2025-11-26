// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LojaSelectPage from "./pages/LojaSelectPage";
import MenuPrincipal from "./pages/MenuPrincipal";
import TopoNavegacao from "./pages/TopoNavegacao";

import ReceitasPage from "./pages/ReceitasPage";
import ProducaoPage from "./pages/ProduzirReceitaPage";
import CalculoPage from "./pages/CalculoPage";
import HistoricoPage from "./pages/HistoricoPage";
import CalculadoraOnlinePage from "./pages/CalculadoraOnlinePage";


function App() {
  const [loja, setLoja] = useState(localStorage.getItem("loja"));
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("apiUrl"));

  const fazerLogout = () => {
    localStorage.clear();
    setLoja(null);
    setApiUrl(null);
  };

  if (!loja || !apiUrl) {
    return (
      <LojaSelectPage
        onLoginSucesso={() => {
          setLoja(localStorage.getItem("loja"));
          setApiUrl(localStorage.getItem("apiUrl"));
        }}
      />
    );
  }

  return (
    <Router>
      <Routes>
        {/* MENU principal */}
        <Route path="/menu" element={<MenuPrincipal loja={loja} onLogout={fazerLogout} />} />

        {/* Páginas internas com barra nova */}
        <Route
          path="/calculo"
          element={
            <>
              <TopoNavegacao loja={loja} onLogout={fazerLogout} />
              <CalculoPage />
            </>
          }
        />

        <Route
          path="/receitas"
          element={
            <>
              <TopoNavegacao loja={loja} onLogout={fazerLogout} />
              <ReceitasPage />
            </>
          }
        />

        <Route
          path="/producao"
          element={
            <>
              <TopoNavegacao loja={loja} onLogout={fazerLogout} />
              <ProducaoPage />
            </>
          }
        />

        <Route
          path="/historico"
          element={
            <>
              <TopoNavegacao loja={loja} onLogout={fazerLogout} />
              <HistoricoPage />
            </>
          }
        />

        <Route
          path="/calculadora-online"
          element={
            <>
              <TopoNavegacao loja={loja} onLogout={fazerLogout} />
              <CalculadoraOnlinePage />
            </>
          }
        />



        {/* fallback */}
        <Route path="*" element={<Navigate to="/menu" />} />
      </Routes>
    </Router>
  );
}

export default App;
