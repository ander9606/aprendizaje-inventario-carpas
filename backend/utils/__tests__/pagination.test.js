const {
    getPaginationParams,
    getPaginationMeta,
    getPaginatedResponse,
    getSQLLimit,
    shouldPaginate,
    getSortParams,
    getSearchPaginationParams
} = require('../pagination');

// ============================================
// getPaginationParams: extrae page/limit/offset del query
// ============================================
describe('getPaginationParams', () => {
    test('retorna defaults sin parámetros', () => {
        const result = getPaginationParams({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
    });

    test('parsea page y limit del query', () => {
        const result = getPaginationParams({ page: '3', limit: '10' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(20);
    });

    test('corrige page negativo a 1', () => {
        const result = getPaginationParams({ page: '-5' });
        expect(result.page).toBe(1);
    });

    test('limita limit al máximo (100)', () => {
        const result = getPaginationParams({ limit: '999' });
        expect(result.limit).toBe(100);
    });

    test('corrige limit < 1 al default', () => {
        const result = getPaginationParams({ limit: '0' });
        expect(result.limit).toBe(20);
    });
});

// ============================================
// getPaginationMeta: calcula totalPages, hasNext, hasPrevious
// ============================================
describe('getPaginationMeta', () => {
    test('calcula metadata correctamente', () => {
        const meta = getPaginationMeta(2, 20, 150);
        expect(meta.totalPages).toBe(8);       // ceil(150/20) = 8
        expect(meta.hasNextPage).toBe(true);
        expect(meta.hasPreviousPage).toBe(true);
        expect(meta.nextPage).toBe(3);
        expect(meta.previousPage).toBe(1);
    });

    test('primera página no tiene página anterior', () => {
        const meta = getPaginationMeta(1, 20, 100);
        expect(meta.hasPreviousPage).toBe(false);
        expect(meta.previousPage).toBeNull();
    });

    test('última página no tiene página siguiente', () => {
        const meta = getPaginationMeta(5, 20, 100);
        expect(meta.hasNextPage).toBe(false);
        expect(meta.nextPage).toBeNull();
    });

    test('total 0 resulta en 0 páginas', () => {
        const meta = getPaginationMeta(1, 20, 0);
        expect(meta.totalPages).toBe(0);
        expect(meta.hasNextPage).toBe(false);
    });
});

// ============================================
// getPaginatedResponse: estructura JSON final
// ============================================
describe('getPaginatedResponse', () => {
    test('genera respuesta con estructura correcta', () => {
        const data = [{ id: 1 }, { id: 2 }];
        const response = getPaginatedResponse(data, 1, 20, 2);

        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.total).toBe(2);
    });

    test('incluye datos adicionales', () => {
        const response = getPaginatedResponse([], 1, 20, 0, { filtros: 'activo' });
        expect(response.filtros).toBe('activo');
    });
});

// ============================================
// getSQLLimit: genera fragmento SQL seguro
// ============================================
describe('getSQLLimit', () => {
    test('genera LIMIT OFFSET correcto', () => {
        expect(getSQLLimit(20, 40)).toBe('LIMIT 20 OFFSET 40');
    });
});

// ============================================
// shouldPaginate: detecta si desactivar paginación
// ============================================
describe('shouldPaginate', () => {
    test('por defecto retorna true', () => {
        expect(shouldPaginate({})).toBe(true);
    });

    test('retorna false con paginate=false', () => {
        expect(shouldPaginate({ paginate: 'false' })).toBe(false);
    });

    test('retorna false con paginate=0', () => {
        expect(shouldPaginate({ paginate: '0' })).toBe(false);
    });
});

// ============================================
// getSortParams: extrae y sanitiza ordenamiento
// ============================================
describe('getSortParams', () => {
    test('retorna defaults sin parámetros', () => {
        const result = getSortParams({});
        expect(result.sortBy).toBe('id');
        expect(result.order).toBe('ASC');
    });

    test('acepta sortBy y order del query', () => {
        const result = getSortParams({ sortBy: 'nombre', order: 'desc' });
        expect(result.sortBy).toBe('nombre');
        expect(result.order).toBe('DESC');
    });

    test('sanitiza sortBy contra SQL injection', () => {
        const result = getSortParams({ sortBy: 'nombre; DROP TABLE--' });
        expect(result.sortBy).toBe('nombreDROPTABLE');
        expect(result.sortBy).not.toContain(';');
        expect(result.sortBy).not.toContain('-');
    });

    test('corrige order inválido al default', () => {
        const result = getSortParams({ order: 'INVALID' });
        expect(result.order).toBe('ASC');
    });

    test('genera orderSQL combinado', () => {
        const result = getSortParams({ sortBy: 'precio', order: 'desc' });
        expect(result.orderSQL).toBe('precio DESC');
    });
});

// ============================================
// getSearchPaginationParams: combina todo
// ============================================
describe('getSearchPaginationParams', () => {
    test('combina paginación, orden y búsqueda', () => {
        const result = getSearchPaginationParams({
            query: { page: '2', limit: '10', search: 'carpa', sortBy: 'nombre' },
            defaultSort: 'id'
        });

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(10);
        expect(result.search).toBe('carpa');
        expect(result.sortBy).toBe('nombre');
    });

    test('retorna null si no hay búsqueda', () => {
        const result = getSearchPaginationParams({ query: {} });
        expect(result.search).toBeNull();
    });
});
