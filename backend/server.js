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

// Importar rutas - Inventario (Stock físico)
const categoriasRoutes = require('./routes/categorias');
const elementosRoutes = require('./routes/elementos');
const seriesRoutes = require('./routes/series');
const lotesRoutes = require('./routes/lotes');
const materialesRoutes = require('./routes/materiales');
const unidadesRoutes = require('./routes/unidades');
const ubicacionesRoutes = require('./routes/ubicaciones');

// Importar rutas - Productos (Plantillas/Elementos Compuestos)
const categoriasProductosRoutes = require('./routes/categoriasProductos');
const elementosCompuestosRoutes = require('./routes/elementosCompuestos');

// Importar rutas - Alquileres (Operación comercial)
const clientesRoutes = require('./routes/clientes');
const cotizacionesRoutes = require('./routes/cotizaciones');
const alquileresRoutes = require('./routes/alquileres');  

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

// CORS - Configurado para frontend específico
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
app.use(httpLogger); // Logging de todas las peticiones HTTP
app.use('/api/', limiter); // Aplicar rate limiting solo a rutas /api/

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
                '/api/ubicaciones',
                '/api/materiales',
                '/api/unidades'
            ],
            productos: [
                '/api/categorias-productos',
                '/api/elementos-compuestos'
            ],
            alquileres: [
                '/api/clientes',
                '/api/cotizaciones',
                '/api/alquileres'
            ]
        }
    });
});

// Registrar rutas - Inventario (Stock físico)
app.use('/api/categorias', categoriasRoutes);
app.use('/api/elementos', elementosRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/unidades', unidadesRoutes);

// Registrar rutas - Productos (Plantillas)
app.use('/api/categorias-productos', categoriasProductosRoutes);
app.use('/api/elementos-compuestos', elementosCompuestosRoutes);

// Registrar rutas - Alquileres (Operación comercial)
app.use('/api/clientes', clientesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/alquileres', alquileresRoutes);

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
            console.log(`🏷️  Alquileres: Clientes, Cotizaciones, Alquileres\n`);
        });
    } catch (error) {
        console.error('\n❌ Error al iniciar:', error.message);
        console.error('   Verifica MySQL y credenciales\n');
        process.exit(1);
    }
};

startServer();