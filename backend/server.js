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

// Importar rutas
const categoriasRoutes = require('./routes/categorias');
const elementosRoutes = require('./routes/elementos');
const seriesRoutes = require('./routes/series');
const lotesRoutes = require('./routes/lotes');
const materialesRoutes = require('./routes/materiales');
const unidadesRoutes = require('./routes/unidades');
const ubicacionesRoutes = require('./routes/ubicaciones');  

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
        version: '2.0.0',
        endpoints: [
            '/api/categorias',
            '/api/elementos',
            '/api/series',
            '/api/lotes',
            '/api/ubicaciones',  // ← NUEVO
            '/api/materiales',
            '/api/unidades'
        ]
    });
});

// Registrar rutas
app.use('/api/categorias', categoriasRoutes);
app.use('/api/elementos', elementosRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);  
app.use('/api/materiales', materialesRoutes);
app.use('/api/unidades', unidadesRoutes);

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
            console.log(`📦 Módulos: Categorías, Elementos, Series, Lotes, Ubicaciones, Materiales, Unidades\n`);
        });
    } catch (error) {
        console.error('\n❌ Error al iniciar:', error.message);
        console.error('   Verifica MySQL y credenciales\n');
        process.exit(1);
    }
};

startServer();