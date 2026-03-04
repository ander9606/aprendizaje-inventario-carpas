const router = require('express').Router();

router.use('/clientes', require('./routes/clientes'));
router.use('/ciudades', require('./routes/ciudades'));

module.exports = router;
