/**
 * Runner para la migración de super admin + planes + pagos
 * Ejecutar: node backend/migrations/run_superadmin.js
 *
 * PREREQUISITO: Ejecutar primero run_multi_tenant.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const IGNORABLE_ERRORS = [
    'ER_DUP_FIELDNAME',         // Columna ya existe
    'ER_DUP_KEYNAME',           // Index ya existe
    'ER_TABLE_EXISTS_ERROR',    // Tabla ya existe
    'ER_CANT_DROP_FIELD_OR_KEY',// Index/columna no existe
    'ER_FK_DUP_NAME',          // FK ya existe
    'ER_DUP_ENTRY'             // Registro ya existe (INSERT IGNORE)
];

async function runMigration() {
    const sqlPath = path.join(__dirname, 'add_superadmin_planes_pagos.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql
        .split(';')
        .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
        .filter(s => s.length > 0);

    console.log(`\n🚀 Ejecutando migración super admin + planes + pagos (${statements.length} statements)...\n`);

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || stmt.substring(0, 60);

        try {
            await pool.query(stmt);
            success++;
            console.log(`  ✅ [${i + 1}/${statements.length}] ${preview.substring(0, 80)}`);
        } catch (error) {
            if (IGNORABLE_ERRORS.includes(error.code)) {
                skipped++;
                console.log(`  ⏭️  [${i + 1}/${statements.length}] Skipped (${error.code}): ${preview.substring(0, 60)}`);
            } else {
                errors++;
                console.error(`  ❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
                console.error(`     Statement: ${preview.substring(0, 100)}`);
            }
        }
    }

    console.log(`\n📊 Resultado: ${success} exitosos, ${skipped} omitidos, ${errors} errores\n`);

    if (errors > 0) {
        console.error('⚠️  Hubo errores en la migración. Revisa los mensajes anteriores.');
        process.exit(1);
    }

    console.log('✅ Migración super admin + planes + pagos completada exitosamente.\n');
    process.exit(0);
}

runMigration().catch(err => {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
});
