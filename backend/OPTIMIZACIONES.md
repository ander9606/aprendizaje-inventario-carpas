# Optimizaciones de Performance - Fase 3

Este documento describe las optimizaciones de performance implementadas en la Fase 3.

## 📋 Resumen

- ✅ **29 índices de base de datos** para queries más rápidas
- ✅ **Sistema de paginación** flexible y opcional
- ✅ **Helpers reutilizables** para paginación consistente
- ✅ **100% retrocompatible** - No rompe código existente

---

## 1. Índices de Base de Datos

### Ejecutar Migración

```bash
# Opción 1: Script Node.js (Recomendado)
node migrations/run_migration.js

# Opción 2: MySQL CLI
mysql -u root -p aprendizaje_inventario < migrations/add_indexes.sql
```

### Índices Creados

**29 índices** optimizados para:
- Búsquedas por foreign keys (elemento_id, categoria_id, etc.)
- Búsquedas por nombre
- Filtros por estado y ubicación
- Queries complejos con JOINs
- Ordenamiento

### Mejoras Esperadas

| Tipo de Query | Mejora |
|---------------|--------|
| Búsquedas por Foreign Key | 50-90% más rápido |
| Búsquedas por Nombre | 70-95% más rápido |
| Consultas JOIN | 40-80% más rápido |
| Ordenamiento | 30-60% más rápido |

### Trade-offs

- **Ventaja**: SELECT mucho más rápidos (donde pasa el 90% del tiempo)
- **Desventaja**: INSERT/UPDATE ~5-15% más lentos (actualizar índices)
- **Desventaja**: +10-20% espacio en disco

**Para este sistema (más lecturas que escrituras), el beneficio supera el costo.**

---

## 2. Sistema de Paginación

### Uso Básico

#### Sin Paginación (Retrocompatible)

```javascript
GET /api/categorias

// Respuesta
{
  "success": true,
  "data": [...], // Todas las categorías
  "total": 50
}
```

#### Con Paginación

```javascript
GET /api/categorias?page=1&limit=20

// Respuesta
{
  "success": true,
  "data": [...], // 20 categorías
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

### Parámetros de Query

| Parámetro | Descripción | Default | Ejemplo |
|-----------|-------------|---------|---------|
| `page` | Página actual | 1 | `?page=2` |
| `limit` | Elementos por página | 20 | `?limit=50` |
| `sortBy` | Campo de ordenamiento | 'nombre' | `?sortBy=id` |
| `order` | Orden ASC/DESC | 'ASC' | `?order=DESC` |
| `search` | Término de búsqueda | null | `?search=carpa` |
| `paginate` | Forzar sin paginación | true | `?paginate=false` |

### Ejemplos de Uso

```javascript
// Página 2, 10 elementos por página
GET /api/categorias?page=2&limit=10

// Ordenar por fecha de creación descendente
GET /api/categorias?sortBy=created_at&order=DESC&page=1&limit=20

// Búsqueda con paginación
GET /api/categorias?search=carpa&page=1&limit=10

// Búsqueda SIN paginación (retrocompatible)
GET /api/categorias?search=carpa&paginate=false

// Combinación completa
GET /api/categorias?page=1&limit=25&sortBy=nombre&order=ASC&search=tent
```

---

## 3. Helpers de Paginación

### `pagination.js`

Ubicación: `backend/utils/pagination.js`

#### Funciones Disponibles

##### `getPaginationParams(query)`

Extrae y valida parámetros de paginación del query string.

```javascript
const { getPaginationParams } = require('../utils/pagination');

const { page, limit, offset } = getPaginationParams(req.query);
// page: 2, limit: 20, offset: 20
```

##### `getPaginatedResponse(data, page, limit, total, additionalData)`

Genera respuesta paginada consistente.

```javascript
const { getPaginatedResponse } = require('../utils/pagination');

const categorias = await CategoriaModel.obtenerConPaginacion({ limit, offset });
const total = await CategoriaModel.contarTodas();

