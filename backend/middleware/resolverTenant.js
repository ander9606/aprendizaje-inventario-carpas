const { pool } = require('../config/database');
const AppError = require('../utils/AppError');

// Cache simple en memoria para evitar consulta a BD en cada request
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Rutas que no requieren resolución de tenant por header/subdominio
// (usan req.usuario.tenant_id del JWT o buscan globalmente)
const SKIP_PREFIXES = [
    '/auth/'
];

const resolverTenant = async (req, res, next) => {
    try {
        // Saltar rutas de auth (usan tenant_id del JWT)
        if (SKIP_PREFIXES.some(prefix => req.path.startsWith(prefix))) {
            return next();
        }

        let slug;

        if (process.env.NODE_ENV === 'production') {
            // En producción: extraer del subdominio (tenant.logiq360.com)
            const host = req.hostname;
            const parts = host.split('.');
            if (parts.length >= 2) {
                slug = parts[0];
            }
        } else {
            // En desarrollo: usar header X-Tenant-Slug
            slug = req.headers['x-tenant-slug'];
        }

        if (!slug) {
            throw new AppError('Tenant no identificado. Proporcione el header X-Tenant-Slug', 400);
        }

        // Verificar cache
        const cached = tenantCache.get(slug);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            req.tenant = cached.data;
            return next();
        }

        // Buscar en BD
        const [rows] = await pool.query(
            'SELECT id, nombre, slug, estado, plan_id FROM tenants WHERE slug = ?',
            [slug]
        );

        if (rows.length === 0) {
            throw new AppError('Tenant no encontrado', 404);
        }

        const tenant = rows[0];

        if (tenant.estado !== 'activo') {
            throw new AppError('Tenant suspendido o inactivo', 403);
        }

        const tenantData = {
            id: tenant.id,
            nombre: tenant.nombre,
            slug: tenant.slug,
            plan_id: tenant.plan_id
        };

        // Guardar en cache
        tenantCache.set(slug, { data: tenantData, timestamp: Date.now() });

        req.tenant = tenantData;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = resolverTenant;
