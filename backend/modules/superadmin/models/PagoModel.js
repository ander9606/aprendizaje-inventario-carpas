const { pool } = require('../../../config/database');

class PagoModel {
    /**
     * Obtener pagos con filtros
     */
    static async obtenerTodos({ limit = 20, offset = 0, pagado = '', mes = '', tenantId = '' } = {}) {
        let query = `
            SELECT tp.*, t.nombre AS tenant_nombre, t.slug AS tenant_slug,
                   p.nombre AS plan_nombre
            FROM tenant_pagos tp
            INNER JOIN tenants t ON tp.tenant_id = t.id
            INNER JOIN planes p ON tp.plan_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (pagado !== '') {
            query += ` AND tp.pagado = ?`;
            params.push(parseInt(pagado));
        }
        if (mes) {
            query += ` AND DATE_FORMAT(tp.periodo_inicio, '%Y-%m') = ?`;
            params.push(mes);
        }
        if (tenantId) {
            query += ` AND tp.tenant_id = ?`;
            params.push(parseInt(tenantId));
        }

        query += ` ORDER BY tp.periodo_inicio DESC, t.nombre ASC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Contar pagos con filtros
     */
    static async contar({ pagado = '', mes = '', tenantId = '' } = {}) {
        let query = `SELECT COUNT(*) AS total FROM tenant_pagos tp WHERE 1=1`;
        const params = [];

        if (pagado !== '') {
            query += ` AND tp.pagado = ?`;
            params.push(parseInt(pagado));
        }
        if (mes) {
            query += ` AND DATE_FORMAT(tp.periodo_inicio, '%Y-%m') = ?`;
            params.push(mes);
        }
        if (tenantId) {
            query += ` AND tp.tenant_id = ?`;
            params.push(parseInt(tenantId));
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    /**
     * Obtener pago por ID
     */
    static async obtenerPorId(id) {
        const [rows] = await pool.query(`
            SELECT tp.*, t.nombre AS tenant_nombre, t.slug AS tenant_slug,
                   p.nombre AS plan_nombre
            FROM tenant_pagos tp
            INNER JOIN tenants t ON tp.tenant_id = t.id
            INNER JOIN planes p ON tp.plan_id = p.id
            WHERE tp.id = ?
        `, [id]);
        return rows[0];
    }

    /**
     * Marcar pago (pagado/no pagado)
     */
    static async marcarPago(id, data) {
        const { pagado, fecha_pago, metodo_pago, notas } = data;
        const [result] = await pool.query(
            `UPDATE tenant_pagos SET pagado = ?, fecha_pago = ?, metodo_pago = ?, notas = ?
             WHERE id = ?`,
            [pagado ? 1 : 0, pagado ? (fecha_pago || new Date()) : null, pagado ? (metodo_pago || null) : null, notas || null, id]
        );

        // Actualizar flag pago_al_dia en tenant
        if (result.affectedRows > 0) {
            const pago = await this.obtenerPorId(id);
            if (pago) {
                await this.actualizarPagoAlDia(pago.tenant_id);
            }
        }

        return result.affectedRows;
    }

    /**
     * Actualizar flag pago_al_dia del tenant
     */
    static async actualizarPagoAlDia(tenantId) {
        const [pendientes] = await pool.query(
            `SELECT COUNT(*) AS total FROM tenant_pagos
             WHERE tenant_id = ? AND pagado = 0 AND periodo_fin < CURDATE()`,
            [tenantId]
        );
        const alDia = pendientes[0].total === 0;
        await pool.query('UPDATE tenants SET pago_al_dia = ? WHERE id = ?', [alDia ? 1 : 0, tenantId]);
        return alDia;
    }

    /**
     * Generar registros de pago para un periodo
     */
    static async generarPeriodo(mes) {
        const [year, month] = mes.split('-').map(Number);
        const periodoInicio = `${mes}-01`;
        const ultimoDia = new Date(year, month, 0).getDate();
        const periodoFin = `${mes}-${String(ultimoDia).padStart(2, '0')}`;

        const [tenants] = await pool.query(`
            SELECT t.id AS tenant_id, t.plan_id, p.precio_mensual
            FROM tenants t
            INNER JOIN planes p ON t.plan_id = p.id
            WHERE t.estado = 'activo' AND p.precio_mensual > 0
        `);

        let generados = 0;
        for (const tenant of tenants) {
            try {
                await pool.query(
                    `INSERT IGNORE INTO tenant_pagos (tenant_id, plan_id, periodo_inicio, periodo_fin, monto)
                     VALUES (?, ?, ?, ?, ?)`,
                    [tenant.tenant_id, tenant.plan_id, periodoInicio, periodoFin, tenant.precio_mensual]
                );
                generados++;
            } catch (e) {
                // IGNORE duplicates (uk_tenant_periodo)
            }
        }
        return { generados, periodo: mes };
    }

    /**
     * Resumen de pagos
     */
    static async obtenerResumen(mes = null) {
        let whereClause = '';
        const params = [];
        if (mes) {
            whereClause = `WHERE DATE_FORMAT(tp.periodo_inicio, '%Y-%m') = ?`;
            params.push(mes);
        }

        const [rows] = await pool.query(`
            SELECT
                COUNT(*) AS total_registros,
                SUM(tp.pagado = 0) AS pendientes,
                SUM(tp.pagado = 0 AND tp.periodo_fin < CURDATE()) AS vencidos,
                SUM(tp.pagado = 1) AS pagados,
                COALESCE(SUM(CASE WHEN tp.pagado = 0 THEN tp.monto ELSE 0 END), 0) AS monto_por_cobrar,
                COALESCE(SUM(CASE WHEN tp.pagado = 1 THEN tp.monto ELSE 0 END), 0) AS monto_cobrado
            FROM tenant_pagos tp
            ${whereClause}
        `, params);
        return rows[0];
    }

    /**
     * Historial de pagos de un tenant
     */
    static async obtenerPorTenant(tenantId, { limit = 12, offset = 0 } = {}) {
        const [rows] = await pool.query(`
            SELECT tp.*, p.nombre AS plan_nombre
            FROM tenant_pagos tp
            INNER JOIN planes p ON tp.plan_id = p.id
            WHERE tp.tenant_id = ?
            ORDER BY tp.periodo_inicio DESC
            LIMIT ? OFFSET ?
        `, [tenantId, limit, offset]);
        return rows;
    }

    /**
     * Eliminar registro de pago
     */
    static async eliminar(id) {
        const [result] = await pool.query('DELETE FROM tenant_pagos WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = PagoModel;
