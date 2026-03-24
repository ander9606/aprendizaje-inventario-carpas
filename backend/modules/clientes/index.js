const router = require('express').Router();

router.use('/clientes', require('./routes/clientes'));
router.use('/ciudades', require('./routes/ciudades'));
router.use('/departamentos', require('./routes/departamentos'));

module.exports = router;
