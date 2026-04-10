/**
 * Tests para cotizacionController
 */

jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/CotizacionModel');
jest.mock('../../models/CotizacionProductoModel');
jest.mock('../../models/CotizacionTransporteModel');
jest.mock('../../models/CotizacionProductoRecargoModel');
jest.mock('../../models/CotizacionDescuentoModel');
jest.mock('../../../clientes/models/ClienteModel');
jest.mock('../../models/TarifaTransporteModel');
jest.mock('../../models/AlquilerModel');
jest.mock('../../models/AlquilerElementoModel');
jest.mock('../../models/DisponibilidadModel');
jest.mock('../../../operaciones/models/OrdenTrabajoModel');
jest.mock('../../models/EventoModel');
jest.mock('../../services/CotizacionPDFService');
jest.mock('../../../configuracion/models/ConfiguracionModel');
jest.mock('../../../../utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn()
}));

const CotizacionModel = require('../../models/CotizacionModel');
const CotizacionProductoModel = require('../../models/CotizacionProductoModel');
const CotizacionTransporteModel = require('../../models/CotizacionTransporteModel');
const CotizacionProductoRecargoModel = require('../../models/CotizacionProductoRecargoModel');
const CotizacionDescuentoModel = require('../../models/CotizacionDescuentoModel');
const ClienteModel = require('../../../clientes/models/ClienteModel');
const TarifaTransporteModel = require('../../models/TarifaTransporteModel');
const AlquilerModel = require('../../models/AlquilerModel');
const AlquilerElementoModel = require('../../models/AlquilerElementoModel');
const DisponibilidadModel = require('../../models/DisponibilidadModel');
const EventoModel = require('../../models/EventoModel');
const CotizacionPDFService = require('../../services/CotizacionPDFService');
const ConfiguracionModel = require('../../../configuracion/models/ConfiguracionModel');
const controller = require('../cotizacionController');
const AppError = require('../../../../utils/AppError');

const mockReq = (o = {}) => ({ body: {}, params: {}, query: {}, usuario: null, tenant: { id: 1, slug: 'test', nombre: 'Test' }, ...o });
const mockRes = () => { const r = {}; r.status = jest.fn().mockReturnValue(r); r.json = jest.fn().mockReturnValue(r); r.setHeader = jest.fn(); return r; };
const mockNext = () => jest.fn();

afterEach(() => jest.clearAllMocks());

