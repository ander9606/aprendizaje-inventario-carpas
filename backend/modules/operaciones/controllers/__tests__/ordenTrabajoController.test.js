/**
 * Tests para ordenTrabajoController
 *
 * Este es el controller más grande del sistema (41 funciones).
 * Se cubren los endpoints principales con sus validaciones:
 *
 * - Órdenes: getOrdenes, getOrdenById, getOrdenCompleta, updateOrden, crearOrdenManual
 * - Fechas: cambiarFechaOrden, validarCambioFecha
 * - Estado: cambiarEstadoOrden (con validaciones de desmontaje/checklist)
 * - Equipo/Vehículo: asignarEquipo, asignarVehiculo
 * - Elementos: getElementosOrden, cambiarEstadoElemento, cambiarEstadoElementosMasivo,
 *   reportarIncidencia, subirFotoElemento
 * - Calendario/Stats: getCalendario, getEstadisticas
 * - Alertas: getAlertas, crearAlerta, resolverAlerta
 * - Checklist: verificarElementoCargue, verificarElementoDescargue, verificarElementoBodega
 * - Preparación: prepararElementos, ejecutarSalida, ejecutarRetorno
 * - Fotos: obtenerFotosOrden, eliminarFotoOrden
 * - Firma: guardarFirmaCliente, obtenerFirmaCliente
 */

jest.mock('../../../../config/database', () => ({
    pool: { query: jest.fn().mockResolvedValue([[], null]) }
}));
jest.mock('../../models/OrdenTrabajoModel');
jest.mock('../../models/OrdenElementoModel');
jest.mock('../../models/AlertaModel');
jest.mock('../../models/FotoOperacionModel');
jest.mock('../../services/ValidadorFechasService');
jest.mock('../../services/SincronizacionAlquilerService');
jest.mock('../../../auth/models/AuthModel');
jest.mock('../../../../middleware/upload', () => ({
    uploadOperacionImagen: jest.fn((req, res, cb) => cb(null)),
    deleteImageFile: jest.fn()
}));
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn()
}));

const { pool } = require('../../../../config/database');
const OrdenTrabajoModel = require('../../models/OrdenTrabajoModel');
const OrdenElementoModel = require('../../models/OrdenElementoModel');
const AlertaModel = require('../../models/AlertaModel');
const FotoOperacionModel = require('../../models/FotoOperacionModel');
const ValidadorFechasService = require('../../services/ValidadorFechasService');
const SincronizacionAlquilerService = require('../../services/SincronizacionAlquilerService');
const AuthModel = require('../../../auth/models/AuthModel');
const { deleteImageFile, uploadOperacionImagen } = require('../../../../middleware/upload');
const controller = require('../ordenTrabajoController');

const mockReq = (o = {}) => ({
    body: {}, params: {}, query: {},
    usuario: { id: 1, email: 'admin@test.com', rol_nombre: 'admin' },
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('test-agent'),
    ...o
});
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); return r; };
const mockNext = () => jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue([[], null]);
    AuthModel.registrarAuditoria.mockResolvedValue();
    uploadOperacionImagen.mockImplementation((req, res, cb) => cb(null));
});