res.json(getPaginatedResponse(categorias, page, limit, total));
```

##### `shouldPaginate(query)`

Verifica si se debe aplicar paginación.

```javascript
const { shouldPaginate } = require('../utils/pagination');

if (shouldPaginate(req.query)) {
  // Aplicar paginación
} else {
  // Sin paginación
}
```

##### `getSortParams(query, defaultSort, defaultOrder)`

Extrae parámetros de ordenamiento.

```javascript
const { getSortParams } = require('../utils/pagination');

const { sortBy, order, orderSQL } = getSortParams(req.query, 'nombre');
// sortBy: 'nombre', order: 'ASC', orderSQL: 'nombre ASC'
```

##### `getSearchPaginationParams(options)`

Combina búsqueda, paginación y ordenamiento.

```javascript
const { getSearchPaginationParams } = require('../utils/pagination');

const params = getSearchPaginationParams({
  query: req.query,
  defaultSort: 'nombre',
  searchField: 'nombre'
});
// { page, limit, offset, sortBy, order, search, searchField }
```

---

## 4. Implementar en Otros Controladores

### Paso 1: Agregar Métodos al Modelo

```javascript
// ejemplo: ElementoModel.js

const { pool } = require('../config/database');

class ElementoModel {
  // ... métodos existentes ...