describe('obtenerTodas', () => {
    test('retorna todas', async () => {
        CotizacionModel.obtenerTodas.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerTodas(mockReq(), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });
});

describe('obtenerPorEstado', () => {
    test('retorna por estado válido', async () => {
        CotizacionModel.obtenerPorEstado.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'pendiente' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });

    test('error estado inválido', async () => {
        const next = mockNext();
        await controller.obtenerPorEstado(mockReq({ params: { estado: 'invalido' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerPorId', () => {
    test('retorna cotización', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });

    test('error 404', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorId(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerCompleta', () => {
    test('retorna completa', async () => {
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1, productos: [] });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerCompleta(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, productos: [] } });
    });

    test('error 404', async () => {
        CotizacionModel.obtenerCompleta.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerCompleta(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('crear', () => {
    test('crea cotización exitosamente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1, nombre: 'Juan' });
        CotizacionModel.crear.mockResolvedValue({ insertId: 10 });
        CotizacionProductoModel.agregar.mockResolvedValue({ insertId: 1 });
        CotizacionModel.recalcularTotales.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 10 });
        const res = mockRes(); const next = mockNext();
        await controller.crear(mockReq({
            body: {
                cliente_id: 1,
                fecha_evento: '2026-05-01',
                productos: [{ compuesto_id: 1, cantidad: 2, precio_base: 100 }],
                fechas_confirmadas: true
            }
        }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error sin cliente_id', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { fecha_evento: '2026-01-01', productos: [{ id: 1 }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin productos', async () => {
        const next = mockNext();
        await controller.crear(mockReq({
            body: { cliente_id: 1, fecha_evento: '2026-01-01', productos: [] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error si cliente no existe', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.crear(mockReq({
            body: { cliente_id: 999, fecha_evento: '2026-01-01', productos: [{ id: 1 }] }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('actualizar', () => {
    test('actualiza cotización pendiente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        CotizacionModel.actualizar.mockResolvedValue();
        CotizacionModel.recalcularTotales.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.actualizar(mockReq({
            params: { id: '1' },
            body: { notas: 'Actualizado' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si estado no es pendiente ni borrador', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'aprobada' });
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error 404', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.actualizar(mockReq({ params: { id: '999' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('agregarProducto', () => {
    test('agrega producto a cotización pendiente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        CotizacionProductoModel.agregar.mockResolvedValue();
        CotizacionModel.recalcularTotales.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.agregarProducto(mockReq({
            params: { id: '1' },
            body: { compuesto_id: 1, cantidad: 2, precio_base: 100 }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si cotización aprobada', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'aprobada' });
        const next = mockNext();
        await controller.agregarProducto(mockReq({ params: { id: '1' }, body: {} }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('eliminarProducto', () => {
    test('elimina producto', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'borrador' });
        CotizacionProductoModel.eliminar.mockResolvedValue();
        CotizacionModel.recalcularTotales.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.eliminarProducto(mockReq({
            params: { id: '1', productoId: '5' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

describe('agregarTransporte', () => {
    test('agrega transporte', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        TarifaTransporteModel.obtenerPorId.mockResolvedValue({ id: 1, precio: 500000 });
        CotizacionTransporteModel.agregar.mockResolvedValue();
        CotizacionModel.recalcularTotales.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.agregarTransporte(mockReq({
            params: { id: '1' },
            body: { tarifa_id: 1, cantidad: 1 }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si tarifa no existe', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        TarifaTransporteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.agregarTransporte(mockReq({
            params: { id: '1' },
            body: { tarifa_id: 999 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('cambiarEstado', () => {
    test('cambia estado válido', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        CotizacionModel.actualizarEstado.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.cambiarEstado(mockReq({
            params: { id: '1' },
            body: { estado: 'aprobada' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error estado inválido', async () => {
        const next = mockNext();
        await controller.cambiarEstado(mockReq({
            params: { id: '1' },
            body: { estado: 'invalido' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('duplicar', () => {
    test('duplica exitosamente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionModel.duplicar.mockResolvedValue(20);
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 20 });
        const res = mockRes(); const next = mockNext();
        await controller.duplicar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('error 404', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.duplicar(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('eliminar', () => {
    test('elimina exitosamente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionModel.tieneAlquiler.mockResolvedValue(false);
        CotizacionModel.eliminar.mockResolvedValue();
        const res = mockRes(); const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si tiene alquiler', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionModel.tieneAlquiler.mockResolvedValue(true);
        const next = mockNext();
        await controller.eliminar(mockReq({ params: { id: '1' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerPorCliente', () => {
    test('retorna cotizaciones del cliente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue({ id: 1 });
        CotizacionModel.obtenerPorCliente.mockResolvedValue([{ id: 1 }]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerPorCliente(mockReq({ params: { clienteId: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }], total: 1 });
    });

    test('error 404 cliente', async () => {
        ClienteModel.obtenerPorId.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerPorCliente(mockReq({ params: { clienteId: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});

describe('obtenerUbicacionesCliente', () => {
    test('retorna ubicaciones usadas por el cliente', async () => {
        const ubicaciones = [
            { evento_ciudad: 'Bogota', evento_direccion: 'Calle 80 #45', ubicacion_id: null },
            { evento_ciudad: 'Medellin', evento_direccion: 'Carrera 70 #10', ubicacion_id: 2 }
        ];
        CotizacionModel.obtenerUbicacionesPorCliente.mockResolvedValue(ubicaciones);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerUbicacionesCliente(mockReq({ params: { clienteId: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: ubicaciones, total: 2 });
    });

    test('retorna array vacio si no tiene ubicaciones', async () => {
        CotizacionModel.obtenerUbicacionesPorCliente.mockResolvedValue([]);
        const res = mockRes(); const next = mockNext();
        await controller.obtenerUbicacionesCliente(mockReq({ params: { clienteId: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: [], total: 0 });
    });

    test('maneja error', async () => {
        CotizacionModel.obtenerUbicacionesPorCliente.mockRejectedValue(new Error('DB error'));
        const next = mockNext();
        await controller.obtenerUbicacionesCliente(mockReq({ params: { clienteId: '1' } }), mockRes(), next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe('confirmarFechas', () => {
    test('confirma fechas de borrador', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'borrador' });
        CotizacionModel.confirmarFechas.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1, total: 1000 });
        const res = mockRes(); const next = mockNext();
        await controller.confirmarFechas(mockReq({
            params: { id: '1' },
            body: { fecha_evento: '2026-05-01' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si no es borrador', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        const next = mockNext();
        await controller.confirmarFechas(mockReq({
            params: { id: '1' },
            body: { fecha_evento: '2026-05-01' }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    test('error sin fecha_evento', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'borrador' });
        const next = mockNext();
        await controller.confirmarFechas(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('asignarEvento', () => {
    test('asigna evento exitosamente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, cliente_id: 5 });
        EventoModel.obtenerPorId.mockResolvedValue({ id: 10, cliente_id: 5 });
        CotizacionModel.asignarEvento = jest.fn().mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.asignarEvento(mockReq({
            params: { id: '1' },
            body: { evento_id: 10 }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si evento no pertenece al cliente', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, cliente_id: 5 });
        EventoModel.obtenerPorId.mockResolvedValue({ id: 10, cliente_id: 99 });
        const next = mockNext();
        await controller.asignarEvento(mockReq({
            params: { id: '1' },
            body: { evento_id: 10 }
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('actualizarCobrarDeposito', () => {
    test('actualiza cobrar_deposito', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        CotizacionModel.actualizarCobrarDeposito.mockResolvedValue();
        CotizacionModel.obtenerCompleta.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.actualizarCobrarDeposito(mockReq({
            params: { id: '1' },
            body: { cobrar_deposito: false }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error sin cobrar_deposito', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        const next = mockNext();
        await controller.actualizarCobrarDeposito(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('registrarSeguimiento', () => {
    test('registra seguimiento', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'pendiente' });
        CotizacionModel.registrarSeguimiento.mockResolvedValue({ id: 1 });
        const res = mockRes(); const next = mockNext();
        await controller.registrarSeguimiento(mockReq({
            params: { id: '1' },
            body: { notas: 'Llamada' }
        }), res, next);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error si estado no es pendiente ni borrador', async () => {
        CotizacionModel.obtenerPorId.mockResolvedValue({ id: 1, estado: 'aprobada' });
        const next = mockNext();
        await controller.registrarSeguimiento(mockReq({
            params: { id: '1' },
            body: {}
        }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
});

describe('obtenerSeguimiento', () => {
    test('retorna seguimiento', async () => {
        CotizacionModel.obtenerSeguimiento.mockResolvedValue({ id: 1, seguimientos: 2 });
        const res = mockRes(); const next = mockNext();
        await controller.obtenerSeguimiento(mockReq({ params: { id: '1' } }), res, next);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1, seguimientos: 2 } });
    });

    test('error 404', async () => {
        CotizacionModel.obtenerSeguimiento.mockResolvedValue(null);
        const next = mockNext();
        await controller.obtenerSeguimiento(mockReq({ params: { id: '999' } }), mockRes(), next);
        expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
});
