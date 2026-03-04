const router = require('express').Router();

router.use('/operaciones', require('./routes/operaciones'));
router.use('/empleados', require('./routes/empleados'));
router.use('/vehiculos', require('./routes/vehiculos'));

module.exports = router;
