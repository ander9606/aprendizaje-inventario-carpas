const router = require('express').Router();
const pagoController = require('../controllers/pagoController');

router.get('/', pagoController.obtenerTodos);
router.get('/resumen', pagoController.obtenerResumen);
router.post('/generar-periodo', pagoController.generarPeriodo);
router.patch('/:id', pagoController.marcarPago);
router.delete('/:id', pagoController.eliminar);

module.exports = router;
