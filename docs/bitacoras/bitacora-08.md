# Bitácora de Trabajo de Grado - N° 08

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 10 de enero de 2026 |
| **Periodo** | 10 de enero – 23 de enero de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 32 horas |

---

## Objetivo del Periodo

Implementar el módulo de operaciones con órdenes de trabajo, agregar soporte de imágenes y mejorar la gestión de cotizaciones.

---

## Actividades Realizadas

1. **Módulo de operaciones**:
   - Implementación del flujo completo de operaciones: cargue → montaje → desmontaje → retorno → descargue.
   - Órdenes de trabajo con asignación de empleados y vehículos.
   - Historial de estados por orden de trabajo.
   - Checklists de cargue y descargue para verificación de equipos.

2. **Soporte de imágenes**:
   - Upload de imágenes para elementos y productos de alquiler usando Multer.
   - Visualización de fotos en modal durante el proceso de cargue para verificación visual.
   - Almacenamiento de imágenes en el servidor con rutas relativas.

3. **Mejoras en cotizaciones**:
   - Fechas de montaje y desmontaje como campos independientes en la cotización.
   - Contexto de alquiler visible en series y lotes (saber qué está alquilado y para qué evento).
   - Corrección de módulos de edición de series y lotes.

4. **Auto-generación de lotes**:
   - Número de lote generado automáticamente basado en la fecha de creación.
   - Rediseño de la página de detalle de elemento con stat cards como filtros interactivos.
   - Mejora del layout para desktop.
   - Unificación del estado 'nuevo' dentro de 'bueno' para simplificar el flujo.

5. **Limpieza y mantenimiento**:
   - Script SQL para limpiar datos de prueba de la base de datos.
   - Corrección de subtotal de cotización que no incluía recargos por adelanto/extensión.
   - Migración 27 hecha idempotente para compatibilidad.

---

## Resultados y Avances

- Módulo de operaciones funcional con flujo completo de 5 etapas.
- Soporte de imágenes implementado para elementos y productos.
- Auto-generación de números de lote.
- Rediseño de la vista de detalle de elemento.
- 8 PRs mergeados (#60 a #67).

---

## Dificultades Encontradas

- El envío del campo `cantidad` al crear elementos no se estaba realizando correctamente, causando que los elementos se crearan sin stock inicial.
- Los iconos SVG no se renderizaban correctamente en algunos componentes; se debió crear un componente `IconoCategoria` reutilizable.
- Las tablas inexistentes en el script de limpieza generaban errores que debieron manejarse con `IF EXISTS`.

---

## Plan para el Siguiente Periodo

- Implementar cronómetros en tiempo real para operaciones de montaje/desmontaje.
- Agregar gestión de depósitos en cotizaciones.
- Implementar historial de eventos por cliente.
