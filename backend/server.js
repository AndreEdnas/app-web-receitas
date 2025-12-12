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

const keytar = require('keytar');

// Função para buscar config da BD
async function getDbConfig() {
  const user = await keytar.getPassword("app-web-leitura", "db-user");
  const password = await keytar.getPassword("app-web-leitura", "db-password");

  if (!user || !password) {
    throw new Error("❌ Credenciais não encontradas no Credential Manager!");
  }

  return {
    user,
    password,
   server: 'ANDRE',
  database: 'DEMOZS',
  port: 1982,
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };
}




// GET produtos
app.get("/produtos", async (req, res) => {
  try {
    const pool = await sql.connect(await getDbConfig());
    const result = await pool.request().query(`
      SELECT 
        p.codbarras,
        p.codigo,
        p.descricao,
        p.precocompra,
        p.precovenda,
        p.unidade,
        p.margembruta,
        p.qtdstock,
        u.descricao AS unidadeDescricao
      FROM produtos p
      LEFT JOIN unidades u
        ON p.unidade = u.codigo
    `);

    const produtos = result.recordset.map(p => ({
      codbarras: p.codbarras,
      codigo: p.codigo,
      descricao: p.descricao,
      precovenda: p.precovenda,
      precocompra: p.precocompra,
      margembruta: p.margembruta,
      qtdstock: p.qtdstock,
      unidade: { codigo: p.unidade, descricao: p.unidadeDescricao }
    }));

    res.json(produtos);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    res.status(500).json({ erro: "Erro ao carregar produtos" });
  }
});


// PATCH produto (atualizar qtdstock)
app.patch("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { qtdstock } = req.body;
    const pool = await sql.connect(await getDbConfig());
    const result = await pool.request()
      .input("id", sql.Int, id) // usa VarChar se codigo não for INT
      .input("qtdstock", sql.Decimal(18, 2), qtdstock)
      .query("UPDATE produtos SET qtdstock = @qtdstock WHERE codigo = @id");

    console.log("Linhas afetadas:", result.rowsAffected);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ message: "✅ Stock atualizado", id, qtdstock });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// GET vendas por data
app.get("/vendas/:data", async (req, res) => {
  try {
    const { data } = req.params; // dd-mm-yyyy
    const [dia, mes, ano] = data.split("-");
    const dataSQL = `${ano}-${mes}-${dia}`; // yyyy-mm-dd

   const pool = await sql.connect(await getDbConfig());

    const result = await pool.request()
      .input("data", sql.Date, dataSQL)
      .query(`
        SELECT descricao, qtd, data
        FROM vendas
        WHERE CAST(data AS DATE) = @data
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao buscar vendas:", err);
    res.status(500).json({ error: "Erro ao buscar vendas" });
  }
});








// =======================
// RECEITAS JSON
// =======================
const filePath = path.join(__dirname, "receitas.json");

// GET todas as receitas
app.get("/receitas", (req, res) => {
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
app.post("/receitas", (req, res) => {
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
app.delete("/receitas/:id", (req, res) => {
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
app.put("/receitas/:id", (req, res) => {
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

app.listen(3051, () => {
  console.log("Servidor a correr em http://localhost:3051");
});




// =======================
// ABATES JSON
// =======================

const abatesFile = path.join(__dirname, "abates.json");

// cria o ficheiro se não existir
if (!fs.existsSync(abatesFile)) {
  fs.writeFileSync(abatesFile, "{}"); // 👉 agora começa como objeto
}

// POST - guardar abate
app.post("/abates", (req, res) => {
  try {
    const abates = fs.existsSync(abatesFile)
      ? JSON.parse(fs.readFileSync(abatesFile, "utf-8"))
      : {};

    // data passada pelo frontend OU hoje
    const dataDia = req.body.data
      ? req.body.data.split("T")[0] // só yyyy-mm-dd
      : new Date().toISOString().split("T")[0];

    // garantir array para esse dia
    if (!abates[dataDia]) {
      abates[dataDia] = [];
    }

    const novoAbate = {
      id: Date.now(),
      registros: Array.isArray(req.body.registros)
        ? req.body.registros
        : [req.body.registros],
    };

    abates[dataDia].push(novoAbate);

    fs.writeFileSync(abatesFile, JSON.stringify(abates, null, 2));

    res.status(201).json(novoAbate);
  } catch (err) {
    console.error("Erro ao guardar abate:", err);
    res.status(500).json({ error: "Erro ao guardar abate" });
  }
});

// GET - listar abates
app.get("/abates", (req, res) => {
  try {
    if (!fs.existsSync(abatesFile)) return res.json({});
    const data = fs.readFileSync(abatesFile, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Erro ao ler abates:", err);
    res.status(500).json({ error: "Erro ao ler abates" });
  }
});


