# Plan de Implementación: Módulo de Alquileres

## Resumen del Módulo

El módulo de alquileres permite crear cotizaciones para clientes, seleccionando múltiples elementos compuestos o productos, con cálculo automático de transporte basado en ubicación y cantidad de camiones.

---

## 1. Estado de Implementación (Actualizado Febrero 2026)

### ARQUITECTURA DE MÓDULOS

**IMPORTANTE:** El sistema separa responsabilidades entre dos módulos:

| Módulo | Responsabilidad |
|--------|-----------------|
| **Alquileres** | Gestión comercial: cotizaciones, clientes, eventos, precios |
| **Operaciones** | Gestión operativa: órdenes de trabajo, salida/retorno de elementos |

Las acciones de **ejecutar salida** y **registrar retorno** se gestionan exclusivamente desde el módulo de **Operaciones**, no desde Alquileres. El módulo de Alquileres proporciona una vista de solo lectura con enlaces a las órdenes de trabajo correspondientes.

### BACKEND - Estado Actual

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| ClienteModel | ✅ Completo | `backend/modules/alquileres/models/ClienteModel.js` |
| CotizacionModel | ✅ Completo | `backend/modules/alquileres/models/CotizacionModel.js` |
| CotizacionProductoModel | ✅ Completo | `backend/modules/alquileres/models/CotizacionProductoModel.js` |
| CotizacionTransporteModel | ✅ Completo | `backend/modules/alquileres/models/CotizacionTransporteModel.js` |
| CotizacionDescuentoModel | ✅ Completo | `backend/modules/alquileres/models/CotizacionDescuentoModel.js` |
| CotizacionProductoRecargoModel | ✅ Completo | `backend/modules/alquileres/models/CotizacionProductoRecargoModel.js` |
| AlquilerModel | ✅ Completo | `backend/modules/alquileres/models/AlquilerModel.js` |
| AlquilerElementoModel | ✅ Completo | `backend/modules/alquileres/models/AlquilerElementoModel.js` |
| TarifaTransporteModel | ✅ Completo | `backend/modules/alquileres/models/TarifaTransporteModel.js` |
| EventoModel | ✅ Completo | `backend/modules/alquileres/models/EventoModel.js` |
| DisponibilidadModel | ✅ Completo | `backend/modules/alquileres/models/DisponibilidadModel.js` |
| ConfiguracionModel | ✅ Completo | `backend/modules/alquileres/models/ConfiguracionModel.js` |
| DescuentoModel | ✅ Completo | `backend/modules/alquileres/models/DescuentoModel.js` |
| SincronizacionAlquilerService | ✅ Completo | `backend/modules/operaciones/services/SincronizacionAlquilerService.js` |
| Controladores | ✅ Completo | `backend/modules/alquileres/controllers/` |
| Rutas API | ✅ Completo | `backend/modules/alquileres/routes/` |

### FRONTEND - Estado Actual

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| apiClientes | ✅ Completo | `inventario-frontend/src/api/apiClientes.js` |
| apiCotizaciones | ✅ Completo | `inventario-frontend/src/api/apiCotizaciones.js` |
| apiAlquileres | ✅ Completo | `inventario-frontend/src/api/apiAlquileres.js` |
| apiTarifasTransporte | ✅ Completo | `inventario-frontend/src/api/apiTarifasTransporte.js` |
| apiEventos | ✅ Completo | `inventario-frontend/src/api/apiEventos.js` |
| apiDescuentos | ✅ Completo | `inventario-frontend/src/api/apiDescuentos.js` |
| apiDisponibilidad | ✅ Completo | `inventario-frontend/src/api/apiDisponibilidad.js` |
| apiConfiguracion | ✅ Completo | `inventario-frontend/src/api/apiConfiguracion.js` |
| apiCiudades | ✅ Completo | `inventario-frontend/src/api/apiCiudades.js` |
| UseClientes | ✅ Completo | `inventario-frontend/src/hooks/UseClientes.js` |
| useCotizaciones | ✅ Completo | `inventario-frontend/src/hooks/cotizaciones/` |
| useAlquileres | ✅ Completo | `inventario-frontend/src/hooks/useAlquileres.js` |
| UseTarifasTransporte | ✅ Completo | `inventario-frontend/src/hooks/UseTarifasTransporte.js` |
| useEventos | ✅ Completo | `inventario-frontend/src/hooks/useEventos.js` |
| useDescuentos | ✅ Completo | `inventario-frontend/src/hooks/descuentos/` |
| useDisponibilidad | ✅ Completo | `inventario-frontend/src/hooks/useDisponibilidad.js` |
| useConfiguracion | ✅ Completo | `inventario-frontend/src/hooks/useConfiguracion.js` |
| UseCiudades | ✅ Completo | `inventario-frontend/src/hooks/UseCiudades.js` |
| useCalendar | ✅ Completo | `inventario-frontend/src/hooks/calendar/` |

