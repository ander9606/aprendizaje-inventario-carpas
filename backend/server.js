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
const lotesRoutes = require('./routes/lotes');
const materialesRoutes = require('./routes/materiales');
const unidadesRoutes = require('./routes/unidades');
const ubicacionesRoutes = require('./routes/ubicaciones');  

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

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