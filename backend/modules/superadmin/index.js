const router = require('express').Router();
const { verificarToken } = require('../auth/middleware/authMiddleware');
const verificarSuperAdmin = require('./middleware/verificarSuperAdmin');

// All superadmin routes require auth + super_admin role
router.use(verificarToken);
router.use(verificarSuperAdmin);

router.use('/superadmin/dashboard', require('./routes/dashboard'));
router.use('/superadmin/tenants', require('./routes/tenants'));
router.use('/superadmin/planes', require('./routes/planes'));
router.use('/superadmin/pagos', require('./routes/pagos'));

module.exports = router;