### PÁGINAS - Estado Actual

| Página | Estado | Ubicación |
|--------|--------|-----------|
| ClientesPage | ✅ Completo | `inventario-frontend/src/pages/ClientesPage.jsx` |
| CotizacionesPage | ✅ Completo | `inventario-frontend/src/pages/CotizacionesPage.jsx` (vista de Eventos) |
| EventosPage | ✅ Completo | `inventario-frontend/src/pages/EventosPage.jsx` |
| CalendarioPage | ✅ Completo | `inventario-frontend/src/pages/CalendarioPage.jsx` |
| ConfiguracionAlquileresPage | ✅ Completo | `inventario-frontend/src/pages/ConfiguracionAlquileresPage.jsx` |
| DescuentosPage | ✅ Completo | `inventario-frontend/src/pages/DescuentosPage.jsx` |
| CiudadesPage | ✅ Completo | `inventario-frontend/src/pages/CiudadesPage.jsx` |
| AlquileresPage (Dashboard) | ✅ Completo | `inventario-frontend/src/pages/AlquileresPage.jsx` |
| AlquilerDetallePage | ✅ Completo | `inventario-frontend/src/pages/AlquilerDetallePage.jsx` |
| OrdenDetallePage | ✅ Completo | `inventario-frontend/src/pages/OrdenDetallePage.jsx` (para salida/retorno) |

### COMPONENTES - Estado Actual

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| ClienteCard | ✅ Completo | `inventario-frontend/src/components/cards/ClienteCard.jsx` |
| ClienteFormModal | ✅ Completo | `inventario-frontend/src/components/forms/ClienteFormModal.jsx` |
| CotizacionFormModal | ✅ Completo | `inventario-frontend/src/components/forms/CotizacionFormModal.jsx` |
| EventoFormModal | ✅ Completo | `inventario-frontend/src/components/modals/EventoFormModal.jsx` |
| EventoDetalleModal | ✅ Completo | `inventario-frontend/src/components/modals/EventoDetalleModal.jsx` |
| CotizacionDetalleModal | ✅ Completo | `inventario-frontend/src/components/modals/CotizacionDetalleModal.jsx` |
| CalendarWrapper | ✅ Completo | `inventario-frontend/src/components/calendar/` |
| EventTooltip | ✅ Completo | `inventario-frontend/src/components/calendar/` |
| CalendarFilters | ✅ Completo | `inventario-frontend/src/components/calendar/` |
| CalendarLegend | ✅ Completo | `inventario-frontend/src/components/calendar/` |
| CalendarStats | ✅ Completo | `inventario-frontend/src/components/calendar/` |
| AlquilerCard | ✅ Completo | `inventario-frontend/src/components/cards/AlquilerCard.jsx` |
| AlquilerTimeline | ✅ Completo | `inventario-frontend/src/components/alquileres/AlquilerTimeline.jsx` |
| AlquileresLayout | ✅ Completo | `inventario-frontend/src/components/layouts/AlquileresLayout.jsx` |
| ModalRegistrarRetorno | ✅ Completo | Integrado en `OrdenDetallePage.jsx` (módulo Operaciones) |

**Nota:** Los modales de AsignacionElementos y RetornoElementos NO se implementaron en el módulo Alquileres. Las acciones operativas (salida/retorno) se gestionan desde el módulo de **Operaciones** en `OrdenDetallePage.jsx`.

### BASE DE DATOS - Migraciones Ejecutadas

