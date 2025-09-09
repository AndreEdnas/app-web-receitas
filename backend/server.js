// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// CONFIGURAÇÃO SQL SERVER
// =======================
const sqlConfig = {
  user: 'sa',
  password: 'sa12345',
  server: 'Andre',
  database: 'DEMOZS',
  port: 1982,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};


// GET produtos
app.get("/api/produtos", async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        p.codbarras,
        p.codigo,
        p.descricao,
        p.precovenda,
        p.unidade,
        u.descricao AS unidadeDescricao
      FROM produtos p
      LEFT JOIN unidades u
        ON p.unidade = u.codigo
    `);

    const produtos = result.recordset.map(p => ({
      codbarras: p.codbarras,
      codigo: p.codigo,
      descricao: p.descricao,
      precovenda: p.precovenda,       // adiciona aqui
      unidade: { codigo: p.unidade, descricao: p.unidadeDescricao }
    }));

    res.json(produtos);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    res.status(500).json({ erro: "Erro ao carregar produtos" });
  }
});




// =======================
// RECEITAS JSON
// =======================
const filePath = path.join(__dirname, "receitas.json");

// GET todas as receitas
app.get("/api/receitas", (req, res) => {
  try {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
    const data = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Erro ao ler receitas:", err);
    res.status(500).json({ error: "Erro ao ler receitas" });
  }
});

// POST nova receita
app.post("/api/receitas", (req, res) => {
  try {
    const receitas = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : [];

    const nova = { id: Date.now(), ...req.body };
    receitas.push(nova);

    fs.writeFileSync(filePath, JSON.stringify(receitas, null, 2));
    res.status(201).json(nova);
  } catch (err) {
    console.error("Erro ao guardar receita:", err);
    res.status(500).json({ error: "Erro ao guardar receita" });
  }
});

// DELETE receita por id
app.delete("/api/receitas/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let receitas = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : [];

    receitas = receitas.filter(r => r.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(receitas, null, 2));

    res.json({ message: "Receita apagada" });
  } catch (err) {
    console.error("Erro ao apagar receita:", err);
    res.status(500).json({ error: "Erro ao apagar receita" });
  }
});

// PUT atualizar receita por id
app.put("/api/receitas/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id); // id da receita (vai ser o codigo do produto)
    let receitas = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : [];

    // substituir a receita com mesmo id
    const index = receitas.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Receita não encontrada" });
    }

    receitas[index] = { id, ...req.body }; // mantém o id
    fs.writeFileSync(filePath, JSON.stringify(receitas, null, 2));

    res.json(receitas[index]);
  } catch (err) {
    console.error("Erro ao atualizar receita:", err);
    res.status(500).json({ error: "Erro ao atualizar receita" });
  }
});

app.listen(3001, () => {
  console.log("Servidor a correr em http://localhost:3001");
});
