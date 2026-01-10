// ============================================
// CONTROLADOR: Disponibilidad
// Verificación de disponibilidad de elementos
// ============================================

const DisponibilidadModel = require('../models/DisponibilidadModel');
const AppError = require('../../../utils/AppError');

// ============================================
// VERIFICAR DISPONIBILIDAD DE PRODUCTOS
// POST /api/disponibilidad/verificar
// Body: { productos, fecha_montaje, fecha_desmontaje }
// ============================================
exports.verificarProductos = async (req, res, next) => {
  try {
    const { productos, fecha_montaje, fecha_desmontaje } = req.body;

    if (!productos || productos.length === 0) {
      throw new AppError('Debe enviar al menos un producto', 400);
    }

    if (!fecha_montaje) {
      throw new AppError('La fecha de montaje es obligatoria', 400);
    }

    const fechaInicio = fecha_montaje;
    const fechaFin = fecha_desmontaje || fecha_montaje;

    const disponibilidad = await DisponibilidadModel.verificarDisponibilidadProductos(
      productos,
      fechaInicio,
      fechaFin
    );

    res.json({
      success: true,
      data: disponibilidad
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFICAR DISPONIBILIDAD DE COTIZACIÓN EXISTENTE
// GET /api/disponibilidad/cotizacion/:id
// ============================================
exports.verificarCotizacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    // Obtener cotización para usar sus fechas si no se proporcionan
    const CotizacionModel = require('../models/CotizacionModel');
    const cotizacion = await CotizacionModel.obtenerPorId(id);

    if (!cotizacion) {
      throw new AppError('Cotización no encontrada', 404);
    }

    const fechaInicio = fecha_inicio || cotizacion.fecha_montaje || cotizacion.fecha_evento;
    const fechaFin = fecha_fin || cotizacion.fecha_desmontaje || cotizacion.fecha_evento;

    const disponibilidad = await DisponibilidadModel.verificarDisponibilidadCotizacion(
      id,
      fechaInicio,
      fechaFin
    );

    res.json({
      success: true,
      data: disponibilidad
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER CALENDARIO DE OCUPACIÓN
// GET /api/disponibilidad/calendario
// Query: { fecha_inicio, fecha_fin, elementos (opcional, IDs separados por coma) }
// ============================================
exports.obtenerCalendario = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, elementos } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      throw new AppError('Las fechas de inicio y fin son obligatorias', 400);
    }

    let elementoIds = null;
    if (elementos) {
      elementoIds = elementos.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }

    const calendario = await DisponibilidadModel.obtenerCalendarioOcupacion(
      fecha_inicio,
      fecha_fin,
      elementoIds
    );

    res.json({
      success: true,
      data: calendario
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER ELEMENTOS DE PRODUCTOS (descomposición)
// POST /api/disponibilidad/descomponer
// Body: { productos }
// ============================================
exports.descomponerProductos = async (req, res, next) => {
  try {
    const { productos } = req.body;

    if (!productos || productos.length === 0) {
      throw new AppError('Debe enviar al menos un producto', 400);
    }

    const elementos = await DisponibilidadModel.obtenerElementosDeProductos(productos);

    res.json({
      success: true,
      data: elementos
    });
  } catch (error) {
    next(error);
  }
};