| Migración | Estado |
|-----------|--------|
| 04_clientes.sql | ✅ Ejecutada |
| 05_cotizaciones.sql | ✅ Ejecutada |
| 06_cotizacion_detalles.sql | ✅ Ejecutada |
| 07_alquileres.sql | ✅ Ejecutada |
| 08_modificar_cotizaciones.sql | ✅ Ejecutada |
| 09_cotizacion_productos.sql | ✅ Ejecutada |
| 10_modificar_cotizacion_detalles.sql | ✅ Ejecutada |
| 11_alquiler_elementos.sql | ✅ Ejecutada |
| 12_tarifas_transporte.sql | ✅ Ejecutada |
| 13_cotizacion_transportes.sql | ✅ Ejecutada |
| 14_indices_alquileres.sql | ✅ Ejecutada |
| 15_modificar_alquiler_elementos.sql | ✅ Ejecutada |
| 16_quitar_unique_cotizacion_productos.sql | ✅ Ejecutada |
| 17_ciudades.sql | ✅ Ejecutada |
| 18_agregar_ciudad_id.sql | ✅ Ejecutada |
| 19_migracion_ciudad_id_completa.sql | ✅ Ejecutada |
| 20_fechas_montaje_desmontaje.sql | ✅ Ejecutada |
| 21_eventos_y_recargos.sql | ✅ Ejecutada |
| 21_agregar_campos_cotizaciones_iva.sql | ✅ Ejecutada |
| 22_crear_descuentos.sql | ✅ Ejecutada |
| 23_crear_cotizacion_descuentos.sql | ✅ Ejecutada |
| 24_crear_configuracion_alquileres.sql | ✅ Ejecutada |

---

## 2. Funcionalidades Implementadas

### 2.1 Gestión de Clientes ✅
- CRUD completo de clientes
- Búsqueda y filtrado
- Historial de cotizaciones por cliente

### 2.2 Gestión de Eventos ✅
- Crear eventos que agrupan múltiples cotizaciones
- Estados: activo, completado, cancelado
- Asociación con cliente y ciudad
- Fechas de inicio y fin

### 2.3 Gestión de Cotizaciones ✅
- Múltiples productos por cotización
- Múltiples líneas de transporte
- Cálculo automático de días extra (montaje/desmontaje)
- IVA configurable
- Descuentos predefinidos y manuales
- Recargos por adelanto/extensión de fechas
- Estados: pendiente, aprobada, rechazada, vencida
- Duplicar cotizaciones
- Asociación con eventos

### 2.4 Tarifas de Transporte ✅
- CRUD de tarifas por ciudad y tipo de camión
- Cálculo automático en cotizaciones

### 2.5 Calendario ✅
- Vista de calendario con FullCalendar
- Filtros por tipo (montaje/evento/desmontaje)
- Filtros por estado
- Estadísticas visuales
- Tooltips con información del evento

### 2.6 Configuración del Sistema ✅
- Días gratis de montaje/desmontaje
- Porcentaje por días extra
- Porcentaje de IVA
- Vigencia de cotizaciones
- Datos de empresa

### 2.7 Descuentos ✅
- Descuentos predefinidos (porcentaje o fijo)
- Aplicación a cotizaciones
- Cálculo automático

### 2.8 Alquileres (Backend) ✅
- Crear alquiler desde cotización aprobada
- Asignación automática de elementos disponibles
- Verificación de disponibilidad
- Marcar salida (cambio de estado de series/lotes)
- Marcar retorno
- Registro de daños
- Cancelación

---

## 3. Funcionalidades Completadas (UI de Alquileres)

> **IMPORTANTE:** Las acciones operativas (ejecutar salida, registrar retorno) se gestionan desde el módulo de **Operaciones**, no desde el módulo de Alquileres. El módulo de Alquileres es de solo lectura para aspectos operativos.

### 3.1 AlquileresPage (Dashboard) ✅ COMPLETADO

Vista de solo lectura de todos los alquileres con estadísticas y filtros.

**Archivo:** `inventario-frontend/src/pages/AlquileresPage.jsx`

**Características:**
- Estadísticas por estado (programados, activos, finalizados, cancelados)
- Filtro por estado (click en tarjetas de estadísticas)
- Búsqueda por evento o cliente
- Tarjetas de alquiler con información resumida
- Navegación a detalle de alquiler

**Nota:** Los botones de "Marcar Salida" y "Marcar Retorno" fueron removidos. Estas acciones se realizan desde el módulo de Operaciones.

### 3.2 AlquilerDetallePage ✅ COMPLETADO

Vista detallada de un alquiler con información completa y enlaces a órdenes de trabajo.

**Archivo:** `inventario-frontend/src/pages/AlquilerDetallePage.jsx`

**Características:**
- Información general del alquiler
- Resumen financiero (total, depósito, daños)
- Productos cotizados
- Elementos asignados (solo lectura)
- Timeline del alquiler
- Enlace a orden de montaje (para ejecutar salida)
- Enlace a orden de desmontaje (para registrar retorno)
- Opción de cancelar alquiler

