const router = require('express').Router();
const { verificarToken } = require('../auth/middleware/authMiddleware');
const verificarSuperAdmin = require('./middleware/verificarSuperAdmin');

// Middleware solo para rutas /superadmin/* (no afecta otras rutas)
router.use('/superadmin', verificarToken, verificarSuperAdmin);

router.use('/superadmin/dashboard', require('./routes/dashboard'));
router.use('/superadmin/tenants', require('./routes/tenants'));
router.use('/superadmin/planes', require('./routes/planes'));
router.use('/superadmin/pagos', require('./routes/pagos'));

module.exports = router;
