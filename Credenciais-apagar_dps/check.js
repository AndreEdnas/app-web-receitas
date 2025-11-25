const keytar = require("keytar");

async function check() {
  const user = await keytar.getPassword("app-web-leitura", "db-user");
  const password = await keytar.getPassword("app-web-leitura", "db-password");
  console.log("User:", user);
  console.log("Password:", password);
}

check();
