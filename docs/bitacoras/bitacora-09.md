# Bitácora de Trabajo de Grado - N° 09

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 24 de enero de 2026 |
| **Periodo** | 24 de enero – 6 de febrero de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 34 horas |

---

## Objetivo del Periodo

Implementar funcionalidades avanzadas: cronómetros en vivo, gestión de depósitos, historial de eventos por cliente y funcionalidad de repetir eventos.

---

## Actividades Realizadas

1. **Cronómetros en tiempo real**:
   - Implementación de temporizadores en vivo para operaciones de montaje y desmontaje.
   - Los cronómetros inician cuando se cambia el estado de la orden de trabajo y se detienen al finalizar.
   - Modales de confirmación estilizados para cambios de estado.
   - Auto-creación de la tabla `orden_trabajo_historial_estados` para soportar el cronómetro.

2. **Gestión de depósitos**:
   - Campo de valor de depósito agregado a las cotizaciones.
   - Toggle de cobro de depósito (cobrar o no cobrar).
   - Uso de valores del backend (resumen) en vez de recalcular subtotales en la vista previa.
   - Botón "Ver PDF" integrado en la cotización.
   - Corrección del error `cobrar_deposito` que fallaba por tipo de dato incorrecto.

3. **Historial de eventos por cliente**:
   - Nueva página de eventos completados con historial de productos alquilados.
   - Filtro para mostrar solo eventos activos en la lista de cotizaciones.
   - Visualización de productos alquilados y cantidades en el historial.
   - Corrección de nombres de columnas en la consulta de historial de productos.

4. **Funcionalidad de repetir evento**:
   - Botón "Repetir evento" que crea una nueva cotización con los mismos productos.
   - Modal de formulario con campos de fecha resaltados para indicar que deben cambiarse.
   - Auto-creación de la cotización con los mismos productos y cantidades.
   - Conversión de valores `DECIMAL` de MySQL a números en JavaScript para evitar errores de tipo.

5. **Mejoras en operaciones**:
   - Etapas `en_retorno` y `descargue` agregadas al flujo de desmontaje.
   - Renombre de "Checklist de Descargue" a "Recogida" y nuevo "Checklist en Bodega".
   - Mejora de temporizadores para montaje y desmontaje.

---

## Resultados y Avances

- Cronómetros en tiempo real funcionando para montaje y desmontaje.
- Sistema de depósitos integrado en cotizaciones.
- Historial completo de eventos por cliente con opción de repetir.
- Flujo de desmontaje ampliado con 2 nuevas etapas.
- 6 PRs mergeados (#77 a #82).

---

## Dificultades Encontradas

- Los hooks de contexto nunca se ejecutaban debido a una comparación estricta (`===`) con booleanos de MySQL, que devuelve `0` y `1` en lugar de `true` y `false`. Se solucionó convirtiendo explícitamente a booleano.
- El valor `requiere_series` sin convertir a booleano provocaba que se renderizara un `0` en pantalla.
- La consulta de checklist hacía referencia a una columna `el.compuesto_id` que no existía en la tabla, causando errores SQL.
- El stock en alquileres mostraba valores incorrectos porque se descontaba doblemente: una vez al crear la cotización y otra al confirmar el alquiler.

---

## Plan para el Siguiente Periodo

- Corregir el bug de stock cero en cotizaciones.
- Rediseñar la interfaz del módulo de inventario.
- Reorganizar la estructura completa del frontend y backend por módulos.