  /**
   * Obtiene elementos con paginación
   */
  static async obtenerConPaginacion({ limit = 20, offset = 0, sortBy = 'nombre', order = 'ASC', search = null }) {
    let query = `
      SELECT e.*, c.nombre AS categoria_nombre
      FROM elementos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
    `;

    const params = [];

    // Búsqueda
    if (search) {
      query += ' WHERE e.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    // Ordenamiento
    const validSortFields = ['nombre', 'id', 'created_at', 'cantidad'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'nombre';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY e.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Cuenta total de elementos
   */
  static async contarTodos(search = null) {
    let query = 'SELECT COUNT(*) AS total FROM elementos';
    const params = [];

    if (search) {
      query += ' WHERE nombre LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }
}

module.exports = ElementoModel;
```

### Paso 2: Actualizar Controlador

```javascript
// ejemplo: elementoController.js

const ElementoModel = require('../models/ElementoModel');
const { getPaginationParams, getPaginatedResponse, shouldPaginate, getSortParams } = require('../utils/pagination');

exports.obtenerTodos = async (req, res, next) => {
  try {
    if (shouldPaginate(req.query) && (req.query.page || req.query.limit)) {
      // CON PAGINACIÓN
      const { page, limit, offset } = getPaginationParams(req.query);
      const { sortBy, order } = getSortParams(req.query, 'nombre');
      const search = req.query.search || null;

      const elementos = await ElementoModel.obtenerConPaginacion({
        limit, offset, sortBy, order, search
      });
      const total = await ElementoModel.contarTodos(search);

      res.json(getPaginatedResponse(elementos, page, limit, total));
    } else {
      // SIN PAGINACIÓN (retrocompatible)
      const elementos = await ElementoModel.obtenerTodos();

      res.json({
        success: true,
        data: elementos,
        total: elementos.length
      });
    }
  } catch (error) {
    next(error);
  }
};
```

---

## 5. Limitaciones y Configuración

### Límites por Defecto

Definidos en `backend/config/constants.js`:

```javascript
PAGINACION: {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100  // Máximo permitido
}
```

### Cambiar Límites

Editar `backend/config/constants.js`:

```javascript
module.exports = {
  // ...
  PAGINACION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,  // ← Cambiar default
    MAX_LIMIT: 200      // ← Cambiar máximo
  }
};
```

---

## 6. Performance Tips

### Usar Índices Correctamente

✅ **BUENO**: Filtrar por campos indexados
```sql
WHERE elemento_id = 123  -- Usa idx_series_elemento
```

❌ **MALO**: Filtrar por campos sin índice
```sql
WHERE descripcion LIKE '%texto%'  -- No hay índice
```

### Paginación en Tablas Grandes

✅ **BUENO**: Siempre paginar tablas > 1000 registros
```javascript
GET /api/series?page=1&limit=50  // Carga 50, no 10,000
```

❌ **MALO**: Cargar todo sin paginación
```javascript
GET /api/series  // Carga TODO en memoria
```

### Ordenamiento Eficiente

✅ **BUENO**: Ordenar por campos indexados
```javascript
GET /api/elementos?sortBy=nombre&order=ASC  // Usa índice
```

❌ **MALO**: Ordenar por campos calculados
```javascript
// No hacer esto sin índice
ORDER BY (cantidad * precio)
```

### Búsquedas Eficientes

✅ **BUENO**: Búsquedas prefijo (usa índice)
```sql
WHERE nombre LIKE 'carpa%'  -- Puede usar índice
```

⚠️ **REGULAR**: Búsquedas contiene (más lento)
```sql
WHERE nombre LIKE '%carpa%'  -- No usa índice eficientemente
```

❌ **MALO**: Búsquedas en múltiples campos sin índice
```sql
WHERE descripcion LIKE '%carpa%' OR notas LIKE '%carpa%'
```

---

## 7. Monitoreo de Performance

### Ver Queries Lentas

```sql
-- Activar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Queries > 1 segundo

-- Ver queries lentas
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

### Analizar Queries

```sql
-- Explicar plan de ejecución
EXPLAIN SELECT * FROM series WHERE elemento_id = 123;

-- Ver si usa índice
-- Buscar "Using index" en la columna Extra
```

### Estadísticas de Índices

```sql
-- Ver uso de índices
SHOW INDEX FROM series;

-- Ver tamaño de índices
SELECT
  table_name,
  index_name,
  ROUND(((index_length) / 1024 / 1024), 2) AS index_size_mb
FROM information_schema.TABLES
WHERE table_schema = 'aprendizaje_inventario'
ORDER BY index_length DESC;
```

---

## 8. Próximos Pasos

### Optimizaciones Adicionales (Futuras)

1. **Caché de Redis**
   - Cachear categorías (cambian poco)
   - TTL de 1 hora

2. **Índices FULLTEXT**
   - Para búsquedas de texto complejo
   - En campos descripcion, notas

3. **Particionamiento**
   - Tablas muy grandes (>1M registros)
   - Por fecha o rango de IDs

4. **Query Optimization**
   - Revisar y optimizar queries N+1
   - Usar WITH RECURSIVE para árboles
   - Materializar vistas frecuentes

5. **Database Replication**
   - Separar lecturas y escrituras
   - Master-Slave setup

---

## 9. Troubleshooting

### "No se ven mejoras de performance"

1. **Verificar que se ejecutó la migración**
   ```sql
   SHOW INDEX FROM series;
   ```

2. **Actualizar estadísticas**
   ```sql
   ANALYZE TABLE series;
   ```

3. **Verificar que queries usan índices**
   ```sql
   EXPLAIN SELECT * FROM series WHERE elemento_id = 123;
   ```

### "La paginación no funciona"

1. **Verificar que se pasan parámetros**
   ```
   GET /api/categorias?page=1&limit=20
   ```

2. **Verificar logs del servidor**
   ```
   [DEBUG] categoriaController.obtenerTodas Modo paginado
   ```

3. **Verificar que el modelo tiene los métodos**
   ```javascript
   CategoriaModel.obtenerConPaginacion
   CategoriaModel.contarTodas
   ```

### "Error: Too many connections"

Aumentar pool de conexiones en `backend/config/database.js`:

```javascript
const pool = mysql.createPool({
  // ...
  connectionLimit: 20,  // Aumentar de 10 a 20
});
```

---

## 📚 Referencias

- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Indexing Best Practices](https://use-the-index-luke.com/)
- [Pagination Patterns](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/)

---

¿Preguntas? Revisar logs en `backend/logs/` o consultar la documentación de cada helper.
