# Issues del Módulo de Operaciones

Este documento registra los issues encontrados durante las pruebas para revisión posterior.

---

## ISSUE #1: Modal de Retorno - Lotes como unidades individuales
**Estado:** IMPLEMENTADO
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

---

## ISSUE #2: Selector de elementos - Reemplazar con Orden de Cargue
**Estado:** IMPLEMENTADO
**Severidad:** Media (UX)
**Archivos afectados:**
- `inventario-frontend/src/pages/OrdenDetallePage.jsx`
- Nuevo: `ModalOrdenCargue.jsx`

### Descripción
Los checkboxes de selección de elementos no aportan al flujo de trabajo real. Los operadores necesitan saber QUÉ cargar, no marcar elemento por elemento.

### Solución acordada: "Orden de Cargue"
Crear un documento/modal que muestre:
- Lista de elementos con cantidades necesarias
- Agrupado por tipo de producto
- Un solo botón: **"Revisado y Cargado"**

### Flujo propuesto
```
1. Operador abre "Ver Orden de Cargue"
2. Ve la lista completa:
   - Carpa 6x12: 1 unidad (Serie: ABC-001)
   - Estacas 1m: 11 unidades (Lote: 001)
   - Postes perimetrales: 10 unidades (Lote: 001)
   - etc.
3. Revisa físicamente que todo esté en el camión
4. Presiona "Confirmar Cargue"
5. Sistema marca TODOS los elementos como "cargado"
```

### Cambios a realizar
1. **Eliminar**: Checkboxes de selección individual en tabla de elementos
2. **Eliminar**: Barra flotante de acciones masivas
3. **Crear**: `ModalOrdenCargue.jsx` con lista de elementos y botón de confirmación
4. **Agregar**: Botón "Ver Orden de Cargue" en estado `en_preparacion`
5. **Opcional**: Permitir imprimir/exportar la orden de cargue

### Beneficios
- Más simple para el operador
- Flujo más natural (revisar lista → confirmar)
- Menos clics
- Posibilidad de imprimir para llevar al almacén

---

*Última actualización: 2026-02-07*
