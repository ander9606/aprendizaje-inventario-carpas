/**
 * Script para crear la tabla verificacion_email
 *
 * Uso: node scripts/migrar-verificacion-email.js
 *
 * Requiere que el archivo .env esté configurado con las credenciales de BD
 */

require('dotenv').config();

const mysql = require('mysql2/promise');

const SQL = `
CREATE TABLE IF NOT EXISTS verificacion_email (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    datos_registro JSON NOT NULL COMMENT 'nombre, apellido, telefono, password_hash, rol_solicitado_id',
    intentos INT DEFAULT 0,
    verificado TINYINT(1) DEFAULT 0,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verificacion_email (email),
    INDEX idx_verificacion_expira (expira_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
    console.log('Conectando a la base de datos...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creando tabla verificacion_email...');
        await connection.execute(SQL);
        console.log('Tabla verificacion_email creada exitosamente.');

        // Verificar que se creó
        const [rows] = await connection.execute(
            "SHOW TABLES LIKE 'verificacion_email'"
        );
        if (rows.length > 0) {
            console.log('Verificación: la tabla existe correctamente.');
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
        console.log('Conexión cerrada.');
    }
}

main();
