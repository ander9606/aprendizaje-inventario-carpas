# Plan: Reorganización por Módulos (Frontend + Backend)

## Módulos acordados

| Módulo | Descripción |
|--------|-------------|
| `auth` | Autenticación, JWT, permisos |
| `inventario` | Elementos, lotes, series, materiales, unidades, categorías, ubicaciones |
| `productos` | Productos de alquiler, categorías de productos, elementos compuestos |
| `alquileres` | Cotizaciones, alquileres, descuentos, disponibilidad, eventos, tarifas |
| `clientes` | Clientes, ciudades ← **NUEVO módulo** en ambos lados |
| `operaciones` | Órdenes de trabajo, empleados, vehículos |
| `calendario` | Vistas de calendario |
| `configuracion` | Configuración general, alertas |

---

## FRONTEND — Nueva estructura

```
inventario-frontend/src/
├── modules/
│   ├── auth/
│   │   ├── api/              apiAuth.js
│   │   ├── components/       ProtectedRoute, PermisoGate, UserMenu
│   │   ├── hooks/            useAuth.js
│   │   └── pages/            LoginPage.jsx
│   │
│   ├── inventario/
│   │   ├── api/              apiCategorias, apiElementos, apiLotes, apiSeries,
│   │   │                     apiMateriales, apiUnidades, apiUbicaciones, apiExport
│   │   ├── components/
│   │   │   ├── elementos/    (lotes/, series/ — ya existentes)
│   │   │   ├── cards/        CategoriaPadreCard, SubcategoriaCard, UbicacionCard
│   │   │   └── forms/        ElementoFormModal, LoteFormModal, SerieFormModal,
│   │   │                     CategoriaFormModal, SubcategoriaFormModal,
│   │   │                     UbicacionFormModal, CrearLoteModal,
│   │   │                     DevolverBodegaModal, DevolverSerieBodegaModal,
│   │   │                     MoverSerieModal
│   │   ├── hooks/            useElementos, useLotes, useSeries, useMateriales,
│   │   │                     useUnidades, useUbicaciones, useCategorias,
│   │   │                     useDisponibilidad
│   │   └── pages/            ElementosPage, ElementoDetallePage,
│   │                         InventarioDashboard, Subcategorias
│   │
│   ├── productos/
│   │   ├── api/              apiCategoriasProductos, apiElementosCompuestos,
│   │   │                     apiProductosAlquiler
│   │   ├── components/
│   │   │   ├── cards/        CategoriaProductoCard, ElementoCompuestoCard,
│   │   │   │                 ElementoCompuestoDetalle, ProductCategoriaPadreCard,
│   │   │   │                 ProductSubcategoriaCard
│   │   │   └── forms/        CategoriaProductoFormModal, ElementoCompuestoFormModal,
│   │   │                     ProductoConfiguracion
│   │   ├── hooks/            useCategoriasProductos, useElementosCompuestos,
│   │   │                     useProductosAlquiler
│   │   └── pages/            ElementosCompuestosPage, ProductosPage
│   │
│   ├── alquileres/
│   │   ├── api/              apiAlquileres, apiCotizaciones, apiDescuentos,
│   │   │                     apiDisponibilidad, apiTarifasTransporte, apiEventos
│   │   ├── components/
│   │   │   ├── cotizaciones/ (ya existente: selectores, resumen, etc.)
│   │   │   ├── alquileres/   AlquilerTimeline, AlquileresSidebar
│   │   │   ├── cards/        AlquilerCard, CotizacionCard
│   │   │   ├── disponibilidad/ DisponibilidadModal, VerificacionDisponibilidad
│   │   │   ├── forms/        CotizacionFormModal, TarifaFormModal
│   │   │   └── modals/       AprobarCotizacionModal, CotizacionDetalleModal,
│   │   │                     RecargoModal, RetornoElementosModal,
│   │   │                     AsignacionElementosModal, EventoDetalleModal,
│   │   │                     EventoFormModal
│   │   ├── hooks/
│   │   │   ├── cotizaciones/ (ya existente)
│   │   │   ├── descuentos/   (ya existente)
│   │   │   └── (raíz)        useAlquileres, useDisponibilidad, useTarifasTransporte,
│   │   │                     useEventos
│   │   └── pages/            AlquileresPage, AlquilerDetallePage, CotizacionesPage,
│   │                         DescuentosPage, HistorialAlquileresPage,
│   │                         ReportesAlquileresPage, ConfiguracionAlquileresPage,
│   │                         EventosPage, HistorialEventosPage, TransportePage
│   │
│   ├── clientes/             ← NUEVO
│   │   ├── api/              apiClientes, apiCiudades
│   │   ├── components/
│   │   │   ├── cards/        ClienteCard
│   │   │   ├── forms/        ClienteFormModal
│   │   │   └── modals/       ClienteHistorialModal
│   │   ├── hooks/            useClientes, useCiudades
│   │   └── pages/            ClientesPage, CiudadesPage
│   │
│   ├── operaciones/
│   │   ├── api/              apiOperaciones, apiEmpleados, apiVehiculos
│   │   ├── components/
│   │   │   ├── (raíz)        ChecklistCargueDescargue, OperacionesSidebar,
│   │   │   │                 todos los Modal* de operaciones
│   │   │   └── forms/        EmpleadoFormModal
│   │   ├── hooks/            useOrdenesTrabajo, useEmpleados, useVehiculos
│   │   └── pages/            OrdenesTrabajoPage, OrdenDetallePage, EmpleadosPage,
│   │                         HistorialOrdenesPage, OperacionesDashboard
│   │
│   ├── calendario/
│   │   ├── components/       CalendarWrapper, CalendarFilters, CalendarLegend,
│   │   │                     CalendarStats, EventTooltip, ModalCotizacionResumen,
│   │   │                     ModalDiaCotizaciones
│   │   ├── constants/        calendarConfig.js
│   │   ├── hooks/            useCalendarConfig, useCalendarEvents
│   │   └── pages/            CalendarioPage, CalendarioOperaciones
│   │
│   └── configuracion/
│       ├── api/              apiConfiguracion, apiAlertas
│       ├── components/
│       │   └── alertas/      AlertaItem, AlertasPanel
│       ├── hooks/            useConfiguracion, useAlertas
│       └── pages/            ConfiguracionPage, AlertasPage
│
├── shared/
│   ├── api/                  Axios.config.js, index.js
│   ├── components/           (todo el actual common/ + picker/)
│   ├── constants/            emojiCategories.js, lucidIcons.js
│   ├── layouts/              ModuleLayout (AlquilereLayout y OperacionesLayout
│   │                         se mueven a sus módulos respectivos)
│   ├── stores/               authStore.js
│   └── utils/                helpers.js, validation.js, constants.js
│
├── pages/                    Dashboard.jsx, ModulosDashboard.jsx  ← solo top-level
├── App.jsx
└── main.jsx
```