// ============================================
// ÓRDENES CRUD
// ============================================
describe('getOrdenes', () => {
    test('retorna órdenes con paginación', async () => {
        OrdenTrabajoModel.obtenerTodas.mockResolvedValue({
            ordenes: [{ id: 1 }], total: 1, page: 1, limit: 20, totalPages: 1
        });
        const res = mockRes();
        await controller.getOrdenes(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('getOrdenById', () => {
    test('retorna orden existente', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.getOrdenById(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    test('error 404 si no existe', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.getOrdenById(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('getOrdenCompleta', () => {
    test('retorna orden completa', async () => {
        OrdenTrabajoModel.obtenerOrdenCompleta.mockResolvedValue({ id: 1, productos: [] });
        const res = mockRes();
        await controller.getOrdenCompleta(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, productos: [] } });
    });

    test('error 404 si no existe', async () => {
        OrdenTrabajoModel.obtenerOrdenCompleta.mockResolvedValue(null);
        const next = mockNext();
        await controller.getOrdenCompleta(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('updateOrden', () => {
    test('actualiza orden exitosamente', async () => {
        OrdenTrabajoModel.actualizar.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.updateOrden(mockReq({ params: { id: '1' }, body: { notas: 'test' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        expect(AuthModel.registrarAuditoria).toHaveBeenCalled();
    });
});

// ============================================
// CREAR ORDEN MANUAL
// ============================================
describe('crearOrdenManual', () => {
    test('crea orden manual exitosamente', async () => {
        OrdenTrabajoModel.crear.mockResolvedValue({ id: 1 });
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1, tipo: 'mantenimiento' });
        const res = mockRes();
        await controller.crearOrdenManual(mockReq({
            body: { tipo: 'mantenimiento', fecha_programada: '2025-06-01' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('crea con elementos', async () => {
        OrdenTrabajoModel.crear.mockResolvedValue({ id: 1 });
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1 });
        pool.query.mockResolvedValue([{ insertId: 1 }, null]);
        const res = mockRes();
        await controller.crearOrdenManual(mockReq({
            body: {
                tipo: 'traslado',
                fecha_programada: '2025-06-01',
                elementos: [{ elemento_id: 10, serie_id: 5 }]
            }
        }), res, mockNext());
        expect(pool.query).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si falta tipo', async () => {
        const next = mockNext();
        await controller.crearOrdenManual(mockReq({
            body: { fecha_programada: '2025-06-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si falta fecha_programada', async () => {
        const next = mockNext();
        await controller.crearOrdenManual(mockReq({
            body: { tipo: 'mantenimiento' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si tipo inválido', async () => {
        const next = mockNext();
        await controller.crearOrdenManual(mockReq({
            body: { tipo: 'fiesta', fecha_programada: '2025-06-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toContain('Tipo inválido');
    });
});

// ============================================
// CAMBIAR FECHA ORDEN
// ============================================
describe('cambiarFechaOrden', () => {
    test('cambia fecha exitosamente sin conflictos', async () => {
        ValidadorFechasService.validarCambioFecha.mockResolvedValue({
            severidad: 'bajo', conflictos: [], fechaActual: '2025-05-01'
        });
        OrdenTrabajoModel.cambiarFecha.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.cambiarFechaOrden(mockReq({
            params: { id: '1' },
            body: { fecha: '2025-06-01', motivo: 'Reprogramación' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('retorna 409 si conflictos críticos sin forzar', async () => {
        ValidadorFechasService.validarCambioFecha.mockResolvedValue({
            severidad: 'critico', conflictos: [{ tipo: 'overlap' }]
        });
        AlertaModel.crearAlertaDisponibilidad.mockResolvedValue();
        const res = mockRes();
        await controller.cambiarFechaOrden(mockReq({
            params: { id: '1' },
            body: { fecha: '2025-06-01', motivo: 'Cambio' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(409);
        expect(AlertaModel.crearAlertaDisponibilidad).toHaveBeenCalled();
    });

    test('permite forzar con conflictos críticos', async () => {
        ValidadorFechasService.validarCambioFecha.mockResolvedValue({
            severidad: 'critico', conflictos: [], fechaActual: '2025-05-01'
        });
        OrdenTrabajoModel.cambiarFecha.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.cambiarFechaOrden(mockReq({
            params: { id: '1' },
            body: { fecha: '2025-06-01', motivo: 'Urgente', forzar: true }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si falta fecha', async () => {
        const next = mockNext();
        await controller.cambiarFechaOrden(mockReq({
            params: { id: '1' },
            body: { motivo: 'test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si falta motivo', async () => {
        const next = mockNext();
        await controller.cambiarFechaOrden(mockReq({
            params: { id: '1' },
            body: { fecha: '2025-06-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// CAMBIAR ESTADO ORDEN
// ============================================
describe('cambiarEstadoOrden', () => {
    test('cambia estado exitosamente', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'confirmado', tipo: 'montaje', alquiler_id: 5 });
        OrdenTrabajoModel.cambiarEstado.mockResolvedValue({ id: 1, estado: 'en_preparacion' });
        OrdenTrabajoModel.registrarCambioEstado.mockResolvedValue();
        SincronizacionAlquilerService.sincronizarEstadoAlquiler.mockResolvedValue({ sincronizado: false });
        const res = mockRes();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '1' },
            body: { estado: 'en_preparacion' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si estado falta', async () => {
        const next = mockNext();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404 si orden no existe', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '999' },
            body: { estado: 'en_preparacion' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('error si desmontaje avanza pero montaje no completado', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({
            id: 2, estado: 'confirmado', tipo: 'desmontaje', alquiler_id: 5
        });
        pool.query.mockResolvedValue([[{ id: 1, estado: 'en_proceso' }], null]); // montaje no completado
        const next = mockNext();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '2' },
            body: { estado: 'en_preparacion' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
        expect(next.mock.calls[0][0].message).toContain('montaje');
    });

    test('error si desmontaje a en_retorno sin checklist recogida completo', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({
            id: 2, estado: 'en_proceso', tipo: 'desmontaje', alquiler_id: 5
        });
        pool.query.mockResolvedValue([[{ id: 1, estado: 'completado' }], null]); // montaje completado
        OrdenElementoModel.obtenerChecklistOrden.mockResolvedValue({
            totalElementos: 10, verificadosRecogida: 5
        });
        const next = mockNext();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '2' },
            body: { estado: 'en_retorno' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
        expect(next.mock.calls[0][0].message).toContain('Checklist de Recogida');
    });

    test('error si desmontaje a completado sin checklist bodega completo', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({
            id: 2, estado: 'descargue', tipo: 'desmontaje', alquiler_id: 5
        });
        pool.query.mockResolvedValue([[{ id: 1, estado: 'completado' }], null]);
        OrdenElementoModel.obtenerChecklistOrden.mockResolvedValue({
            totalElementos: 10, verificadosBodega: 7
        });
        const next = mockNext();
        await controller.cambiarEstadoOrden(mockReq({
            params: { id: '2' },
            body: { estado: 'completado' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
        expect(next.mock.calls[0][0].message).toContain('Checklist en Bodega');
    });
});

// ============================================
// ASIGNAR EQUIPO / VEHÍCULO
// ============================================
describe('asignarEquipo', () => {
    test('asigna equipo exitosamente', async () => {
        OrdenTrabajoModel.asignarEquipo.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const res = mockRes();
        await controller.asignarEquipo(mockReq({
            params: { id: '1' },
            body: { empleados: [1, 2] }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si empleados no es array', async () => {
        const next = mockNext();
        await controller.asignarEquipo(mockReq({
            params: { id: '1' },
            body: { empleados: 'invalid' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si empleados no proporcionado', async () => {
        const next = mockNext();
        await controller.asignarEquipo(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('asignarVehiculo', () => {
    test('asigna vehículo exitosamente', async () => {
        OrdenTrabajoModel.asignarVehiculo.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.asignarVehiculo(mockReq({
            params: { id: '1' },
            body: { vehiculo_id: 5 }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si falta vehiculo_id', async () => {
        const next = mockNext();
        await controller.asignarVehiculo(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// CALENDARIO / ESTADÍSTICAS
// ============================================
describe('getCalendario', () => {
    test('retorna calendario con fechas', async () => {
        OrdenTrabajoModel.obtenerCalendario.mockResolvedValue([{ id: 1 }]);
        const res = mockRes();
        await controller.getCalendario(mockReq({ query: { desde: '2025-01-01', hasta: '2025-01-31' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
    });

    test('error si faltan fechas', async () => {
        const next = mockNext();
        await controller.getCalendario(mockReq({ query: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('getEstadisticas', () => {
    test('retorna estadísticas', async () => {
        OrdenTrabajoModel.obtenerEstadisticas.mockResolvedValue({ total: 10 });
        const res = mockRes();
        await controller.getEstadisticas(mockReq({ query: {} }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 10 } });
    });
});

// ============================================
// ELEMENTOS DE ÓRDENES
// ============================================
describe('cambiarEstadoElemento', () => {
    test('cambia estado de elemento', async () => {
        OrdenElementoModel.cambiarEstado.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.cambiarEstadoElemento(mockReq({
            params: { id: '1', elemId: '5' },
            body: { estado: 'cargado' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si estado falta', async () => {
        const next = mockNext();
        await controller.cambiarEstadoElemento(mockReq({
            params: { id: '1', elemId: '5' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('cambiarEstadoElementosMasivo', () => {
    test('cambia estado masivo', async () => {
        OrdenElementoModel.cambiarEstadoMasivo.mockResolvedValue({ actualizados: 3 });
        const res = mockRes();
        await controller.cambiarEstadoElementosMasivo(mockReq({
            params: { id: '1' },
            body: { elemento_ids: [1, 2, 3], estado: 'cargado' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si elemento_ids no es array', async () => {
        const next = mockNext();
        await controller.cambiarEstadoElementosMasivo(mockReq({
            params: { id: '1' },
            body: { elemento_ids: 'invalid', estado: 'cargado' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si elemento_ids vacío', async () => {
        const next = mockNext();
        await controller.cambiarEstadoElementosMasivo(mockReq({
            params: { id: '1' },
            body: { elemento_ids: [], estado: 'cargado' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si falta estado', async () => {
        const next = mockNext();
        await controller.cambiarEstadoElementosMasivo(mockReq({
            params: { id: '1' },
            body: { elemento_ids: [1, 2] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('reportarIncidencia', () => {
    test('reporta incidencia exitosamente', async () => {
        OrdenElementoModel.registrarIncidencia.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.reportarIncidencia(mockReq({
            params: { id: '1', elemId: '5' },
            body: { tipo: 'daño', descripcion: 'Roto', severidad: 'baja' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('crea alerta si severidad alta', async () => {
        OrdenElementoModel.registrarIncidencia.mockResolvedValue({ id: 1 });
        OrdenElementoModel.obtenerPorId.mockResolvedValue({ orden_id: 1, elemento_nombre: 'Carpa' });
        AlertaModel.crear.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.reportarIncidencia(mockReq({
            params: { id: '1', elemId: '5' },
            body: { tipo: 'daño', descripcion: 'Grave', severidad: 'alta' }
        }), res, mockNext());
        expect(AlertaModel.crear).toHaveBeenCalledWith(expect.objectContaining({
            tipo: 'incidencia',
            severidad: 'alta'
        }));
    });

    test('crea alerta con severidad critica', async () => {
        OrdenElementoModel.registrarIncidencia.mockResolvedValue({ id: 1 });
        OrdenElementoModel.obtenerPorId.mockResolvedValue({ orden_id: 1, elemento_nombre: 'Carpa' });
        AlertaModel.crear.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.reportarIncidencia(mockReq({
            params: { id: '1', elemId: '5' },
            body: { tipo: 'daño', descripcion: 'Destruido', severidad: 'critica' }
        }), res, mockNext());
        expect(AlertaModel.crear).toHaveBeenCalledWith(expect.objectContaining({
            severidad: 'critica'
        }));
    });

    test('error si faltan tipo o descripcion', async () => {
        const next = mockNext();
        await controller.reportarIncidencia(mockReq({
            params: { id: '1', elemId: '5' },
            body: { tipo: 'daño' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('subirFotoElemento', () => {
    test('sube foto exitosamente', async () => {
        OrdenElementoModel.subirFoto.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.subirFotoElemento(mockReq({
            params: { id: '1', elemId: '5' },
            body: { url_foto: '/uploads/test.jpg' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si falta url_foto', async () => {
        const next = mockNext();
        await controller.subirFotoElemento(mockReq({
            params: { id: '1', elemId: '5' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// ALERTAS
// ============================================
describe('crearAlerta', () => {
    test('crea alerta exitosamente', async () => {
        AlertaModel.crear.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.crearAlerta(mockReq({
            body: { tipo: 'inventario', titulo: 'Falta stock', mensaje: 'Sin carpas' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error si faltan campos', async () => {
        const next = mockNext();
        await controller.crearAlerta(mockReq({
            body: { tipo: 'inventario', titulo: 'Test' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('resolverAlerta', () => {
    test('resuelve alerta exitosamente', async () => {
        AlertaModel.resolver.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.resolverAlerta(mockReq({
            params: { id: '1' },
            body: { notas_resolucion: 'Resuelto' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

// ============================================
// CHECKLIST
// ============================================
describe('verificarElementoCargue', () => {
    test('verifica cargue exitosamente', async () => {
        OrdenElementoModel.toggleVerificacionCargue.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.verificarElementoCargue(mockReq({
            params: { id: '1', elemId: '5' },
            body: { verificado: true }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si verificado no es boolean', async () => {
        const next = mockNext();
        await controller.verificarElementoCargue(mockReq({
            params: { id: '1', elemId: '5' },
            body: { verificado: 'yes' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('verificarElementoDescargue', () => {
    test('verifica descargue', async () => {
        OrdenElementoModel.toggleVerificacionDescargue.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.verificarElementoDescargue(mockReq({
            params: { id: '1', elemId: '5' },
            body: { verificado: false }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si verificado no es boolean', async () => {
        const next = mockNext();
        await controller.verificarElementoDescargue(mockReq({
            params: { id: '1', elemId: '5' },
            body: { verificado: 1 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('verificarElementoBodega', () => {
    test('verifica bodega', async () => {
        OrdenElementoModel.toggleVerificacionBodega.mockResolvedValue({ id: 1 });
        const res = mockRes();
        await controller.verificarElementoBodega(mockReq({
            params: { id: '1', elemId: '5' },
            body: { verificado: true }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si verificado no es boolean', async () => {
        const next = mockNext();
        await controller.verificarElementoBodega(mockReq({
            params: { id: '1', elemId: '5' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// PREPARACIÓN Y EJECUCIÓN
// ============================================
describe('prepararElementos', () => {
    test('prepara elementos exitosamente', async () => {
        SincronizacionAlquilerService.asignarElementosAOrden.mockResolvedValue({ mensaje: 'OK' });
        const res = mockRes();
        await controller.prepararElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [{ serie_id: 1 }] }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si elementos vacío', async () => {
        const next = mockNext();
        await controller.prepararElementos(mockReq({
            params: { id: '1' },
            body: { elementos: [] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('ejecutarRetorno', () => {
    test('ejecuta retorno exitosamente', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1, tipo: 'montaje', estado: 'en_retorno' });
        SincronizacionAlquilerService.ejecutarRetorno.mockResolvedValue({ mensaje: 'OK' });
        OrdenTrabajoModel.registrarCambioEstado.mockResolvedValue();
        SincronizacionAlquilerService.verificarAlertasDisponibilidad = jest.fn().mockResolvedValue({ resueltas: 0 });
        const res = mockRes();
        await controller.ejecutarRetorno(mockReq({
            params: { id: '1' },
            body: { retornos: [{ elemento_id: 1, estado: 'bueno' }] }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si retornos vacío', async () => {
        const next = mockNext();
        await controller.ejecutarRetorno(mockReq({
            params: { id: '1' },
            body: { retornos: [] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si checklist bodega incompleto en desmontaje', async () => {
        OrdenTrabajoModel.obtenerPorId.mockResolvedValue({ id: 1, tipo: 'desmontaje', estado: 'en_retorno' });
        OrdenElementoModel.obtenerChecklistOrden.mockResolvedValue({
            totalElementos: 10, verificadosBodega: 5
        });
        const next = mockNext();
        await controller.ejecutarRetorno(mockReq({
            params: { id: '1' },
            body: { retornos: [{ elemento_id: 1, estado: 'bueno' }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(409);
        expect(next.mock.calls[0][0].message).toContain('Checklist en Bodega');
    });
});

// ============================================
// FOTOS OPERATIVAS
// ============================================
describe('eliminarFotoOrden', () => {
    test('elimina foto exitosamente', async () => {
        FotoOperacionModel.eliminar.mockResolvedValue({ id: 1, imagen_url: '/uploads/foto.jpg' });
        const res = mockRes();
        await controller.eliminarFotoOrden(mockReq({ params: { id: '1', fotoId: '5' } }), res, mockNext());
        expect(deleteImageFile).toHaveBeenCalledWith('/uploads/foto.jpg');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si foto no existe', async () => {
        FotoOperacionModel.eliminar.mockResolvedValue(null);
        const next = mockNext();
        await controller.eliminarFotoOrden(mockReq({ params: { id: '1', fotoId: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// FIRMA CLIENTE
// ============================================
describe('guardarFirmaCliente', () => {
    test('guarda firma exitosamente', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }, null]);
        const res = mockRes();
        await controller.guardarFirmaCliente(mockReq({
            params: { id: '1' },
            body: { firma: 'data:image/png;base64,abc123', nombre: 'Juan Pérez' }
        }), res, mockNext());
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si falta firma', async () => {
        const next = mockNext();
        await controller.guardarFirmaCliente(mockReq({
            params: { id: '1' },
            body: { nombre: 'Juan' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si falta nombre', async () => {
        const next = mockNext();
        await controller.guardarFirmaCliente(mockReq({
            params: { id: '1' },
            body: { firma: 'data:image/png;base64,abc' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si nombre vacío después de trim', async () => {
        const next = mockNext();
        await controller.guardarFirmaCliente(mockReq({
            params: { id: '1' },
            body: { firma: 'data:image/png;base64,abc', nombre: '   ' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerFirmaCliente', () => {
    test('retorna firma existente', async () => {
        pool.query.mockResolvedValue([[{ firma_cliente_url: '/uploads/firma.png', firma_cliente_nombre: 'Juan' }], null]);
        const res = mockRes();
        await controller.obtenerFirmaCliente(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error 404 si orden no existe', async () => {
        pool.query.mockResolvedValue([[], null]);
        const next = mockNext();
        await controller.obtenerFirmaCliente(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

// ============================================
// VALIDAR CAMBIO FECHA
// ============================================
describe('validarCambioFecha', () => {
    test('valida cambio exitosamente', async () => {
        ValidadorFechasService.validarCambioFecha.mockResolvedValue({ severidad: 'bajo' });
        const res = mockRes();
        await controller.validarCambioFecha(mockReq({
            body: { orden_id: 1, fecha: '2025-06-01' }
        }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si faltan campos', async () => {
        const next = mockNext();
        await controller.validarCambioFecha(mockReq({
            body: { orden_id: 1 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

// ============================================
// SINCRONIZACIÓN
// ============================================
describe('getEstadoSincronizacion', () => {
    test('retorna estado', async () => {
        SincronizacionAlquilerService.obtenerEstadoSincronizacion.mockResolvedValue({ ok: true });
        const res = mockRes();
        await controller.getEstadoSincronizacion(mockReq({ params: { id: '1' } }), res, mockNext());
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { ok: true } });
    });

    test('error 404 si alquiler no existe', async () => {
        SincronizacionAlquilerService.obtenerEstadoSincronizacion.mockResolvedValue(null);
        const next = mockNext();
        await controller.getEstadoSincronizacion(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
