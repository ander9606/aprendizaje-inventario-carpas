/**
 * Runner: separar roles de plataforma
 * Ejecutar: node backend/migrations/run_separate_platform_roles.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const IGNORABLE_ERRORS = [
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_TABLE_EXISTS_ERROR',
    'ER_CANT_DROP_FIELD_OR_KEY',
    'ER_FK_DUP_NAME'
];

async function runMigration() {
    const sqlPath = path.join(__dirname, 'separate_platform_roles.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql
        .split(';')
        .map(s => s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim())
        .filter(s => s.length > 0);

    console.log(`\n🚀 Separando roles de plataforma (${statements.length} statements)...\n`);

    let success = 0, skipped = 0, errors = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.split('\n').find(l => l.trim()) || stmt.substring(0, 60);

        try {
            await pool.query(stmt);
            success++;
            console.log(`  ✅ [${i + 1}/${statements.length}] ${preview.substring(0, 80)}`);
        } catch (error) {
            if (IGNORABLE_ERRORS.includes(error.code)) {
                skipped++;
                console.log(`  ⏭️  [${i + 1}/${statements.length}] Skipped (${error.code})`);
            } else {
                errors++;
                console.error(`  ❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
            }
        }
    }

    console.log(`\n📊 Resultado: ${success} exitosos, ${skipped} omitidos, ${errors} errores\n`);
    process.exit(errors > 0 ? 1 : 0);
}

runMigration().catch(err => {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
});
