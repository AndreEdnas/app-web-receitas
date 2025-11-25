const keytar = require("keytar");

async function update() {
  // ⚡ muda aqui o utilizador e a senha
  await keytar.setPassword("app-web-leitura", "db-user", "sa");
  await keytar.setPassword("app-web-leitura", "db-password", "Sa1982$");

  console.log("✅ Credenciais atualizadas no Credential Manager!");
}

update();
