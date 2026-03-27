const AppError = require('../AppError');

describe('AppError', () => {
    test('crea error con mensaje y statusCode', () => {
        const error = new AppError('No encontrado', 404);
        expect(error.message).toBe('No encontrado');
        expect(error.statusCode).toBe(404);
    });

    test('statusCode por defecto es 500', () => {
        const error = new AppError('Error interno');
        expect(error.statusCode).toBe(500);
    });

    test('status es "fail" para errores 4xx', () => {
        expect(new AppError('Bad request', 400).status).toBe('fail');
        expect(new AppError('No autorizado', 401).status).toBe('fail');
        expect(new AppError('No encontrado', 404).status).toBe('fail');
    });

    test('status es "error" para errores 5xx', () => {
        expect(new AppError('Error interno', 500).status).toBe('error');
        expect(new AppError('Servicio no disponible', 503).status).toBe('error');
    });

    test('isOperational siempre es true', () => {
        const error = new AppError('Test', 400);
        expect(error.isOperational).toBe(true);
    });

    test('es instancia de Error', () => {
        const error = new AppError('Test', 400);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
    });

    test('tiene stack trace', () => {
        const error = new AppError('Test', 400);
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('AppError');
    });
});
