require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BIN_ID = process.env.JSONBIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const LOJA_ID = process.env.REACT_APP_LOJA_ID; // Para saber em que loja atualizar o link
const ENV_PATH = path.resolve(__dirname, '.env.local');

async function updateNgrok() {
  try {
    if (!LOJA_ID) throw new Error("❌ LOJA_ID não definido. Verifica o .env.local");

    // Pegar URL do ngrok
    const res = await fetch("http://localhost:3051/ngrok-url");
    const data = await res.json();
    const ngrokUrl = data.url;
    if (!ngrokUrl) throw new Error("Nenhum URL do ngrok encontrado.");
    console.log("🔹 Ngrok URL:", ngrokUrl);

    // Buscar conteúdo atual do JSONBin
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const binData = await getRes.json();
    const lojas = binData.record.lojas || {};

    // Atualizar ou criar a loja
    if (!lojas[LOJA_ID]) {
      lojas[LOJA_ID] = { url: ngrokUrl, token: "" };
    } else {
      lojas[LOJA_ID] = { ...lojas[LOJA_ID], url: ngrokUrl };
    }

    // Atualizar JSONBin
    const updateRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
      body: JSON.stringify({ lojas })
    });
    console.log("✅ JSONBin atualizado:", await updateRes.json());

    // Atualizar .env.local
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
    const envLine = `REACT_APP_API_URL=${ngrokUrl}`;
    envContent = envContent.includes('REACT_APP_API_URL=') ?
      envContent.replace(/REACT_APP_API_URL=.*/g, envLine) :
      envContent + `\n${envLine}\n`;
    fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
    console.log("✅ .env.local atualizado:", envLine);

  } catch (err) {
    console.error("❌ Erro ao atualizar ngrok:", err);
  }
}

updateNgrok();
