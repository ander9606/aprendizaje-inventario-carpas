// ============================================
// CONTROLADOR: MATERIALES
// ============================================

const MaterialModel = require('../models/MaterialModel')
const AppError = require('../../../utils/AppError')

class MaterialController {

  // Obtener todos
  static async obtenerTodos(req, res, next) {
    try {
      const materiales = await MaterialModel.obtenerTodos()
      res.json({ ok: true, data: materiales })
    } catch (error) {
      next(error)
    }
  }

  // Obtener por ID
  static async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params
      const material = await MaterialModel.obtenerPorId(id)

      if (!material) throw new AppError('Material no encontrado', 404)

      res.json({ ok: true, data: material })
    } catch (error) {
      next(error)
    }
  }

  // Crear
  static async crear(req, res, next) {
    try {
      const nuevoId = await MaterialModel.crear(req.body)
      const material = await MaterialModel.obtenerPorId(nuevoId)

      res.status(201).json({
        ok: true,
        mensaje: 'Material creado',
        data: material
      })
    } catch (error) {
      next(error)
    }
  }

  // Actualizar
  static async actualizar(req, res, next) {
    try {
      const { id } = req.params

      const existe = await MaterialModel.obtenerPorId(id)
      if (!existe) throw new AppError('Material no encontrado', 404)

      await MaterialModel.actualizar(id, req.body)

      const actualizado = await MaterialModel.obtenerPorId(id)

      res.json({
        ok: true,
        mensaje: 'Material actualizado',
        data: actualizado
      })
    } catch (error) {
      next(error)
    }
  }

  // Eliminar
  static async eliminar(req, res, next) {
    try {
      const { id } = req.params

      const existe = await MaterialModel.obtenerPorId(id)
      if (!existe) throw new AppError('Material no encontrado', 404)

      await MaterialModel.eliminar(id)

      res.json({
        ok: true,
        mensaje: 'Material eliminado'
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = MaterialController
