const keytar = require("keytar");

async function setup() {
  await keytar.setPassword("app-web-leitura", "db-user", "sa");        // o utilizador SQL que criaste
  await keytar.setPassword("app-web-leitura", "db-password", "sa12345"); // a senha desse utilizador
  console.log("Credenciais guardadas no Credential Manager!");
}

setup();