### 3.3 Componentes Completados

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| AlquilerCard | `components/cards/AlquilerCard.jsx` | Tarjeta de resumen de alquiler |
| AlquilerTimeline | `components/alquileres/AlquilerTimeline.jsx` | Historial visual del alquiler |
| AlquileresLayout | `components/layouts/AlquileresLayout.jsx` | Layout con sidebar colapsable |
| AlquilersSidebar | `components/alquileres/AlquilersSidebar.jsx` | Navegación del módulo |

### 3.4 Acciones Operativas (En módulo Operaciones)

Las siguientes acciones se realizan desde el módulo de **Operaciones** (`/operaciones/ordenes/:id`):

| Acción | Orden de Trabajo | Estado | Descripción |
|--------|------------------|--------|-------------|
| Ejecutar Salida | Montaje | en_preparacion | Cambia alquiler a "activo", marca elementos como despachados |
| Registrar Retorno | Desmontaje | en_sitio/en_proceso | Registra estado de cada elemento, finaliza alquiler |

**Endpoints en Operaciones:**
```
POST /api/operaciones/ordenes/:id/ejecutar-salida
POST /api/operaciones/ordenes/:id/ejecutar-retorno
```

**Componente:** `OrdenDetallePage.jsx` incluye el modal `ModalRegistrarRetorno` para registrar el estado de retorno de cada elemento.

---

## 4. Flujo de Negocio Actual

### 4.1 Crear Cotización ✅ (Implementado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREAR COTIZACIÓN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SELECCIONAR/CREAR EVENTO                                    │
│     ├── Asociar a evento existente                              │
│     └── O crear nuevo evento con cliente                        │
│                                                                 │
│  2. DATOS DEL EVENTO (desde evento)                             │
│     ├── Nombre del evento                                       │
│     ├── Fecha montaje                                           │
│     ├── Fecha evento                                            │
│     ├── Fecha desmontaje                                        │
│     └── Ciudad destino                                          │
│                                                                 │
│  3. SELECCIONAR PRODUCTOS (múltiples)                           │
│     ├── Buscar elementos compuestos                             │
│     ├── Seleccionar cantidad de cada uno                        │
│     └── Agregar recargos si aplica                              │
│                                                                 │
│  4. CONFIGURAR TRANSPORTE                                       │
│     ├── Seleccionar tipo de camión                              │
│     ├── Ciudad (auto-cálculo de tarifa)                         │
│     └── Cantidad de viajes                                      │
│                                                                 │
│  5. APLICAR DESCUENTOS                                          │
│     ├── Descuentos predefinidos                                 │
│     └── Descuento manual                                        │
│                                                                 │
│  6. RESUMEN Y TOTALES (automático)                              │
│     ├── Subtotal productos                                      │
│     ├── Subtotal transporte                                     │
│     ├── Cobro días extra                                        │
│     ├── Descuentos                                              │
│     ├── Base gravable                                           │
│     ├── IVA                                                     │
│     └── TOTAL                                                   │
│                                                                 │
│  7. GUARDAR                                                     │
│     └── Estado: PENDIENTE                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Aprobar Cotización → Crear Alquiler ✅ (Backend implementado)

