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

## ISSUE #2: Selector de elementos - Propósito no claro
**Estado:** En evaluación
**Severidad:** Baja (UX)
**Archivo afectado:** `inventario-frontend/src/pages/OrdenDetallePage.jsx`

### Descripción
Los checkboxes de selección de elementos no aportan mucho al flujo de trabajo actual.

### Contexto
Se implementó la selección masiva de elementos para cambiar estados rápidamente (pendiente → preparado → cargado → instalado → retornado).

### Preguntas a responder
1. ¿Es útil cambiar estados de múltiples elementos a la vez?
2. ¿El flujo de trabajo real requiere marcar elementos individualmente?
3. ¿Los estados de elementos se actualizan automáticamente con las acciones principales? (ej: Ejecutar Salida debería marcar todos como "despachados")

### Opciones
- **A) Mantener:** Útil para operadores que preparan físicamente elementos uno por uno
- **B) Simplificar:** Cambiar estados automáticamente con las acciones de la orden
- **C) Remover:** Si no aporta valor al flujo, eliminar los checkboxes

### Flujo esperado actual de estados de elementos:
```
Orden Montaje:
  pendiente → preparado (manual/auto) → cargado (Ejecutar Salida) → instalado (en_proceso) → retornado (desmontaje)

Orden Desmontaje:
  instalado → desmontado → retornado (Modal Retorno)
```

---

## Notas adicionales

### Preguntas para el usuario
1. ¿Cómo es el flujo real cuando se preparan los elementos en el almacén?
2. ¿Los operadores marcan cada elemento individualmente o todo de una vez?
3. ¿Hay casos donde se necesita marcar "este elemento está preparado pero este otro no"?

---

*Última actualización: 2026-02-07*
