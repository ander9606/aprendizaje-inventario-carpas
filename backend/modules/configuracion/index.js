const router = require('express').Router();

router.use('/alertas/alquileres', require('./routes/alertas'));
router.use('/configuracion-alquileres', require('./routes/configuracion'));

module.exports = router;
