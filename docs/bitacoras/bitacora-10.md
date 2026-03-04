# Bitácora de Trabajo de Grado - N° 10

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 7 de febrero de 2026 |
| **Periodo** | 7 de febrero – 20 de febrero de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 36 horas |

---

## Objetivo del Periodo

Corregir bugs críticos de stock, rediseñar la interfaz de inventario y realizar la reorganización completa del proyecto por módulos.

---

## Actividades Realizadas

1. **Corrección del bug de stock cero**:
   - Se identificó que las cotizaciones descontaban el stock al crearlas y nuevamente al confirmar el alquiler, provocando un doble descuento que dejaba productos con stock 0 cuando no debía.
   - Se corrigió el mapeo de disponibilidad por producto en el selector para que muestre valores correctos.
   - Pruebas exhaustivas del flujo completo: crear cotización → confirmar alquiler → verificar stock → devolver → verificar restauración de stock.

2. **Rediseño de la interfaz de inventario**:
   - Nueva interfaz del módulo de inventario con diseño más limpio y moderno.
   - Tarjetas de productos con mejor visualización de stock y estados.
   - Mejoras en la experiencia de usuario para navegación entre módulos.

3. **Reorganización completa del proyecto**:
   - **Backend**: Creación de 7 módulos independientes (auth, inventario, productos, alquileres, clientes, operaciones, configuracion), cada uno con su propia estructura de controllers/models/routes.
   - **Frontend**: Reorganización de 247 archivos en 9 módulos + shared, con cada módulo conteniendo sus propios api/, components/, hooks/ y pages/.
   - **Simplificación del servidor**: El `server.js` pasó de ~40 líneas de importación a una línea por módulo.
   - **Actualización de importaciones**: Todas las rutas de importación actualizadas para reflejar la nueva estructura modular.

4. **Resolución de conflictos post-reorganización**:
   - Corrección de rutas de importación de `ClienteModel` y `ConfiguracionModel` en controladores que quedaron con rutas antiguas.
   - Merge de conflictos entre la rama de reorganización y main.

---

## Resultados y Avances

- Bug crítico de doble descuento de stock corregido.
- Interfaz de inventario rediseñada con mejor UX.
- Proyecto completamente reorganizado en arquitectura modular:
  - 7 módulos backend con separación clara de responsabilidades.
  - 9 módulos frontend + shared con componentes reutilizables.
  - 261 endpoints API organizados por dominio.
- 3 PRs mergeados (#83, #84, #85).

---

## Dificultades Encontradas

- La reorganización de 247 archivos fue la tarea más compleja del proyecto. Cada archivo movido requería actualizar todas sus importaciones y las importaciones de los archivos que lo referenciaban.
- Algunos controladores seguían importando modelos con rutas relativas antiguas (`../../models/`) en lugar de las nuevas rutas modulares, causando errores en tiempo de ejecución.
- La resolución de conflictos de merge entre la rama de reorganización y main requirió cuidado para mantener los alias de importación consistentes.

---

## Resumen del Estado del Proyecto

Al cierre de esta bitácora, el sistema cuenta con:

| Métrica | Valor |
|---------|-------|
| **Archivos JS/JSX** | 319 |
| **Endpoints API** | 261 |
| **Componentes React** | 106 |
| **Hooks personalizados** | 36 |
| **Tablas de base de datos** | 31 |
| **Migraciones SQL** | 29 |
| **Commits totales** | 383+ |
| **Pull Requests** | 85 |

---

## Conclusiones Generales

El proyecto ha alcanzado un estado funcional completo, cubriendo todos los módulos planificados inicialmente:

- **Inventario**: Gestión completa de elementos con seguimiento dual (series y lotes).
- **Productos**: Categorías jerárquicas y elementos compuestos con alternativas.
- **Alquileres**: Cotizaciones con PDF, verificación de disponibilidad y calendario.
- **Operaciones**: Flujo completo de montaje/desmontaje con cronómetros en vivo.
- **Clientes**: Gestión de clientes con historial de eventos y repetición.
- **Configuración**: Ubicaciones, ciudades, tarifas y alertas.

La reorganización modular final asegura la mantenibilidad y escalabilidad del sistema a largo plazo.

---

## Plan Futuro

- Pruebas de integración end-to-end.
- Documentación técnica final para el trabajo de grado.
- Despliegue en ambiente de producción.
- Capacitación al usuario final.
