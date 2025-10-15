// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================

// Importar librería mysql2
const mysql = require('mysql2/promise');

// Importar dotenv para variables de entorno
require('dotenv').config();

// ============================================
// CREAR POOL DE CONEXIONES
// ============================================

// Pool = grupo de conexiones reutilizables (más eficiente)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aprendizaje_inventario',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ============================================
// FUNCIÓN PARA PROBAR LA CONEXIÓN
// ============================================

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:', error.message);
        return false;
    }
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
    pool,
    testConnection
};