# Bitácora de Trabajo de Grado - N° 05

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 29 de noviembre de 2025 |
| **Periodo** | 29 de noviembre – 12 de diciembre de 2025 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 30 horas |

---

## Objetivo del Periodo

Implementar el módulo de inventario completo con gestión de elementos, series, lotes y categorías.

---

## Actividades Realizadas

1. **Módulo de Inventario - Backend**:
   - Implementación de controladores CRUD para elementos, series y lotes.
   - Creación de modelos con consultas SQL para cada entidad.
   - Endpoints para obtener elementos con sus series/lotes asociados.
   - Validación de datos de entrada en las rutas.

2. **Módulo de Inventario - Frontend**:
   - Página principal de inventario con listado de elementos en tarjetas.
   - Formularios modales para crear y editar elementos.
   - Vista de detalle de elemento con tabs para series y lotes.
   - Formularios para agregar series (con número de serie único) y lotes (con cantidad y ubicación).

3. **Sistema de categorías**:
   - CRUD completo de categorías de productos.
   - Selector de iconos (emojis y Lucide icons) para identificación visual de categorías.
   - Tarjetas de categoría con opciones de editar y eliminar.

4. **Gestión de ubicaciones**:
   - Módulo de ubicaciones accesible desde el dashboard.
   - Funcionalidad de ubicación principal (bodega base).
   - Tipos de ubicación predefinidos: bodega, finca, salón, hotel, hacienda, club, etc.

---

## Resultados y Avances

- Módulo de inventario completamente funcional con CRUD de elementos, series y lotes.
- 4 vistas principales implementadas: dashboard, lista de elementos, detalle de elemento, gestión de ubicaciones.
- Sistema de categorías con soporte visual de iconos.
- Buscador global integrado en el módulo de inventario.

---

## Dificultades Encontradas

- El renderizado de tarjetas con valor 0 (cero) en React mostraba el número en pantalla en lugar de estar oculto. Se debió a la evaluación de expresiones condicionales con `&&` que tratan el 0 como falsy pero lo renderizan.
- La invalidación de queries de React Query al eliminar categorías no funcionaba correctamente, requiriendo ajustes en las keys de caché.
- La integración del selector de ubicaciones en los formularios de series tuvo problemas con valores null/undefined que debieron manejarse.

---

## Plan para el Siguiente Periodo

- Implementar el módulo de elementos compuestos (plantillas).
- Comenzar el módulo de alquileres con cotizaciones.
- Implementar la reorganización del backend en módulos separados.
