/**
 * Script para ejecutar migraciones SQL
 * Uso: node scripts/ejecutar-migraciones.js [numero_inicio] [numero_fin]
 * Ejemplo: node scripts/ejecutar-migraciones.js 21 25
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const MIGRACIONES_DIR = path.join(__dirname, '../sql/productos_alquiler');

/**
 * Parser de SQL que respeta strings y paréntesis
 */
function parseSqlStatements(sql) {
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = null;
    let parenDepth = 0;

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const prevChar = i > 0 ? sql[i - 1] : '';

        // Manejar strings
        if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
                stringChar = null;
            }
        }

        // Contar paréntesis (solo fuera de strings)
        if (!inString) {
            if (char === '(') parenDepth++;
            if (char === ')') parenDepth--;
        }

        // Detectar fin de statement
        if (char === ';' && !inString && parenDepth === 0) {
            const stmt = current.trim();
            if (stmt.length > 0) {
                statements.push(stmt);
            }
            current = '';
        } else {
            current += char;
        }
    }

    // Agregar último statement si existe
    const lastStmt = current.trim();
    if (lastStmt.length > 0 && !lastStmt.startsWith('--')) {
        statements.push(lastStmt);
    }

    return statements;
}

/**
 * Limpia un statement de comentarios
 */
function limpiarStatement(stmt) {
    // Remover líneas que son solo comentarios
    const lineas = stmt.split('\n');
    const lineasLimpias = lineas.filter(linea => {
        const trimmed = linea.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
    });

    // Remover comentarios al final de líneas
    const resultado = lineasLimpias.map(linea => {
        // Buscar -- que no esté dentro de un string
        let inString = false;
        let stringChar = null;
        for (let i = 0; i < linea.length - 1; i++) {
            const char = linea[i];
            if ((char === "'" || char === '"') && (i === 0 || linea[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            if (!inString && linea[i] === '-' && linea[i + 1] === '-') {
                return linea.substring(0, i).trim();
            }
        }
        return linea;
    }).join('\n');

    return resultado.trim();
}

async function ejecutarMigracion(archivo) {
    const rutaCompleta = path.join(MIGRACIONES_DIR, archivo);

    if (!fs.existsSync(rutaCompleta)) {
        throw new Error(`Archivo no encontrado: ${archivo}`);
    }

    console.log(`\n📄 Ejecutando: ${archivo}`);
    console.log('─'.repeat(50));

    const contenido = fs.readFileSync(rutaCompleta, 'utf8');
    const statements = parseSqlStatements(contenido);

    let exitosos = 0;
    let errores = 0;

    for (const rawStatement of statements) {
        const statement = limpiarStatement(rawStatement);

        // Saltar si está vacío o es SOURCE
        if (!statement || statement.toUpperCase().startsWith('SOURCE')) continue;

        try {
            await pool.query(statement);
            exitosos++;

            // Mostrar qué se creó
            const upperStmt = statement.toUpperCase();
            if (upperStmt.includes('CREATE TABLE')) {
                const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
                if (match) {
                    console.log(`  ✅ Tabla creada: ${match[1]}`);
                }
            } else if (upperStmt.includes('CREATE INDEX')) {
                const match = statement.match(/CREATE INDEX\s+`?(\w+)`?/i);
                if (match) {
                    console.log(`  ✅ Índice creado: ${match[1]}`);
                }
            } else if (upperStmt.includes('INSERT INTO')) {
                const match = statement.match(/INSERT INTO\s+`?(\w+)`?/i);
                if (match) {
                    console.log(`  ✅ Datos insertados en: ${match[1]}`);
                }
            } else if (upperStmt.includes('ALTER TABLE')) {
                const match = statement.match(/ALTER TABLE\s+`?(\w+)`?/i);
                if (match) {
                    console.log(`  ✅ Tabla alterada: ${match[1]}`);
                }
            }
        } catch (error) {
            // Ignorar errores de "ya existe"
            if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
                error.code === 'ER_DUP_KEYNAME' ||
                error.code === 'ER_DUP_ENTRY' ||
                error.message.includes('already exists')) {
                console.log(`  ⚠️  Ya existe: ${error.message.substring(0, 60)}...`);
                exitosos++; // Contar como éxito ya que el objeto existe
            } else {
                // Mostrar más contexto del error
                const preview = statement.substring(0, 80).replace(/\n/g, ' ');
                console.error(`  ❌ Error: ${error.message}`);
                console.error(`     SQL: ${preview}...`);
                errores++;
            }
        }
    }

    console.log(`  📊 Resultado: ${exitosos} exitosos, ${errores} errores`);
    return { exitosos, errores };
}

async function main() {
    const args = process.argv.slice(2);
    let inicio = parseInt(args[0]) || 21;
    let fin = parseInt(args[1]) || 25;

    console.log('═'.repeat(50));
    console.log('🚀 EJECUTANDO MIGRACIONES');
    console.log(`   Rango: ${inicio} a ${fin}`);
    console.log('═'.repeat(50));

    // Obtener archivos de migración en el rango
    const archivos = fs.readdirSync(MIGRACIONES_DIR)
        .filter(f => f.endsWith('.sql'))
        .filter(f => {
            const num = parseInt(f.split('_')[0]);
            return !isNaN(num) && num >= inicio && num <= fin;
        })
        .sort((a, b) => {
            const numA = parseInt(a.split('_')[0]);
            const numB = parseInt(b.split('_')[0]);
            return numA - numB;
        });

    if (archivos.length === 0) {
        console.log('❌ No se encontraron migraciones en el rango especificado');
        process.exit(1);
    }

    console.log(`\n📋 Migraciones a ejecutar:`);
    archivos.forEach(a => console.log(`   - ${a}`));

    let totalExitosos = 0;
    let totalErrores = 0;

    for (const archivo of archivos) {
        try {
            const resultado = await ejecutarMigracion(archivo);
            totalExitosos += resultado.exitosos;
            totalErrores += resultado.errores;
        } catch (error) {
            console.error(`\n❌ Error fatal en ${archivo}: ${error.message}`);
            totalErrores++;
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('📊 RESUMEN FINAL');
    console.log('═'.repeat(50));
    console.log(`   ✅ Statements exitosos: ${totalExitosos}`);
    console.log(`   ❌ Errores: ${totalErrores}`);
    console.log('═'.repeat(50));

    // Mostrar tablas creadas
    console.log('\n📋 Verificando tablas creadas...\n');

    const tablas = [
        'roles', 'empleados', 'refresh_tokens', 'audit_log',
        'vehiculos', 'vehiculo_uso_log', 'vehiculo_mantenimientos',
        'ordenes_trabajo', 'orden_trabajo_equipo', 'orden_trabajo_cambios_fecha',
        'orden_trabajo_elementos', 'elemento_incidencias', 'orden_elemento_fotos',
        'alertas_operaciones', 'notificaciones_pendientes', 'empleado_notificaciones_config'
    ];

    for (const tabla of tablas) {
        try {
            const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${tabla}`);
            console.log(`   ✅ ${tabla} (${rows[0].count} registros)`);
        } catch (error) {
            console.log(`   ❌ ${tabla} - No existe o error`);
        }
    }

    await pool.end();
    console.log('\n✨ Migraciones completadas\n');
}

main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});
