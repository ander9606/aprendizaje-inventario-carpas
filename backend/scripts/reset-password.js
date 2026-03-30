/**
 * Script para resetear contraseña y desbloquear cuentas
 *
 * Uso: node scripts/reset-password.js
 *
 * Resetea TODAS las cuentas con contraseña: admin123
 * y las desbloquea.
 */

require('dotenv').config()
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')

async function resetPassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'aprendizaje_inventario'
    })

    try {
        // Listar empleados
        const [empleados] = await connection.execute(
            'SELECT id, nombre, email, bloqueado_hasta, intentos_fallidos FROM empleados'
        )

        console.log('\n📋 Empleados encontrados:')
        empleados.forEach(emp => {
            const bloqueado = emp.bloqueado_hasta && new Date(emp.bloqueado_hasta) > new Date()
            console.log(`  - ${emp.nombre} (${emp.email}) ${bloqueado ? '🔒 BLOQUEADO' : '✅'}`)
        })

        // Resetear contraseña a "admin123" y desbloquear
        const newHash = await bcrypt.hash('admin123', 10)

        const [result] = await connection.execute(
            'UPDATE empleados SET password_hash = ?, bloqueado_hasta = NULL, intentos_fallidos = 0',
            [newHash]
        )

        console.log(`\n✅ ${result.affectedRows} cuenta(s) reseteada(s)`)
        console.log('🔑 Nueva contraseña para todos: admin123')
        console.log('🔓 Todas las cuentas desbloqueadas\n')

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await connection.end()
    }
}

resetPassword()
