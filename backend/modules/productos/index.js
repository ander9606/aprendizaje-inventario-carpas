const router = require('express').Router();

router.use('/categorias-productos', require('./routes/categoriasProductos'));
router.use('/elementos-compuestos', require('./routes/elementosCompuestos'));

module.exports = router;
