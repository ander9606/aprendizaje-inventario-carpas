// ============================================
// SCRIPT: Crear empleados de operaciones (campo)
// Ejecutar: node scripts/crear-empleados-campo.js
// ============================================

const bcrypt = require('bcryptjs');
require('dotenv').config();

const mysql = require('mysql2/promise');

const empleadosCampo = [
    {
        nombre: 'Carlos',
        apellido: 'Ramirez',
        email: 'carlos.ramirez@carpas.com',
        telefono: '3101234567',
        rol: 'operaciones',
        password: 'Campo2024!'
    },
    {
        nombre: 'Miguel',
        apellido: 'Torres',
        email: 'miguel.torres@carpas.com',
        telefono: '3209876543',
        rol: 'operaciones',
        password: 'Campo2024!'
    },
    {
        nombre: 'Andres',
        apellido: 'Lopez',
        email: 'andres.lopez@carpas.com',
        telefono: '3154567890',
        rol: 'operaciones',
        password: 'Campo2024!'
    },
    {
        nombre: 'Jorge',
        apellido: 'Martinez',
        email: 'jorge.martinez@carpas.com',
        telefono: '3187654321',
        rol: 'bodega',
        password: 'Campo2024!'
    },
    {
        nombre: 'Luis',
        apellido: 'Hernandez',
        email: 'luis.hernandez@carpas.com',
        telefono: '3161112233',
        rol: 'bodega',
        password: 'Campo2024!'
    }
];

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'aprendizaje_inventario'
    });

    try {
        console.log('🔧 Creando empleados de campo...\n');

        // Obtener IDs de roles
        const [roles] = await connection.execute('SELECT id, nombre FROM roles');
        const rolMap = {};
        roles.forEach(r => { rolMap[r.nombre] = r.id; });

        console.log('📋 Roles disponibles:', roles.map(r => `${r.nombre}(${r.id})`).join(', '));

        if (!rolMap['operaciones'] || !rolMap['bodega']) {
            console.error('❌ Faltan roles "operaciones" y/o "bodega". Ejecuta primero: node scripts/crear-admin.js');
            process.exit(1);
        }

        let creados = 0;
        let existentes = 0;

        for (const emp of empleadosCampo) {
            const [existe] = await connection.execute(
                'SELECT id FROM empleados WHERE email = ?',
                [emp.email]
            );

            if (existe.length > 0) {
                console.log(`ℹ️  ${emp.nombre} ${emp.apellido} (${emp.email}) ya existe`);
                existentes++;
                continue;
            }

            const passwordHash = await bcrypt.hash(emp.password, 10);
            const rolId = rolMap[emp.rol];

            await connection.execute(
                `INSERT INTO empleados (nombre, apellido, email, telefono, password_hash, rol_id, estado)
                 VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
                [emp.nombre, emp.apellido, emp.email, emp.telefono, passwordHash, rolId]
            );

            console.log(`✅ ${emp.nombre} ${emp.apellido} - rol: ${emp.rol} - ${emp.email}`);
            creados++;
        }

        console.log(`\n📊 Resumen: ${creados} creados, ${existentes} ya existían`);
        console.log('\n🔑 Contraseña para todos: Campo2024!');
        console.log('   (Cambiar después del primer login)\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

main();
