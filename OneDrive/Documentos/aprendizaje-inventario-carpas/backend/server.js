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
        fecha: new Date().toLocaleString()
    });
});

// ============================================
// RUTAS DE LA API
// ============================================

// Usar rutas de categorías
app.use('/api/categorias', categoriasRoutes);

// Usar rutas de elementos
app.use('/api/elementos', elementosRoutes);

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log('');
            console.log('================================');
            console.log('✅ SERVIDOR INICIADO');
            console.log('================================');
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
            console.log('================================');
            console.log('');
            console.log('📍 Rutas disponibles:');
            console.log('  GET     /api/categorias');
            console.log('  GET     /api/categorias/padres');
            console.log('  GET     /api/categorias/:id');
            console.log('  GET     /api/categorias/:id/hijas');
            console.log('  POST    /api/categorias');
            console.log('  PUT     /api/categorias/:id');
            console.log('  DELETE  /api/categorias/:id');
            console.log("__________________________________");
            console.log('📦 ELEMENTOS:');
            console.log('  GET     /api/elementos');
            console.log('  GET     /api/elementos/buscar?q=termino');
            console.log('  GET     /api/elementos/con-series');
            console.log('  GET     /api/elementos/sin-series');
            console.log('  GET     /api/elementos/categoria/:categoriaId');
            console.log('  GET     /api/elementos/:id');
            console.log('  POST    /api/elementos');
            console.log('  PUT     /api/elementos/:id');
            console.log('  DELETE  /api/elementos/:id');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();