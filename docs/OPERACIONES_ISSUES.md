# Issues del Módulo de Operaciones

Este documento registra los issues encontrados durante las pruebas para revisión posterior.

---

## ISSUE #1: Modal de Retorno - Lotes como unidades individuales
**Estado:** Pendiente
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
Trata cada elemento de lote como cantidad = 1, independientemente de cuántas unidades tenga el lote.

### Solución propuesta
Revisar cómo se obtienen y muestran los elementos en `ModalRetornoElementos.jsx`. Debe considerar:
- `elem.cantidad` para mostrar la cantidad real del lote
- Permitir dividir el retorno si hay diferentes estados (ej: 9 buenas, 2 dañadas)

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