```
┌─────────────────────────────────────────────────────────────────┐
│              APROBAR COTIZACIÓN → CREAR ALQUILER                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. VERIFICAR DISPONIBILIDAD (automático)                       │
│     ├── Verificar stock de cada componente                     │
│     └── Alertar si hay faltantes                               │
│                                                                 │
│  2. CAMBIAR ESTADO COTIZACIÓN                                   │
│     └── pendiente → aprobada                                    │
│                                                                 │
│  3. CREAR REGISTRO DE ALQUILER                                  │
│     ├── Estado: PROGRAMADO                                      │
│     ├── Fechas desde cotización                                 │
│     └── Totales desde cotización                                │
│                                                                 │
│  4. ASIGNAR ELEMENTOS AUTOMÁTICAMENTE                           │
│     ├── Buscar series/lotes disponibles                         │
│     └── Registrar en alquiler_elementos                         │
│                                                                 │
│  5. CREAR ÓRDENES DE TRABAJO                                    │
│     ├── Orden de montaje                                        │
│     └── Orden de desmontaje                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Marcar Salida ✅ (Backend implementado, UI pendiente)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARCAR SALIDA                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. VERIFICAR/AJUSTAR ELEMENTOS                                 │
│     ├── Mostrar elementos pre-asignados                         │
│     └── Permitir cambiar por otros disponibles                  │
│                                                                 │
│  2. CAMBIAR ESTADOS DE INVENTARIO                               │
│     ├── Series → estado: 'alquilado'                           │
│     ├── Lotes → crear lote temporal 'alquilado'                │
│     └── Registrar ubicación original                            │
│                                                                 │
│  3. CAMBIAR ESTADO ALQUILER                                     │
│     └── programado → ACTIVO                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Marcar Retorno ✅ (Backend implementado, UI pendiente)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARCAR RETORNO                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REVISAR CADA ELEMENTO                                       │
│     ├── Registrar estado_retorno (bueno/dañado/perdido)         │
│     └── Registrar costo_dano si aplica                          │
│                                                                 │
│  2. RESTAURAR INVENTARIO                                        │
│     ├── Series → estado según condición                         │
│     ├── Lotes → devolver cantidad al lote original              │
│     └── Ubicación → restaurar ubicación original                │
│                                                                 │
│  3. CALCULAR DAÑOS                                              │
│     └── Sumar todos los costo_dano                              │
│                                                                 │
│  4. CAMBIAR ESTADO ALQUILER                                     │
│     └── activo → FINALIZADO                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoints Implementados

### 5.1 Clientes ✅
```
GET    /api/clientes                    → Obtener todos
GET    /api/clientes/activos            → Obtener activos
GET    /api/clientes/:id                → Obtener por ID
GET    /api/clientes/buscar?q=          → Buscar
POST   /api/clientes                    → Crear
PUT    /api/clientes/:id                → Actualizar
DELETE /api/clientes/:id                → Eliminar
```

### 5.2 Cotizaciones ✅
```
GET    /api/cotizaciones                → Obtener todas
GET    /api/cotizaciones/estado/:estado → Por estado
GET    /api/cotizaciones/:id            → Obtener por ID
GET    /api/cotizaciones/:id/completa   → Con productos y detalles
GET    /api/cotizaciones/cliente/:id    → Por cliente
GET    /api/cotizaciones/:id/disponibilidad → Verificar disponibilidad
POST   /api/cotizaciones                → Crear (con productos)
PUT    /api/cotizaciones/:id            → Actualizar
PATCH  /api/cotizaciones/:id/estado     → Cambiar estado
DELETE /api/cotizaciones/:id            → Eliminar

POST   /api/cotizaciones/:id/aprobar    → Aprobar y crear alquiler
POST   /api/cotizaciones/:id/duplicar   → Duplicar cotización

POST   /api/cotizaciones/:id/productos                → Agregar producto
DELETE /api/cotizaciones/:id/productos/:productoId    → Eliminar producto

POST   /api/cotizaciones/:id/transporte               → Agregar transporte
DELETE /api/cotizaciones/:id/transporte/:transporteId → Eliminar transporte

GET    /api/cotizaciones/:id/descuentos                      → Obtener descuentos
POST   /api/cotizaciones/:id/descuentos                      → Aplicar descuento
DELETE /api/cotizaciones/:id/descuentos/:descuentoAplicadoId → Eliminar descuento
```

### 5.3 Alquileres ✅
```
GET    /api/alquileres                  → Obtener todos
GET    /api/alquileres/estado/:estado   → Por estado
GET    /api/alquileres/activos          → Activos
GET    /api/alquileres/programados      → Programados
GET    /api/alquileres/estadisticas     → Estadísticas
GET    /api/alquileres/fechas           → Por rango de fechas
GET    /api/alquileres/:id              → Obtener por ID
GET    /api/alquileres/:id/completo     → Con productos y elementos
GET    /api/alquileres/:id/elementos    → Elementos asignados

POST   /api/alquileres/:id/elementos                    → Asignar elementos
PUT    /api/alquileres/:id/elementos/:asignacionId      → Cambiar elemento
POST   /api/alquileres/:id/elementos/:elementoId/retorno → Retorno individual