---

## BACKEND — Cambios de estructura

El backend ya tiene módulos. Los cambios son quirúrgicos:

### 1. NUEVO módulo `clientes/`
```
modules/clientes/
├── controllers/
│   ├── clienteController.js    ← MOVER desde alquileres/controllers/
│   └── ciudadController.js     ← MOVER desde configuracion/controllers/
├── models/
│   ├── ClienteModel.js         ← MOVER desde alquileres/models/
│   └── CiudadModel.js          ← MOVER desde configuracion/models/
└── routes/
    ├── clientes.js             ← MOVER desde alquileres/routes/
    └── ciudades.js             ← MOVER desde configuracion/routes/
```

### 2. `operaciones/` absorbe empleados y vehículos
```
modules/operaciones/            (agregar)
├── controllers/
│   ├── empleadoController.js   ← MOVER desde configuracion/
│   └── vehiculoController.js   ← MOVER desde configuracion/
├── models/
│   ├── EmpleadoModel.js        ← MOVER desde configuracion/
│   └── VehiculoModel.js        ← MOVER desde configuracion/
└── routes/
    ├── empleados.js            ← MOVER desde configuracion/
    └── vehiculos.js            ← MOVER desde configuracion/
```

### 3. `inventario/` absorbe ubicaciones
```
modules/inventario/             (agregar)
├── controllers/
│   └── ubicacionController.js  ← MOVER desde configuracion/
├── models/
│   └── UbicacionModel.js       ← MOVER desde configuracion/
└── routes/
    └── ubicaciones.js          ← MOVER desde configuracion/
```

### 4. `configuracion/` se convierte en: alertas + config general
```
modules/configuracion/          (nuevo contenido)
├── controllers/
│   ├── alertasController.js    ← MOVER desde alquileres/
│   └── configuracionController.js ← MOVER desde alquileres/
├── models/
│   └── ConfiguracionModel.js   ← MOVER desde alquileres/
├── routes/
│   ├── alertas.js              ← MOVER desde alquileres/
│   └── configuracion.js        ← MOVER desde alquileres/
└── services/
    └── AlertasAlquilerService.js ← MOVER desde alquileres/services/
```

### 5. Agregar `index.js` por módulo + limpiar `server.js`
Cada módulo tendrá un `index.js` que exporta sus rutas:
```js
// modules/inventario/index.js
const router = require('express').Router();
router.use('/categorias', require('./routes/categorias'));
router.use('/elementos', require('./routes/elementos'));
// ...
module.exports = router;
```

`server.js` pasa de ~40 líneas de imports a:
```js
app.use('/api', require('./modules/inventario'));
app.use('/api', require('./modules/alquileres'));
// etc.
```

---

## Pasos de implementación

### Fase 1 — Backend (quirúrgico, ~1-2 horas)
1. Crear `modules/clientes/` y mover archivos + actualizar imports internos
2. Mover `empleados` + `vehiculos` → `operaciones/` + actualizar imports
3. Mover `ubicaciones` → `inventario/` + actualizar imports
4. Mover `alertas` + `configuracion` → `configuracion/` módulo + actualizar imports
5. Agregar `index.js` a cada módulo
6. Actualizar `server.js`
7. Verificar que el servidor arranca y los endpoints responden

### Fase 2 — Frontend (mayor esfuerzo, ~3-4 horas)
1. Crear estructura de carpetas `modules/` y `shared/`
2. Mover archivos módulo por módulo (auth → inventario → productos → alquileres → clientes → operaciones → calendario → configuracion)
3. Actualizar todos los imports en cada archivo movido
4. Actualizar imports en `App.jsx` y router principal
5. Verificar que la app compila sin errores (`npm run build`)

### Rama de trabajo
`claude/reorganize-frontend-structure-EKY9b`
