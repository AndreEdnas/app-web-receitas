import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ReceitasPage from "./pages/ReceitasPage"; // <- corrigido
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div style={styles.container}>
        <h1 style={styles.titulo}>🍴 Gestão de Produtos & Receitas</h1>

        <nav style={styles.nav}>
          <Link style={styles.link} to="/produtos">Produtos</Link>
          <Link style={styles.link} to="/receitas">Receitas</Link> {/* <- corrigido */}
        </nav>

        <Routes>
          <Route path="/receitas" element={<ReceitasPage />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Bem-vindo! Escolhe uma opção acima 👆</h2>;
}

const styles = {
  container: { textAlign: "center", marginTop: "40px", fontFamily: "Arial, sans-serif" },
  titulo: { fontSize: "28px", marginBottom: "20px" },
  nav: { display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" },
  link: { textDecoration: "none", padding: "10px 20px", background: "#007bff", color: "white", borderRadius: "6px" },
};

export default App;
