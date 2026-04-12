const router = require('express').Router();
const planController = require('../controllers/planController');

router.get('/', planController.obtenerTodos);
router.get('/:id', planController.obtenerPorId);
router.post('/', planController.crear);
router.put('/:id', planController.actualizar);
router.delete('/:id', planController.eliminar);

module.exports = router;