POST   /api/alquileres/:id/salida       → Marcar salida
POST   /api/alquileres/:id/retorno      → Marcar retorno
POST   /api/alquileres/:id/cancelar     → Cancelar
```

### 5.4 Eventos ✅
```
GET    /api/eventos                     → Obtener todos
GET    /api/eventos/:id                 → Obtener por ID
GET    /api/eventos/:id/cotizaciones    → Cotizaciones del evento
POST   /api/eventos                     → Crear
PUT    /api/eventos/:id                 → Actualizar
PATCH  /api/eventos/:id/estado          → Cambiar estado
DELETE /api/eventos/:id                 → Eliminar
```

### 5.5 Tarifas de Transporte ✅
```
GET    /api/tarifas-transporte          → Obtener todas
GET    /api/tarifas-transporte/activas  → Solo activas
GET    /api/tarifas-transporte/:id      → Obtener por ID
GET    /api/tarifas-transporte/ciudad/:ciudadId → Por ciudad
POST   /api/tarifas-transporte          → Crear
PUT    /api/tarifas-transporte/:id      → Actualizar
DELETE /api/tarifas-transporte/:id      → Eliminar
```

### 5.6 Descuentos ✅
```
GET    /api/descuentos                  → Obtener todos
GET    /api/descuentos/activos          → Solo activos
GET    /api/descuentos/:id              → Obtener por ID
POST   /api/descuentos                  → Crear
PUT    /api/descuentos/:id              → Actualizar
DELETE /api/descuentos/:id              → Eliminar
```

### 5.7 Disponibilidad ✅
```
GET    /api/disponibilidad/cotizacion/:id → Verificar para cotización
GET    /api/disponibilidad/elemento/:id   → Disponibilidad de elemento
GET    /api/disponibilidad/fechas         → Por rango de fechas
```

### 5.8 Configuración ✅
```
GET    /api/configuracion               → Obtener todas las configuraciones
PUT    /api/configuracion               → Actualizar múltiples valores
GET    /api/configuracion/:clave        → Obtener valor específico
PUT    /api/configuracion/:clave        → Actualizar valor específico
```

---

## 6. Modelo de Datos Actual

```
┌─────────────────┐      ┌──────────────────────┐
│    clientes     │      │      ciudades        │
├─────────────────┤      ├──────────────────────┤
│ id              │      │ id                   │
│ tipo_documento  │      │ nombre               │
│ numero_documento│      └──────────┬───────────┘
│ nombre          │                 │
│ telefono        │      ┌──────────┴───────────┐
│ email           │      │  tarifas_transporte  │
│ direccion       │      ├──────────────────────┤
│ ciudad          │      │ id                   │
│ notas           │      │ ciudad_id            │
│ activo          │      │ tipo_camion          │
└────────┬────────┘      │ precio               │
         │               │ activo               │
         │ 1:N           └──────────────────────┘
         ▼
┌─────────────────────────────────────────────────┐
│                    eventos                      │
├─────────────────────────────────────────────────┤
│ id                                              │
│ cliente_id ─────────────────────────────────────│
│ nombre                                          │
│ ciudad_id                                       │
│ fecha_inicio, fecha_fin                         │
│ estado (activo/completado/cancelado)            │
└─────────────────────┬───────────────────────────┘
                      │ 1:N
                      ▼
┌─────────────────────────────────────────────────┐
│                  cotizaciones                   │
├─────────────────────────────────────────────────┤
│ id                                              │
│ cliente_id                                      │
│ evento_id (opcional)                            │
│ fecha_montaje, fecha_evento, fecha_desmontaje   │
│ evento_nombre, evento_direccion, evento_ciudad  │
│ dias_montaje_extra, dias_desmontaje_extra       │
│ porcentaje_dias_extra, cobro_dias_extra         │
│ subtotal_productos, subtotal_transporte         │
│ total_descuentos, base_gravable                 │
│ porcentaje_iva, valor_iva                       │
│ subtotal, descuento, total                      │
│ vigencia_dias                                   │
│ estado (pendiente/aprobada/rechazada/vencida)   │
└─────────────────────┬───────────────────────────┘
                      │ 1:N
         ┌────────────┴────────────┐
         ▼                         ▼
┌────────────────────────┐  ┌────────────────────────┐
│  cotizacion_productos  │  │  cotizacion_transportes│
├────────────────────────┤  ├────────────────────────┤
│ id                     │  │ id                     │
│ cotizacion_id          │  │ cotizacion_id          │
│ compuesto_id           │  │ tarifa_id              │
│ cantidad               │  │ cantidad               │
│ precio_base            │  │ precio_unitario        │
│ deposito               │  │ subtotal               │
│ precio_adicionales     │  └────────────────────────┘
│ subtotal               │
└─────────────┬──────────┘
              │ 1:N
              ▼
