const router = require('express').Router();
const tenantController = require('../controllers/tenantController');

router.get('/', tenantController.obtenerTodos);
router.get('/:id', tenantController.obtenerPorId);
router.get('/:id/empleados', tenantController.obtenerEmpleados);
router.get('/:id/pagos', tenantController.obtenerPagos);
router.post('/', tenantController.crear);
router.put('/:id', tenantController.actualizar);
router.patch('/:id/estado', tenantController.cambiarEstado);

module.exports = router;
