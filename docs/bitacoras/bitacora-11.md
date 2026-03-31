# Bitácora de Trabajo de Grado - N° 11

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 21 de febrero de 2026 |
| **Periodo** | 21 de febrero – 14 de marzo de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 40 horas |

---

## Objetivo del Periodo

Implementar nuevas funcionalidades de cotizaciones y operaciones, rediseñar la interfaz para tablets, crear la suite completa de pruebas unitarias y realizar una auditoría de seguridad y calidad del código.

---

## Actividades Realizadas

1. **Descuentos por producto en cotizaciones**:
   - Se implementó un descuento porcentual individual por producto dentro de las cotizaciones.
   - Se muestra al cliente el precio original tachado junto al precio con descuento aplicado.
   - Se corrigió la verificación de disponibilidad de stock que mostraba valores en 0 por un import faltante.

2. **Wizard de cotizaciones en 4 pasos**:
   - Se rediseñó el formulario de cotización como un wizard de 4 pasos: datos del evento, selección de productos, transporte y resumen.
   - Layout de dos paneles en el paso de productos para mejor visualización.
   - Se movió el selector de ciudad y dirección del Paso 1 al Paso 3 (Transporte) para mayor coherencia.
   - Se agregó la visualización de direcciones anteriores del cliente en el formulario.

3. **Rediseño visual del módulo de inventario**:
   - Nueva interfaz del listado de inventario con modal de Ver Estados y barra de disponibilidad.
   - Rediseño de ElementoDetallePage con stats mejorados y diseño basado en mockup REDISENO.pen.
   - Grid de 3 columnas en categorías/subcategorías, toggle de vista lista/tarjetas.

4. **Rediseño tablet-first de toda la aplicación**:
   - Interfaz optimizada para tablets como dispositivo principal de uso en campo.
   - Fotos operacionales por etapa para órdenes de trabajo (cargue, llegada, montaje, desmontaje, retorno).
   - Firma digital del cliente con compartir por WhatsApp.
   - Sistema de reporte de incidencias en campo (novedades) en 4 vistas.
   - Acciones operacionales movidas arriba de la info del cliente con sección colapsable.

5. **Mejoras al módulo de transporte y ubicaciones**:
   - Catálogo de departamentos de Colombia pre-poblado (33 departamentos).
   - Gestión de direcciones por ciudad y vinculación de cotizaciones con ubicaciones del catálogo.
   - Rediseño de UbicacionesPage con dos secciones y navegación cruzada.
   - Sugerencia de guardar dirección manual como ubicación frecuente.

6. **Sistema de auto-registro de empleados**:
   - Formulario público de solicitud de acceso con selección de rol deseado.
   - Panel de aprobación para el administrador con contador de solicitudes pendientes.

7. **Suite completa de pruebas unitarias (812 tests)**:
   - **Backend (Jest)**: 56 tests de auth, 177 de inventario, 150 de alquileres, 63 de clientes, 63 de productos, 126 de operaciones, 27 de configuración. Cobertura 100% en CategoriaModel y ElementoModel.
   - **Frontend (Vitest)**: 70 tests para utilidades compartidas.
   - Configuración de Jest y Vitest como herramientas de desarrollo.

8. **Auditoría de seguridad y refactoring**:
   - Eliminación de credenciales expuestas y secretos hardcodeados.
   - Autenticación requerida en todas las rutas API.
   - Prevención de path traversal en eliminación de logos.
   - Estandarización del campo de respuesta 'mensaje' a 'message'.
   - Extracción de BaseModel y crudController para reducir código duplicado.
   - Lazy loading en todas las páginas del router.

---

## Resultados y Avances

- Wizard de cotizaciones de 4 pasos funcional con descuentos por producto.
- Interfaz tablet-first desplegada en todos los módulos operativos.
- Sistema de fotos, firma digital y novedades en operaciones de campo.
- 812 pruebas unitarias cubriendo todos los módulos backend y utilidades frontend.
- Auditoría de seguridad completada con vulnerabilidades corregidas.
- 15 PRs mergeados (#86–#100).

---

## Dificultades Encontradas

- La migración de descuentos por producto requirió un procedimiento SQL temporal para compatibilidad con MySQL en modo estricto.
- La optimización de queries N+1 en el módulo de transporte afectaba el rendimiento con muchas ciudades y tarifas.
- La configuración de Jest para mocking de módulos con dependencias circulares entre modelos y controladores requirió patrones específicos de `jest.mock()`.

---

## Plan para el Siguiente Periodo

- Dockerización del proyecto para facilitar despliegue.
- Despliegue en servidor de producción en la nube.
- Implementación de funcionalidades de marcado de daños y mantenimiento.
