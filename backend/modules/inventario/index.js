const router = require('express').Router();

router.use('/categorias', require('./routes/categorias'));
router.use('/elementos', require('./routes/elementos'));
router.use('/series', require('./routes/series'));
router.use('/lotes', require('./routes/lotes'));
router.use('/materiales', require('./routes/materiales'));
router.use('/unidades', require('./routes/unidades'));
router.use('/inventario', require('./routes/export'));
router.use('/ubicaciones', require('./routes/ubicaciones'));

module.exports = router;