┌────────────────────────────────┐
│  cotizacion_producto_recargos  │
├────────────────────────────────┤
│ id                             │
│ cotizacion_producto_id         │
│ tipo (adelanto/extension)      │
│ dias, porcentaje               │
│ monto_recargo                  │
└────────────────────────────────┘


┌─────────────────────────────────────────────────┐
│                   alquileres                    │
├─────────────────────────────────────────────────┤
│ id                                              │
│ cotizacion_id ─────────────────────────────────│
│ fecha_salida                                    │
│ fecha_retorno_esperado                          │
│ fecha_retorno_real                              │
│ total, deposito_cobrado, costo_danos            │
│ notas_salida, notas_retorno                     │
│ estado (programado/activo/finalizado/cancelado) │
└─────────────────────┬───────────────────────────┘
                      │ 1:N
                      ▼
┌────────────────────────────────┐
│       alquiler_elementos       │
├────────────────────────────────┤
│ id                             │
│ alquiler_id                    │
│ elemento_id                    │
│ serie_id (si aplica)           │
│ lote_id (si aplica)            │
│ lote_alquilado_id              │
│ cantidad_lote                  │
│ estado_salida                  │
│ estado_retorno                 │
│ costo_dano                     │
│ notas_retorno                  │
│ ubicacion_original_id          │
│ fecha_asignacion               │
│ fecha_retorno                  │
└────────────────────────────────┘


┌────────────────────────┐
│       descuentos       │
├────────────────────────┤
│ id                     │
│ nombre                 │
│ descripcion            │
│ tipo (porcentaje/fijo) │
│ valor                  │
│ activo                 │
└───────────┬────────────┘
            │ 1:N
            ▼
┌────────────────────────────┐
│   cotizacion_descuentos    │
├────────────────────────────┤
│ id                         │
│ cotizacion_id              │
│ descuento_id (opcional)    │
│ tipo                       │
│ valor                      │
│ monto_calculado            │
│ descripcion                │
└────────────────────────────┘


┌────────────────────────────────┐
│   configuracion_alquileres     │
├────────────────────────────────┤
│ id                             │
│ clave                          │
│ valor                          │
│ tipo                           │
│ categoria                      │
│ descripcion                    │
└────────────────────────────────┘
```

---

## 7. Próximos Pasos

### COMPLETADOS ✅
1. ~~**Crear AlquileresPage** - Dashboard de alquileres activos/programados~~
2. ~~**Crear AlquilerDetallePage** - Vista detallada de un alquiler~~
3. ~~**Crear AlquilerCard** - Tarjeta de resumen de alquiler~~
4. ~~**Crear AlquilerTimeline** - Historial visual del alquiler~~
5. ~~**Ejecutar Salida (Operaciones)** - Integrado en OrdenDetallePage~~
6. ~~**Registrar Retorno (Operaciones)** - Modal en OrdenDetallePage~~

### Prioridad Media
7. ~~**Integrar notificaciones** - Alertas de alquileres próximos a vencer~~ ✅ COMPLETADO
8. ~~**Mejorar sincronización** - Actualizar estado de alquiler cuando orden cambia~~ ✅ COMPLETADO

### Prioridad Baja (Pendientes)
9. **Reportes de alquileres** - Estadísticas y gráficos
10. **Exportar a PDF** - Cotizaciones y contratos
11. **Historial de cambios** - Auditoría de modificaciones

---

## 8. Notas Técnicas

- La tabla de clientes está completa y funcional
- Los elementos compuestos ya tienen precio_base y deposito definidos
- Las ubicaciones ya existen y se usan para el cálculo de transporte
- El sistema de series/lotes ya maneja estados, solo hay que usar la lógica existente
- La asignación automática de elementos ya está implementada en DisponibilidadModel
- Las órdenes de trabajo se crean automáticamente al aprobar cotización
- La configuración es dinámica y se carga desde ConfiguracionModel

### Arquitectura de Separación de Módulos

**Flujo de datos entre módulos:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO ALQUILERES                            │
│  (Comercial - Cotizaciones, Clientes, Eventos)                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Crear cotización                                            │
│  2. Aprobar cotización → Crea alquiler + órdenes de trabajo    │
│  3. Vista de solo lectura de alquileres                         │
│  4. Enlaces a órdenes de trabajo en Operaciones                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MÓDULO OPERACIONES                            │
│  (Operativo - Órdenes de trabajo, Salida, Retorno)             │
├─────────────────────────────────────────────────────────────────┤
│  Orden de MONTAJE:                                              │
│  1. en_preparacion → Ejecutar Salida → en_ruta                 │
│     - Actualiza alquiler a "activo"                             │
│     - Copia elementos a alquiler_elementos                      │
│     - Marca series/lotes como "alquilado"                       │
│                                                                 │
│  Orden de DESMONTAJE:                                           │
│  1. en_sitio/en_proceso → Registrar Retorno → completado       │
│     - Registra estado de retorno de cada elemento               │
│     - Actualiza alquiler a "finalizado"                         │
│     - Restaura series/lotes según condición                     │
└─────────────────────────────────────────────────────────────────┘
```

