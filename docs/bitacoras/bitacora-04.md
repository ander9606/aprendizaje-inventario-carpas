# Bitácora de Trabajo de Grado - N° 04

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 15 de noviembre de 2025 |
| **Periodo** | 15 de noviembre – 28 de noviembre de 2025 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 28 horas |

---

## Objetivo del Periodo

Configurar el entorno de desarrollo completo y crear la estructura base del proyecto con las migraciones de base de datos.

---

## Actividades Realizadas

1. **Configuración del entorno de desarrollo**:
   - Inicialización del proyecto frontend con Vite + React + TailwindCSS.
   - Configuración del backend con Express y estructura de carpetas por módulos (controllers, models, routes).
   - Configuración de ESLint y reglas de estilo de código.
   - Configuración de variables de entorno para conexión a base de datos.

2. **Creación del sistema de migraciones**: Se implementó un sistema de migraciones SQL secuenciales para gestionar la evolución del esquema de base de datos de forma controlada y reproducible.

3. **Implementación de migraciones base**:
   - Migración de tablas de categorías con soporte de jerarquía (categoría padre).
   - Migración de elementos, series y lotes.
   - Migración de ubicaciones con tipos predefinidos (bodega, finca, salón, etc.).
   - Migración de elementos compuestos y sus componentes.

4. **Estructura del frontend**: Se creó la estructura base de la aplicación React con:
   - Sistema de enrutamiento con React Router.
   - Layout principal con navegación lateral.
   - Configuración de React Query para manejo de estado del servidor.

---

## Resultados y Avances

- Proyecto frontend funcional con navegación básica y layout responsivo.
- Backend con API base y conexión a MySQL configurada.
- 10 archivos de migración SQL creados y ejecutados correctamente.
- Repositorio Git configurado con ramas de desarrollo.

---

## Dificultades Encontradas

- La configuración de CORS entre frontend (puerto 5173) y backend (puerto 3000) requirió ajustes para permitir las peticiones cross-origin durante el desarrollo.
- Las migraciones debieron ser diseñadas como idempotentes (usando IF NOT EXISTS) para poder re-ejecutarse sin errores en diferentes entornos.

---

## Plan para el Siguiente Periodo

- Implementar el módulo de inventario: CRUD de elementos, series y lotes.
- Crear las interfaces de usuario para gestión de inventario.
- Implementar el sistema de categorías de productos.
