// ============================================
// SERVIDOR PRINCIPAL
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Importar rutas
const categoriasRoutes = require('./routes/categorias');
const elementosRoutes = require('./routes/elementos');
const seriesRoutes = require('./routes/series');
const materialesRoutes = require('./routes/materiales');
const unidadesRoutes = require('./routes/unidades');
const lotesRoutes = require('./routes/lotes');  // ← NUEVA LÍNEA

// Crear aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// RUTA RAÍZ
// ============================================

app.get('/', (req, res) => {
    res.json({ 
        mensaje: '🚀 API de Inventario de Carpas',
        version: '1.0.0',
        fecha: new Date().toLocaleString(),
        endpoints: [
            '/api/categorias',
            '/api/elementos',
            '/api/series',
            '/api/materiales',
            '/api/unidades',
            '/api/lotes'
        ]
    });
});

// ============================================
// RUTAS DE LA API
// ============================================

app.use('/api/categorias', categoriasRoutes);
app.use('/api/elementos', elementosRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/lotes', lotesRoutes);  // ← NUEVA LÍNEA

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log('');
            console.log('════════════════════════════════════════════════');
            console.log('✅ SERVIDOR INICIADO');
            console.log('════════════════════════════════════════════════');
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
            console.log('════════════════════════════════════════════════');
            console.log('');
            console.log('📍 API ENDPOINTS:');
            console.log('');
            console.log('📂 CATEGORÍAS:');
            console.log('   GET     /api/categorias');
            console.log('   GET     /api/categorias/padres');
            console.log('   GET     /api/categorias/:id/hijas');
            console.log('   POST    /api/categorias');
            console.log('   PUT     /api/categorias/:id');
            console.log('   DELETE  /api/categorias/:id');
            console.log('');
            console.log('📦 ELEMENTOS:');
            console.log('   GET     /api/elementos');
            console.log('   GET     /api/elementos/con-series');
            console.log('   GET     /api/elementos/sin-series');
            console.log('   GET     /api/elementos/buscar?q=termino');
            console.log('   POST    /api/elementos');
            console.log('   PUT     /api/elementos/:id');
            console.log('   DELETE  /api/elementos/:id');
            console.log('');
            console.log('🏷️  SERIES:');
            console.log('   GET     /api/series');
            console.log('   GET     /api/series/disponibles');
            console.log('   GET     /api/series/alquiladas');
            console.log('   GET     /api/series/elemento/:elementoId');
            console.log('   POST    /api/series');
            console.log('   PATCH   /api/series/:id/estado');
            console.log('   DELETE  /api/series/:id');
            console.log('');
            console.log('🎨 MATERIALES:');
            console.log('   GET     /api/materiales');
            console.log('   GET     /api/materiales/mas-usados');
            console.log('   POST    /api/materiales');
            console.log('   PUT     /api/materiales/:id');
            console.log('   DELETE  /api/materiales/:id');
            console.log('');
            console.log('📏 UNIDADES:');
            console.log('   GET     /api/unidades');
            console.log('   GET     /api/unidades/mas-usadas');
            console.log('   GET     /api/unidades/tipo/:tipo');
            console.log('   POST    /api/unidades');
            console.log('   PUT     /api/unidades/:id');
            console.log('   DELETE  /api/unidades/:id');
            console.log('');
            console.log('📊 LOTES (Elementos sin series):');
            console.log('   GET     /api/lotes');
            console.log('   GET     /api/lotes/resumen');
            console.log('   GET     /api/lotes/elemento/:elementoId');
            console.log('   GET     /api/lotes/estado/:estado');
            console.log('   GET     /api/lotes/:id/historial');
            console.log('   POST    /api/lotes');
            console.log('   POST    /api/lotes/movimiento  ← PRINCIPAL');
            console.log('   PUT     /api/lotes/:id');
            console.log('   DELETE  /api/lotes/:id');
            console.log('');
            console.log('════════════════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();