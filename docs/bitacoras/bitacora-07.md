# Bitácora de Trabajo de Grado - N° 07

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 27 de diciembre de 2025 |
| **Periodo** | 27 de diciembre de 2025 – 9 de enero de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 38 horas |

---

## Objetivo del Periodo

Implementar el módulo de cotizaciones con vista previa estilo PDF, integrar tarifas de transporte y agregar el sistema de calendario.

---

## Actividades Realizadas

1. **Módulo de cotizaciones**:
   - Implementación completa del flujo de cotizaciones: creación, edición, vista previa y generación PDF.
   - Vista previa estilo PDF integrada en la interfaz web.
   - Menú kebab (3 puntos) para acciones rápidas en cada cotización.
   - Separación de hooks de cotizaciones en archivos individuales para mejor mantenibilidad.
   - Botones simplificados en la vista PDF.

2. **Tarifas de transporte**:
   - Tabla maestra de ciudades como entidad independiente.
   - Integración de tarifas de transporte en el formulario de ciudades.
   - Migración completa a `ciudad_id` como clave foránea.
   - Eliminación del módulo redundante de tarifas que estaba duplicado.

3. **Sistema de calendario**:
   - Integración de FullCalendar con vistas de día, semana, mes y lista.
   - Arquitectura modular del calendario para reutilización.
   - Corrección de variables no utilizadas y warnings de ESLint.
   - Modal resumen con productos al hacer clic en un evento del calendario.

4. **Disponibilidad en tiempo real**:
   - Sistema de verificación de disponibilidad de productos por rango de fechas.
   - Debounce en llamadas API para evitar múltiples peticiones simultáneas.
   - Uso de cantidad de tabla elementos como fallback cuando no hay series.

5. **Mejoras generales**:
   - Navegación jerárquica por niveles en productos.
   - Categorías jerárquicas con padre/hijo.
   - Selector de productos con búsqueda y filtrado por categorías.

---

## Resultados y Avances

- Módulo de cotizaciones completo con generación de PDF.
- Sistema de calendario integrado con FullCalendar.
- Verificación de disponibilidad funcionando en tiempo real.
- 12 PRs mergeados (#47 a #59).
- Refactorización de la navegación con categorías jerárquicas.

---

## Dificultades Encontradas

- Las múltiples llamadas a la API de disponibilidad causaban problemas de rendimiento. Se implementó debounce y se deshabilitaron retries en mutaciones.
- La migración a `ciudad_id` requirió un script de migración cuidadoso para no perder datos existentes.
- La corrección del nombre de columna `id_elemento` en consultas de series generó errores que se detectaron tardíamente.
- La compatibilidad con MySQL safe mode requirió ajustes en las migraciones para evitar `UPDATE` sin `WHERE`.

---

## Plan para el Siguiente Periodo

- Implementar fechas de montaje/desmontaje en cotizaciones.
- Crear el módulo de operaciones con órdenes de trabajo.
- Agregar soporte de imágenes para elementos.
