const router = require('express').Router();

router.use('/cotizaciones', require('./routes/cotizaciones'));
router.use('/alquileres', require('./routes/alquileres'));
router.use('/tarifas-transporte', require('./routes/tarifasTransporte'));
router.use('/disponibilidad', require('./routes/disponibilidad'));
router.use('/descuentos', require('./routes/descuentos'));
router.use('/eventos', require('./routes/eventos'));

module.exports = router;