**Servicio de sincronización:** `SincronizacionAlquilerService.js` maneja la comunicación entre módulos, asegurando consistencia de datos entre órdenes de trabajo y alquileres.

### Sincronización Bidireccional (Implementado)

El servicio `SincronizacionAlquilerService.js` ahora incluye sincronización automática:

**Métodos disponibles:**
- `sincronizarEstadoAlquiler(ordenId, nuevoEstado)` - Sincroniza automáticamente el alquiler cuando cambia el estado de una orden
- `obtenerEstadoSincronizacion(alquilerId)` - Obtiene estado de sincronización para debugging/UI
- `verificarConsistencia(alquilerId)` - Verifica consistencia entre orden y alquiler

**Reglas de sincronización:**

| Tipo Orden  | Nuevo Estado Orden | Acción sobre Alquiler              |
|-------------|--------------------|------------------------------------|
| montaje     | en_ruta            | → activo (si estaba programado)    |
| montaje     | completado         | → activo (si no lo está ya)        |
| desmontaje  | completado         | → finalizado                       |
| cualquiera  | cancelado          | → cancelado (si ambas canceladas)  |

**Endpoints de diagnóstico:**
```
GET /api/operaciones/alquiler/:id/sincronizacion
GET /api/operaciones/alquiler/:id/verificar-consistencia
```

### Sistema de Alertas (Implementado)

El sistema de alertas detecta situaciones que requieren atención en tiempo real:

**Tipos de alertas:**

| Código | Severidad | Descripción |
|--------|-----------|-------------|
| `RETORNO_VENCIDO` | 🔴 Crítico | Alquiler activo con fecha de retorno pasada |
| `ORDEN_MONTAJE_VENCIDA` | 🔴 Crítico | Orden de montaje programada sin ejecutar |
| `ORDEN_DESMONTAJE_VENCIDA` | 🔴 Crítico | Orden de desmontaje programada sin completar |
| `ALQUILER_NO_INICIADO` | 🔴 Crítico | Alquiler programado cuya fecha de salida ya pasó |
| `RETORNO_PROXIMO` | 🟡 Advertencia | Retorno esperado en los próximos 2 días |
| `SALIDA_PROXIMA` | 🟡 Advertencia | Montaje programado para mañana |
| `DESMONTAJE_PROXIMO` | 🟡 Advertencia | Desmontaje programado para mañana |

**Componentes:**

| Archivo | Descripción |
|---------|-------------|
| `backend/modules/alquileres/services/AlertasAlquilerService.js` | Servicio de detección de alertas |
| `backend/modules/alquileres/controllers/alertasController.js` | Controlador de alertas |
| `backend/modules/alquileres/routes/alertas.js` | Rutas de alertas |
| `inventario-frontend/src/api/apiAlertas.js` | API cliente |
| `inventario-frontend/src/hooks/useAlertas.js` | Hooks de React Query |
| `inventario-frontend/src/components/alertas/AlertasPanel.jsx` | Panel de alertas |
| `inventario-frontend/src/components/alertas/AlertaItem.jsx` | Componente de alerta individual |

**Endpoints de alertas:**
```
GET  /api/alertas/alquileres           → Todas las alertas
GET  /api/alertas/alquileres/criticas  → Solo alertas críticas
GET  /api/alertas/alquileres/resumen   → Conteos por severidad
POST /api/alertas/alquileres/ignorar   → Ignorar alerta por X días
```

**Integración en UI:**
- `AlquileresPage.jsx` - Muestra AlertasPanel en la parte superior
- `OperacionesDashboard.jsx` - Muestra alertas en panel lateral

**Configuración:**
- Advertencia de retorno próximo: 2 días
- Auto-refresh de alertas: cada 60 segundos
- Ignorar alerta: configurable de 1 a 7 días
