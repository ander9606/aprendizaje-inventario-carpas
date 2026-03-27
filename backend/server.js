// ============================================
// SERVIDOR PRINCIPAL
// ============================================

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const httpLogger = require('./middleware/httpLogger');

// Importar módulos
const inventarioModule = require('./modules/inventario');
const productosModule = require('./modules/productos');
const alquileresModule = require('./modules/alquileres');
const clientesModule = require('./modules/clientes');
const operacionesModule = require('./modules/operaciones');
const configuracionModule = require('./modules/configuracion');
const authModule = require('./modules/auth');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads', 'logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// CORS - Configurado para frontend específico (acepta varios orígenes en dev)
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'];
const corsOptions = {
    origin: (origin, callback) => {
        // allow requests with no origin like curl or server-to-server
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate Limiting - Limitar peticiones para prevenir DoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 peticiones por IP
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde'
    },
    standardHeaders: true, // Retorna info en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(httpLogger); // Logging de todas las peticiones HTTP
// Aplicar rate limiting solo en producción para evitar 429 durante desarrollo
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
} else {
    // En desarrollo no aplicar limitador (evita bloqueos por pruebas locales)
}

// Health check
app.get('/health', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', uptime: process.uptime() });
    } catch (error) {
        res.status(503).json({ status: 'error', db: 'disconnected', message: error.message });
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        nombre: 'API de Inventario de Carpas',
        version: '3.0.0',
        modulos: {
            inventario: [
                '/api/categorias',
                '/api/elementos',
                '/api/series',
                '/api/lotes',
                '/api/materiales',
                '/api/unidades',
                '/api/ubicaciones',
                '/api/inventario/export/excel'
            ],
            productos: [
                '/api/categorias-productos',
                '/api/elementos-compuestos'
            ],
            alquileres: [
                '/api/cotizaciones',
                '/api/alquileres',
                '/api/tarifas-transporte',
                '/api/disponibilidad',
                '/api/descuentos',
                '/api/eventos'
            ],
            clientes: [
                '/api/clientes',
                '/api/ciudades'
            ],
            operaciones: [
                '/api/operaciones/ordenes',
                '/api/operaciones/calendario',
                '/api/operaciones/alertas',
                '/api/operaciones/estadisticas',
                '/api/empleados',
                '/api/vehiculos'
            ],
            configuracion: [
                '/api/alertas/alquileres',
                '/api/configuracion-alquileres'
            ],
            auth: [
                '/api/auth/login',
                '/api/auth/logout',
                '/api/auth/refresh',
                '/api/auth/me',
                '/api/auth/password'
            ]
        }
    });
});

// Registrar módulos
app.use('/api', inventarioModule);
app.use('/api', productosModule);
app.use('/api', alquileresModule);
app.use('/api', clientesModule);
app.use('/api', operacionesModule);
app.use('/api', configuracionModule);
app.use('/api', authModule);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta 404 - Captura todas las rutas no definidas
app.use(notFound);

// Middleware global de manejo de errores - DEBE SER EL ÚLTIMO
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log('\n✅ Servidor iniciado');
            console.log(`🌐 http://localhost:${PORT}`);
            console.log(`📦 Inventario: Categorías, Elementos, Series, Lotes, Ubicaciones`);
            console.log(`🏗️  Productos: Categorías Productos, Elementos Compuestos`);
            console.log(`🏷️  Alquileres: Cotizaciones, Alquileres, Descuentos, Eventos`);
            console.log(`👥 Clientes: Clientes, Ciudades`);
            console.log(`🔧 Operaciones: Órdenes, Empleados, Vehículos`);
            console.log(`⚙️  Configuración: Alertas, Configuración Alquileres`);
            console.log(`🔐 Auth: Login, Logout, Refresh, Me\n`);
        });
    } catch (error) {
        console.error('\n❌ Error al iniciar:', error.message);
        console.error('   Verifica MySQL y credenciales\n');
        process.exit(1);
    }
};

startServer();