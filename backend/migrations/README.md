# Migraciones de Base de Datos

Este directorio contiene scripts de migración para optimizar la base de datos.

## Migración Disponible

### `add_indexes.sql` - Índices de Performance

Agrega 29 índices optimizados a las tablas principales para mejorar el rendimiento de consultas.

## Cómo Ejecutar

### Opción 1: Usando Node.js (Recomendado)

```bash
node migrations/run_migration.js
```

**Ventajas:**
- ✅ Maneja errores automáticamente
- ✅ Muestra progreso en tiempo real
- ✅ Skip automático de índices existentes
- ✅ Actualiza estadísticas de tablas

### Opción 2: Usando MySQL CLI

```bash
mysql -u root -p aprendizaje_inventario < migrations/add_indexes.sql
```

**Nota:** Esta opción puede mostrar warnings si los índices ya existen.

## Índices Creados

### Categorías (3 índices)
- `idx_categorias_padre_id` - Búsquedas de subcategorías
- `idx_categorias_nombre` - Búsquedas por nombre
- `idx_categorias_padre_nombre` - Queries complejas

### Elementos (6 índices)
- `idx_elementos_categoria` - Filtros por categoría
- `idx_elementos_material` - Filtros por material
- `idx_elementos_unidad` - Filtros por unidad
- `idx_elementos_nombre` - Búsquedas por nombre
- `idx_elementos_requiere_series` - Filtros por tipo
- `idx_elementos_categoria_nombre` - Queries complejas

### Series (6 índices)
- `idx_series_elemento` - **CRÍTICO** - Query más frecuente
- `idx_series_ubicacion` - Filtros por ubicación
- `idx_series_estado` - Filtros por estado
- `idx_series_numero` - Búsquedas por número
- `idx_series_elemento_estado` - Inventario
- `idx_series_elemento_ubicacion` - Queries complejas

### Lotes (6 índices)
- `idx_lotes_elemento` - **CRÍTICO** - Query más frecuente
- `idx_lotes_estado` - Filtros por estado
- `idx_lotes_ubicacion` - Filtros por ubicación
- `idx_lotes_numero` - Búsquedas por número
- `idx_lotes_elemento_estado` - Inventario
- `idx_lotes_elemento_estado_ubicacion` - Queries específicas

### Ubicaciones (3 índices)
- `idx_ubicaciones_tipo` - Filtros por tipo
- `idx_ubicaciones_nombre` - Búsquedas por nombre
- `idx_ubicaciones_activo` - Filtros activo/inactivo

### Materiales (1 índice)
- `idx_materiales_nombre` - Búsquedas por nombre

### Unidades (2 índices)
- `idx_unidades_nombre` - Búsquedas por nombre
- `idx_unidades_abreviatura` - Búsquedas por abreviatura

## Mejoras de Performance Esperadas

| Tipo de Query | Mejora Esperada |
|---------------|----------------|
| Búsquedas por Foreign Key | 50-90% más rápido |
| Búsquedas por Nombre | 70-95% más rápido |
| Consultas JOIN | 40-80% más rápido |
| Ordenamiento | 30-60% más rápido |

## Trade-offs

### Ventajas
- ✅ Consultas SELECT mucho más rápidas
- ✅ JOINs más eficientes
- ✅ Mejor experiencia de usuario

### Desventajas
- ⚠️ INSERT/UPDATE/DELETE: ~5-15% más lentos
- ⚠️ Espacio en disco: +10-20%

**Para este sistema (más lecturas que escrituras), el beneficio supera el costo.**

## Verificar Índices

### Ver todos los índices de una tabla

```sql
SHOW INDEX FROM categorias;
```

### Ver tamaño de índices

```sql
SELECT
    table_name,
    index_name,
    ROUND(((index_length) / 1024 / 1024), 2) AS index_size_mb
FROM information_schema.TABLES
WHERE table_schema = 'aprendizaje_inventario'
ORDER BY index_length DESC;
```

## Rollback (Eliminar Índices)

Si necesitas eliminar los índices:

```sql
-- Ejemplo para categorias
DROP INDEX idx_categorias_padre_id ON categorias;
DROP INDEX idx_categorias_nombre ON categorias;
-- etc...
```

## Notas Importantes

1. **Seguridad**: Esta migración es segura y no modifica datos
2. **Reversible**: Los índices se pueden eliminar en cualquier momento
3. **Tiempo**: La ejecución toma ~5-30 segundos dependiendo del tamaño de la BD
4. **Sin downtime**: Se puede ejecutar con la aplicación corriendo
5. **Idempotente**: Se puede ejecutar múltiples veces sin problemas

## Próximas Migraciones

Futuras migraciones podrían incluir:
- Particionamiento de tablas grandes
- Índices FULLTEXT para búsquedas de texto
- Índices espaciales si se agregan coordenadas GPS
- Índices de hash para búsquedas exactas
