// Script para ejecutar limpiar_datos_prueba.sql usando la configuración de la base de datos
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSqlScript() {
  const sqlPath = path.join(__dirname, '../sql/limpiar_datos_prueba.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const [results] = await connection.query(sql);
    console.log('✅ Script ejecutado correctamente.');
    if (Array.isArray(results)) {
      results.forEach((result, i) => {
        if (result && result.constructor && result.constructor.name === 'ResultSetHeader') return;
        console.log('Resultado', i + 1, ':', result);
      });
    } else {
      console.log(results);
    }
  } catch (err) {
    console.error('❌ Error al ejecutar el script:', err.message);
  } finally {
    await connection.end();
  }
}

runSqlScript();
