// testSql.js
const sql = require('mssql');

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

async function testConnection() {
  try {
    await sql.connect(sqlConfig);
    console.log('Ligação ao SQL Server bem-sucedida!');


    await sql.close();
  } catch (err) {
    console.error('Erro ao ligar à base de dados:', err);
  }
}

testConnection();
