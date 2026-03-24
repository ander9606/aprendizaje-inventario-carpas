/**
 * Script de migración: activo (BOOLEAN) → estado (ENUM)
 *
 * Cambios:
 * 1. Agrega columna 'estado' ENUM('pendiente', 'activo', 'inactivo')
 * 2. Migra datos: activo=TRUE → 'activo', activo=FALSE → 'inactivo'
 * 3. Elimina columna 'activo'
 * 4. Agrega columna 'rol_solicitado_id' (FK a roles)
 * 5. Agrega columna 'motivo_rechazo'
 *
 * Uso: node scripts/migrar-estado-empleados.js
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

async function migrar() {
    console.log('Conectando a la base de datos...')

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'inventario_carpas'
    })

    try {
        // Verificar si la columna 'estado' ya existe
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados' AND COLUMN_NAME = 'estado'
        `)

        if (columns.length > 0) {
            console.log('La columna "estado" ya existe. Verificando columnas adicionales...')
        } else {
            // Paso 1: Agregar columna estado
            console.log('Agregando columna "estado"...')
            await connection.execute(`
                ALTER TABLE empleados
                ADD COLUMN estado ENUM('pendiente', 'activo', 'inactivo') NOT NULL DEFAULT 'activo'
            `)

            // Paso 2: Migrar datos
            console.log('Migrando datos de activo a estado...')
            await connection.execute(`
                UPDATE empleados SET estado = CASE
                    WHEN activo = TRUE THEN 'activo'
                    ELSE 'inactivo'
                END
            `)

            // Paso 3: Eliminar columna activo
            console.log('Eliminando columna "activo"...')
            await connection.execute(`ALTER TABLE empleados DROP COLUMN activo`)

            console.log('Columna "estado" migrada correctamente')
        }

        // Paso 4: Agregar columna rol_solicitado_id si no existe
        const [colRolSol] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados' AND COLUMN_NAME = 'rol_solicitado_id'
        `)

        if (colRolSol.length === 0) {
            console.log('Agregando columna "rol_solicitado_id"...')
            await connection.execute(`
                ALTER TABLE empleados
                ADD COLUMN rol_solicitado_id INT NULL,
                ADD FOREIGN KEY (rol_solicitado_id) REFERENCES roles(id)
            `)
            console.log('Columna "rol_solicitado_id" agregada')
        } else {
            console.log('Columna "rol_solicitado_id" ya existe')
        }

        // Paso 5: Agregar columna motivo_rechazo si no existe
        const [colMotivo] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empleados' AND COLUMN_NAME = 'motivo_rechazo'
        `)

        if (colMotivo.length === 0) {
            console.log('Agregando columna "motivo_rechazo"...')
            await connection.execute(`
                ALTER TABLE empleados
                ADD COLUMN motivo_rechazo VARCHAR(255) NULL
            `)
            console.log('Columna "motivo_rechazo" agregada')
        } else {
            console.log('Columna "motivo_rechazo" ya existe')
        }

        // Hacer rol_id nullable para empleados pendientes
        console.log('Haciendo rol_id nullable...')
        await connection.execute(`
            ALTER TABLE empleados MODIFY COLUMN rol_id INT NULL
        `)

        console.log('\n========================================')
        console.log('Migracion completada exitosamente!')
        console.log('========================================\n')

    } catch (error) {
        console.error('Error en la migracion:', error.message)
        throw error
    } finally {
        await connection.end()
    }
}

migrar()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
