# Issues del Módulo de Operaciones

Este documento registra los issues encontrados durante las pruebas para revisión posterior.

---

## ISSUE #1: Modal de Retorno - Lotes como unidades individuales
**Estado:** IMPLEMENTADO ✅
**Severidad:** Media
**Archivo afectado:** `inventario-frontend/src/components/operaciones/ModalRetornoElementos.jsx`

### Descripción
El modal de retorno trata los elementos de **lotes** como si fueran 1 sola unidad individual.

### Ejemplo
Si tengo un lote de 11 estacas asignadas a una orden, el modal debería:
- Mostrar las 11 estacas como un grupo
- Permitir marcar el estado de retorno para las 11 unidades
- Posiblemente permitir marcar estados diferentes si algunas vienen dañadas

### Comportamiento actual
~~Trata cada elemento de lote como cantidad = 1, independientemente de cuántas unidades tenga el lote.~~

### Solución implementada
Se creó un nuevo componente `ElementoLoteRetornoItem` que:
- Detecta automáticamente cuando un elemento es un lote con cantidad > 1
- Muestra 3 inputs numéricos para distribuir la cantidad: Buenos / Dañados / Perdidos
- Valida que la suma de las cantidades sea igual al total del lote
- Muestra advertencia visual si la suma no cuadra
- Incluye botón rápido "Todos OK" para resetear a todos buenos
- Las estadísticas del modal ahora cuentan unidades reales, no solo elementos
- **UX mejorada**: Al cambiar dañados/perdidos, buenos se auto-ajusta automáticamente

---

## ISSUE #2: Selector de elementos - Reemplazar con Orden de Cargue
**Estado:** IMPLEMENTADO ✅
**Severidad:** Media (UX)
**Archivos afectados:**
- `inventario-frontend/src/pages/OrdenDetallePage.jsx`
- `inventario-frontend/src/components/operaciones/ModalOrdenCargue.jsx`
- `backend/modules/operaciones/models/OrdenTrabajoModel.js`

### Descripción
Los checkboxes de selección de elementos no aportan al flujo de trabajo real. Los operadores necesitan saber QUÉ cargar, no marcar elemento por elemento.

### Solución implementada: "Orden de Cargue"
Modal que muestra:
- Lista de elementos con cantidades necesarias
- Agrupado por tipo de producto
- Lotes y series asignados del inventario real
- Un solo botón: **"Confirmar Cargue"**

### Correcciones aplicadas (2026-02-08)
- **Bug fix**: El "Resumen de Cargue" mostraba "-" porque usaba `alquiler_elementos` (vacío antes de salida)
- **Solución**: Ahora usa `orden_trabajo_elementos` que tiene los lotes/series asignados
- **Nuevo campo**: `elementos_cargue` en el backend que usa la fuente correcta según el estado

---

## ISSUE #3: Error "Duplicate entry" al ejecutar salida
**Estado:** CORREGIDO ✅
**Severidad:** Alta
**Archivo afectado:** `backend/modules/operaciones/services/SincronizacionAlquilerService.js`

### Descripción
Al ejecutar la salida, si un intento previo falló parcialmente, quedaban registros huérfanos en `alquiler_elementos` que causaban error de duplicate key.

### Error
```
Duplicate entry '6-13' for key 'alquiler_elementos.uk_alquiler_serie'
```

### Solución implementada
Se agregó limpieza de registros previos en `ejecutarSalida()` (líneas 702-713):
```javascript
// PASO 2.5: Limpiar registros previos en alquiler_elementos
const [deleteResult] = await connection.query(
  'DELETE FROM alquiler_elementos WHERE alquiler_id = ?',
  [alquilerId]
);
```

---

## ISSUE #4: Error "Unknown column 'cantidad_disponible'"
**Estado:** CORREGIDO ✅
**Severidad:** Alta
**Archivo afectado:** `backend/modules/operaciones/services/SincronizacionAlquilerService.js`

### Descripción
El servicio usaba `cantidad_disponible` pero la tabla `lotes` usa `cantidad`.

### Solución
Cambiados todos los UPDATE de lotes para usar `cantidad` en lugar de `cantidad_disponible`.

---

*Última actualización: 2026-02-08*
