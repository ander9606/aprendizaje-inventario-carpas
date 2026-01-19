/**
 * Script para crear usuario administrador inicial
 *
 * Uso: node scripts/crear-admin.js
 *
 * Este script crea:
 * 1. Un rol 'admin' si no existe
 * 2. Un usuario administrador con ese rol
 */

require('dotenv').config()
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')

async function crearAdmin() {
    console.log('🔧 Conectando a la base de datos...')

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'inventario_carpas'
    })

    try {
        // ============================================
        // CREAR TABLA DE ROLES SI NO EXISTE
        // ============================================
        console.log('📋 Verificando tabla de roles...')

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(50) NOT NULL UNIQUE,
                descripcion VARCHAR(255),
                permisos JSON,
                activo BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `)

        // ============================================
        // CREAR TABLA DE EMPLEADOS SI NO EXISTE
        // ============================================
        console.log('📋 Verificando tabla de empleados...')

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS empleados (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                telefono VARCHAR(20),
                password_hash VARCHAR(255) NOT NULL,
                rol_id INT,
                activo BOOLEAN DEFAULT TRUE,
                ultimo_acceso TIMESTAMP NULL,
                intentos_fallidos INT DEFAULT 0,
                bloqueado_hasta TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES roles(id)
            )
        `)

        // ============================================
        // CREAR TABLA DE REFRESH TOKENS SI NO EXISTE
        // ============================================
        console.log('📋 Verificando tabla de refresh_tokens...')

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INT PRIMARY KEY AUTO_INCREMENT,
                empleado_id INT NOT NULL,
                token VARCHAR(500) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
            )
        `)

        // ============================================
        // CREAR TABLA DE AUDITORÍA SI NO EXISTE
        // ============================================
        console.log('📋 Verificando tabla de auditoria_auth...')

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS auditoria_auth (
                id INT PRIMARY KEY AUTO_INCREMENT,
                empleado_id INT,
                accion VARCHAR(50) NOT NULL,
                ip VARCHAR(50),
                user_agent TEXT,
                detalles JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE SET NULL
            )
        `)

        // ============================================
        // CREAR ROL ADMIN
        // ============================================
        console.log('👑 Creando rol admin...')

        const permisosAdmin = {
            inventario: { ver: true, crear: true, editar: true, eliminar: true },
            productos: { ver: true, crear: true, editar: true, eliminar: true },
            alquileres: { ver: true, crear: true, editar: true, eliminar: true },
            operaciones: { ver: true, crear: true, editar: true, eliminar: true },
            configuracion: { ver: true, crear: true, editar: true, eliminar: true },
            empleados: { ver: true, crear: true, editar: true, eliminar: true },
            reportes: { ver: true, exportar: true }
        }

        const [existeRol] = await connection.execute(
            'SELECT id FROM roles WHERE nombre = ?',
            ['admin']
        )

        let rolId
        if (existeRol.length === 0) {
            const [result] = await connection.execute(
                'INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)',
                ['admin', 'Administrador del sistema con acceso total', JSON.stringify(permisosAdmin)]
            )
            rolId = result.insertId
            console.log('✅ Rol admin creado con ID:', rolId)
        } else {
            rolId = existeRol[0].id
            console.log('ℹ️  Rol admin ya existe con ID:', rolId)
        }

        // ============================================
        // CREAR OTROS ROLES
        // ============================================
        const otrosRoles = [
            {
                nombre: 'gerente',
                descripcion: 'Gerente con acceso a reportes y aprobaciones',
                permisos: {
                    inventario: { ver: true, crear: true, editar: true, eliminar: false },
                    productos: { ver: true, crear: true, editar: true, eliminar: false },
                    alquileres: { ver: true, crear: true, editar: true, eliminar: false },
                    operaciones: { ver: true, crear: true, editar: true, eliminar: false },
                    configuracion: { ver: true, crear: false, editar: false, eliminar: false },
                    empleados: { ver: true, crear: false, editar: false, eliminar: false },
                    reportes: { ver: true, exportar: true }
                }
            },
            {
                nombre: 'ventas',
                descripcion: 'Equipo de ventas - cotizaciones y clientes',
                permisos: {
                    inventario: { ver: true, crear: false, editar: false, eliminar: false },
                    productos: { ver: true, crear: false, editar: false, eliminar: false },
                    alquileres: { ver: true, crear: true, editar: true, eliminar: false },
                    operaciones: { ver: true, crear: false, editar: false, eliminar: false },
                    configuracion: { ver: false },
                    empleados: { ver: false },
                    reportes: { ver: true, exportar: false }
                }
            },
            {
                nombre: 'operaciones',
                descripcion: 'Equipo de operaciones - montaje y desmontaje',
                permisos: {
                    inventario: { ver: true, crear: false, editar: true, eliminar: false },
                    productos: { ver: true, crear: false, editar: false, eliminar: false },
                    alquileres: { ver: true, crear: false, editar: false, eliminar: false },
                    operaciones: { ver: true, crear: true, editar: true, eliminar: false },
                    configuracion: { ver: false },
                    empleados: { ver: false },
                    reportes: { ver: false }
                }
            },
            {
                nombre: 'bodega',
                descripcion: 'Personal de bodega - inventario',
                permisos: {
                    inventario: { ver: true, crear: true, editar: true, eliminar: false },
                    productos: { ver: true, crear: false, editar: false, eliminar: false },
                    alquileres: { ver: true, crear: false, editar: false, eliminar: false },
                    operaciones: { ver: true, crear: false, editar: false, eliminar: false },
                    configuracion: { ver: false },
                    empleados: { ver: false },
                    reportes: { ver: false }
                }
            }
        ]

        for (const rol of otrosRoles) {
            const [existe] = await connection.execute(
                'SELECT id FROM roles WHERE nombre = ?',
                [rol.nombre]
            )

            if (existe.length === 0) {
                await connection.execute(
                    'INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)',
                    [rol.nombre, rol.descripcion, JSON.stringify(rol.permisos)]
                )
                console.log(`✅ Rol ${rol.nombre} creado`)
            } else {
                console.log(`ℹ️  Rol ${rol.nombre} ya existe`)
            }
        }

        // ============================================
        // CREAR USUARIO ADMIN
        // ============================================
        console.log('👤 Creando usuario admin...')

        const email = 'admin@carpas.com'
        const password = 'admin123'

        const [existeUsuario] = await connection.execute(
            'SELECT id FROM empleados WHERE email = ?',
            [email]
        )

        if (existeUsuario.length === 0) {
            const passwordHash = await bcrypt.hash(password, 10)

            await connection.execute(
                `INSERT INTO empleados (nombre, apellido, email, telefono, password_hash, rol_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['Admin', 'Sistema', email, '0000000000', passwordHash, rolId]
            )
            console.log('✅ Usuario admin creado')
        } else {
            console.log('ℹ️  Usuario admin ya existe')
        }

        // ============================================
        // RESULTADO
        // ============================================
        console.log('\n========================================')
        console.log('🎉 Configuración completada!')
        console.log('========================================')
        console.log('\nCredenciales de acceso:')
        console.log(`📧 Email: ${email}`)
        console.log(`🔑 Password: ${password}`)
        console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!')
        console.log('========================================\n')

    } catch (error) {
        console.error('❌ Error:', error.message)
        throw error
    } finally {
        await connection.end()
    }
}

crearAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
