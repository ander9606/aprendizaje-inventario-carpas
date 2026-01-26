# Plan de Implementación: Módulo de Alquileres

## Resumen del Módulo

El módulo de alquileres permite crear cotizaciones para clientes, seleccionando múltiples elementos compuestos o productos, con cálculo automático de transporte basado en ubicación y cantidad de camiones.

---

## 1. Análisis del Estado Actual

### Lo que YA existe en el backend:

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| ClienteModel | ✅ Completo | `backend/modules/alquileres/models/ClienteModel.js` |
| CotizacionModel | ⚠️ Parcial | `backend/modules/alquileres/models/CotizacionModel.js` |
| AlquilerModel | ⚠️ Parcial | `backend/modules/alquileres/models/AlquilerModel.js` |
| Controladores | ✅ CRUD básico | `backend/modules/alquileres/controllers/` |
| Rutas API | ✅ Definidas | `backend/modules/alquileres/routes/` |

### Problemas identificados:

1. **Cotizaciones solo permiten UN elemento compuesto** (`compuesto_id` directo)
   - El usuario necesita seleccionar MÚLTIPLES elementos compuestos/productos

2. **No hay soporte para transporte**
   - Falta ubicación destino del evento
   - Falta cantidad de camiones
   - Falta cálculo de costo de transporte

3. **No hay rastreo de elementos individuales**
   - Cuando se confirma el alquiler, no hay forma de saber QUÉ series/lotes específicos se asignan
   - No existe la lógica para cambiar estados de elementos individuales

4. **Frontend inexistente**
   - No hay páginas para clientes, cotizaciones ni alquileres

---

## 2. Cambios Requeridos en Base de Datos

### 2.1 Modificar tabla `cotizaciones`

```sql
-- Eliminar compuesto_id directo (ahora será en tabla pivote)
-- Agregar campos de transporte y ubicación

ALTER TABLE cotizaciones
  DROP FOREIGN KEY cotizaciones_ibfk_2,  -- FK a elementos_compuestos
  DROP COLUMN compuesto_id,
  ADD COLUMN ubicacion_id INT AFTER evento_ciudad,
  ADD COLUMN direccion_evento TEXT AFTER ubicacion_id,
  ADD COLUMN cantidad_camiones INT DEFAULT 1 AFTER direccion_evento,
  ADD COLUMN costo_transporte DECIMAL(12,2) DEFAULT 0 AFTER cantidad_camiones,
  ADD COLUMN costo_transporte_unitario DECIMAL(12,2) DEFAULT 0 AFTER costo_transporte,
  ADD FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id);
```

### 2.2 Nueva tabla `cotizacion_productos` (reemplaza la relación directa)

```sql
-- Permite múltiples elementos compuestos por cotización
CREATE TABLE IF NOT EXISTS cotizacion_productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    compuesto_id INT NOT NULL,

    -- Cantidad de este producto en la cotización
    cantidad INT DEFAULT 1,

    -- Precios copiados al momento de cotizar
    precio_base DECIMAL(12,2) DEFAULT 0,
    precio_adicional DECIMAL(12,2) DEFAULT 0,  -- Por configuración especial
    subtotal DECIMAL(12,2) DEFAULT 0,

    -- Notas específicas de este producto
    notas TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id),

    -- Un mismo producto puede aparecer solo una vez por cotización
    UNIQUE KEY uk_cotizacion_producto (cotizacion_id, compuesto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Modificar tabla `cotizacion_detalles`

```sql
-- Ahora referencia a cotizacion_productos en lugar de cotizacion directamente
ALTER TABLE cotizacion_detalles
  ADD COLUMN cotizacion_producto_id INT AFTER cotizacion_id,
  ADD FOREIGN KEY (cotizacion_producto_id) REFERENCES cotizacion_productos(id) ON DELETE CASCADE;
```

### 2.4 Nueva tabla `alquiler_elementos` (rastreo de elementos físicos)

```sql
-- Registra QUÉ series o lotes específicos se asignan a cada alquiler
CREATE TABLE IF NOT EXISTS alquiler_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alquiler_id INT NOT NULL,

    -- Referencia al elemento base
    elemento_id INT NOT NULL,

    -- Si es serie individual
    serie_id INT DEFAULT NULL,

    -- Si es lote (cantidad parcial)
    lote_id INT DEFAULT NULL,
    cantidad_lote INT DEFAULT NULL,

    -- Estado al momento de asignar
    estado_salida ENUM('nuevo', 'bueno', 'mantenimiento') DEFAULT 'bueno',

    -- Estado al momento de retorno
    estado_retorno ENUM('bueno', 'dañado', 'perdido') DEFAULT NULL,
    costo_dano DECIMAL(12,2) DEFAULT 0,
    notas_retorno TEXT,

    -- Ubicación original (para retornar después)
    ubicacion_original_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (alquiler_id) REFERENCES alquileres(id) ON DELETE CASCADE,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id),
    FOREIGN KEY (serie_id) REFERENCES series(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (ubicacion_original_id) REFERENCES ubicaciones(id),

    -- Una serie solo puede estar en un alquiler a la vez
    UNIQUE KEY uk_alquiler_serie (alquiler_id, serie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 Nueva tabla `tarifas_transporte` (opcional, para cálculo automático)

```sql
-- Tarifas de transporte por zona/ciudad
CREATE TABLE IF NOT EXISTS tarifas_transporte (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ciudad VARCHAR(100) NOT NULL,
    zona VARCHAR(100),  -- Para subdividir ciudades grandes

    -- Precio por camión
    precio_camion DECIMAL(12,2) NOT NULL,

    -- Tiempo estimado (horas)
    tiempo_estimado DECIMAL(5,2),

    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_ciudad_zona (ciudad, zona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Flujo de Negocio Completo

### 3.1 Crear Cotización

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREAR COTIZACIÓN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SELECCIONAR CLIENTE                                         │
│     ├── Buscar cliente existente                                │
│     └── O crear nuevo cliente                                   │
│                                                                 │
│  2. DATOS DEL EVENTO                                            │
│     ├── Nombre del evento                                       │
│     ├── Fecha inicio                                            │
│     ├── Fecha fin                                               │
│     ├── Ubicación/Ciudad destino                                │
│     └── Dirección específica                                    │
│                                                                 │
│  3. SELECCIONAR PRODUCTOS (múltiples)                           │
│     ├── Buscar elementos compuestos                             │
│     ├── Seleccionar cantidad de cada uno                        │
│     ├── Ver desglose de componentes                             │
│     └── Seleccionar alternativas si aplica                      │
│                                                                 │
│  4. CONFIGURAR TRANSPORTE                                       │
│     ├── Cantidad de camiones                                    │
│     └── Cálculo automático según ubicación                      │
│                                                                 │
│  5. RESUMEN Y TOTALES                                           │
│     ├── Subtotal productos                                      │
│     ├── Costo transporte                                        │
│     ├── Descuento (opcional)                                    │
│     ├── Depósito sugerido                                       │
│     └── TOTAL                                                   │
│                                                                 │
│  6. GUARDAR                                                     │
│     └── Estado: PENDIENTE                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Aprobar Cotización → Crear Alquiler

```
┌─────────────────────────────────────────────────────────────────┐
│              APROBAR COTIZACIÓN → CREAR ALQUILER                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CAMBIAR ESTADO COTIZACIÓN                                   │
│     └── pendiente → aprobada                                    │
│                                                                 │
│  2. CREAR REGISTRO DE ALQUILER                                  │
│     ├── Estado: PROGRAMADO                                      │
│     ├── Fechas de salida/retorno                                │
│     └── Totales desde cotización                                │
│                                                                 │
│  3. (OPCIONAL) RESERVAR ELEMENTOS                               │
│     └── Marcar elementos como "reservados" si se desea         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Marcar Salida (Inicio del Alquiler)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARCAR SALIDA                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ASIGNAR ELEMENTOS FÍSICOS                                   │
│     Para cada producto de la cotización:                        │
│     ├── Buscar componentes requeridos                           │
│     ├── Seleccionar series específicas (si requiere_series)     │
│     └── Seleccionar lotes con cantidad (si no requiere_series)  │
│                                                                 │
│  2. CAMBIAR ESTADOS                                             │
│     ├── Series seleccionadas → estado: 'alquilado'             │
│     ├── Lotes seleccionados → estado: 'alquilado'              │
│     └── Ubicación → evento/cliente                              │
│                                                                 │
│  3. REGISTRAR EN alquiler_elementos                             │
│     ├── Guardar estado_salida                                   │
│     └── Guardar ubicacion_original_id                           │
│                                                                 │
│  4. CAMBIAR ESTADO ALQUILER                                     │
│     └── programado → ACTIVO                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Marcar Retorno (Fin del Alquiler)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARCAR RETORNO                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REVISAR CADA ELEMENTO                                       │
│     Para cada elemento en alquiler_elementos:                   │
│     ├── Registrar estado_retorno (bueno/dañado/perdido)         │
│     └── Registrar costo_dano si aplica                          │
│                                                                 │
│  2. RESTAURAR ESTADOS                                           │
│     ├── Series → estado según condición                         │
│     ├── Lotes → estado según condición                          │
│     └── Ubicación → ubicacion_original_id                       │
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

## 4. Estructura de Implementación

### 4.1 Backend - Archivos a Crear/Modificar

```
backend/
├── sql/productos_alquiler/
│   ├── 08_cotizacion_productos.sql          [CREAR]
│   ├── 09_alquiler_elementos.sql            [CREAR]
│   ├── 10_tarifas_transporte.sql            [CREAR]
│   ├── 11_modificar_cotizaciones.sql        [CREAR]
│   └── 12_modificar_cotizacion_detalles.sql [CREAR]
│
├── modules/alquileres/
│   ├── models/
│   │   ├── ClienteModel.js                  [SIN CAMBIOS]
│   │   ├── CotizacionModel.js               [MODIFICAR]
│   │   ├── CotizacionProductoModel.js       [CREAR]
│   │   ├── AlquilerModel.js                 [MODIFICAR]
│   │   ├── AlquilerElementoModel.js         [CREAR]
│   │   └── TarifaTransporteModel.js         [CREAR]
│   │
│   ├── controllers/
│   │   ├── clienteController.js             [SIN CAMBIOS]
│   │   ├── cotizacionController.js          [MODIFICAR]
│   │   ├── alquilerController.js            [MODIFICAR]
│   │   └── tarifaTransporteController.js    [CREAR]
│   │
│   ├── routes/
│   │   ├── clientes.js                      [SIN CAMBIOS]
│   │   ├── cotizaciones.js                  [MODIFICAR]
│   │   ├── alquileres.js                    [MODIFICAR]
│   │   └── tarifasTransporte.js             [CREAR]
│   │
│   └── services/
│       ├── calculoTransporteService.js      [CREAR]
│       └── asignacionElementosService.js    [CREAR]
```

### 4.2 Frontend - Archivos a Crear

```
inventario-frontend/src/
├── api/
│   ├── apiClientes.js                       [CREAR]
│   ├── apiCotizaciones.js                   [CREAR]
│   ├── apiAlquileres.js                     [CREAR]
│   └── apiTarifasTransporte.js              [CREAR]
│
├── hooks/
│   ├── UseClientes.js                       [CREAR]
│   ├── UseCotizaciones.js                   [CREAR]
│   ├── UseAlquileres.js                     [CREAR]
│   └── UseTarifasTransporte.js              [CREAR]
│
├── pages/
│   ├── alquileres/
│   │   ├── AlquileresPage.jsx               [CREAR] - Dashboard de alquileres
│   │   ├── ClientesPage.jsx                 [CREAR] - CRUD de clientes
│   │   ├── CotizacionesPage.jsx             [CREAR] - Lista de cotizaciones
│   │   ├── CotizacionDetallePage.jsx        [CREAR] - Detalle/edición
│   │   ├── AlquilerDetallePage.jsx          [CREAR] - Detalle de alquiler
│   │   └── TarifasTransportePage.jsx        [CREAR] - Config de tarifas
│   │
├── components/
│   ├── alquileres/
│   │   ├── ClienteCard.jsx                  [CREAR]
│   │   ├── ClienteFormModal.jsx             [CREAR]
│   │   ├── ClienteSelector.jsx              [CREAR]
│   │   ├── CotizacionCard.jsx               [CREAR]
│   │   ├── CotizacionFormWizard.jsx         [CREAR] - Multi-paso
│   │   ├── ProductoSelectorModal.jsx        [CREAR]
│   │   ├── TransporteCalculator.jsx         [CREAR]
│   │   ├── AlquilerCard.jsx                 [CREAR]
│   │   ├── AsignacionElementosModal.jsx     [CREAR]
│   │   ├── RetornoElementosModal.jsx        [CREAR]
│   │   └── AlquilerTimeline.jsx             [CREAR]
│   │
│   └── common/
│       └── DateRangePicker.jsx              [CREAR]
```

---

## 5. API Endpoints

### 5.1 Clientes (ya existe, verificar)

```
GET    /api/clientes                    → Obtener todos
GET    /api/clientes/activos            → Obtener activos
GET    /api/clientes/:id                → Obtener por ID
GET    /api/clientes/buscar?q=          → Buscar
POST   /api/clientes                    → Crear
PUT    /api/clientes/:id                → Actualizar
DELETE /api/clientes/:id                → Eliminar
```

### 5.2 Cotizaciones (modificar)

```
GET    /api/cotizaciones                → Obtener todas
GET    /api/cotizaciones/estado/:estado → Por estado
GET    /api/cotizaciones/:id            → Obtener por ID
GET    /api/cotizaciones/:id/completa   → Con productos y detalles
GET    /api/cotizaciones/cliente/:id    → Por cliente
POST   /api/cotizaciones                → Crear (con productos)
PUT    /api/cotizaciones/:id            → Actualizar
DELETE /api/cotizaciones/:id            → Eliminar

POST   /api/cotizaciones/:id/aprobar    → Aprobar y crear alquiler
POST   /api/cotizaciones/:id/rechazar   → Rechazar
POST   /api/cotizaciones/:id/duplicar   → Duplicar cotización
```

### 5.3 Alquileres (modificar)

```
GET    /api/alquileres                  → Obtener todos
GET    /api/alquileres/estado/:estado   → Por estado
GET    /api/alquileres/activos          → Activos
GET    /api/alquileres/programados      → Programados
GET    /api/alquileres/:id              → Obtener por ID
GET    /api/alquileres/:id/elementos    → Elementos asignados

POST   /api/alquileres/:id/salida       → Marcar salida + asignar elementos
POST   /api/alquileres/:id/retorno      → Marcar retorno + revisar elementos
POST   /api/alquileres/:id/cancelar     → Cancelar

GET    /api/alquileres/calendario       → Para vista de calendario
GET    /api/alquileres/disponibilidad   → Verificar disponibilidad de elementos
```

### 5.4 Tarifas de Transporte (nuevo)

```
GET    /api/tarifas-transporte          → Obtener todas
GET    /api/tarifas-transporte/:id      → Obtener por ID
GET    /api/tarifas-transporte/ciudad/:ciudad → Por ciudad
POST   /api/tarifas-transporte          → Crear
PUT    /api/tarifas-transporte/:id      → Actualizar
DELETE /api/tarifas-transporte/:id      → Eliminar

GET    /api/tarifas-transporte/calcular → Calcular costo (ciudad + camiones)
```

---

## 6. Fases de Implementación

### Fase 1: Base de Datos y Modelos (Backend)
1. Crear migraciones SQL
2. Ejecutar migraciones
3. Crear/modificar modelos
4. Tests de modelos

### Fase 2: Controladores y Rutas (Backend)
1. Modificar cotizacionController para múltiples productos
2. Crear servicios de cálculo de transporte
3. Crear servicios de asignación de elementos
4. Modificar alquilerController para gestión de elementos
5. Crear tarifaTransporteController

### Fase 3: API Frontend
1. Crear clientes API (Axios)
2. Crear hooks de React Query
3. Tests de integración

### Fase 4: UI Clientes
1. ClientesPage (lista)
2. ClienteFormModal
3. ClienteSelector para uso en cotizaciones

### Fase 5: UI Cotizaciones
1. CotizacionesPage (lista con filtros)
2. CotizacionFormWizard (multi-paso)
3. ProductoSelectorModal
4. TransporteCalculator
5. CotizacionDetallePage

### Fase 6: UI Alquileres
1. AlquileresPage (dashboard)
2. AlquilerCard con estados visuales
3. AsignacionElementosModal (para marcar salida)
4. RetornoElementosModal (para marcar retorno)
5. AlquilerDetallePage
6. AlquilerTimeline (historial visual)

### Fase 7: Configuración
1. TarifasTransportePage
2. Integración con ubicaciones existentes

---

## 7. Modelo de Datos - Diagrama

```
┌─────────────────┐      ┌──────────────────────┐
│    clientes     │      │     ubicaciones      │
├─────────────────┤      ├──────────────────────┤
│ id              │      │ id                   │
│ tipo_documento  │      │ nombre               │
│ numero_documento│      │ ciudad               │
│ nombre          │      │ ...                  │
│ telefono        │      └──────────┬───────────┘
│ email           │                 │
│ direccion       │                 │
│ ciudad          │                 │
│ notas           │      ┌──────────┴───────────┐
│ activo          │      │  tarifas_transporte  │
└────────┬────────┘      ├──────────────────────┤
         │               │ id                   │
         │               │ ciudad               │
         │               │ zona                 │
         │               │ precio_camion        │
         │               └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────┐
│                  cotizaciones                   │
├─────────────────────────────────────────────────┤
│ id                                              │
│ cliente_id ────────────────────────────────────►│
│ fecha_evento                                    │
│ fecha_fin_evento                                │
│ evento_nombre                                   │
│ evento_ciudad                                   │
│ ubicacion_id ──────────────────────────────────►│
│ direccion_evento                                │
│ cantidad_camiones                               │
│ costo_transporte                                │
│ subtotal, descuento, total                      │
│ estado (pendiente/aprobada/rechazada/vencida)   │
└─────────────────────┬───────────────────────────┘
                      │
                      │ 1:N
                      ▼
         ┌────────────────────────────┐
         │    cotizacion_productos    │
         ├────────────────────────────┤
         │ id                         │
         │ cotizacion_id ────────────►│
         │ compuesto_id ─────────────►│ elementos_compuestos
         │ cantidad                   │
         │ precio_base                │
         │ subtotal                   │
         └─────────────┬──────────────┘
                       │
                       │ 1:N
                       ▼
              ┌──────────────────────┐
              │  cotizacion_detalles │ (componentes elegidos)
              ├──────────────────────┤
              │ id                   │
              │ cotizacion_id        │
              │ cotizacion_producto_id│
              │ elemento_id ────────►│ elementos
              │ cantidad             │
              │ precio_unitario      │
              └──────────────────────┘


┌─────────────────────────────────────────────────┐
│                   alquileres                    │
├─────────────────────────────────────────────────┤
│ id                                              │
│ cotizacion_id ─────────────────────────────────►│
│ fecha_salida                                    │
│ fecha_retorno_esperado                          │
│ fecha_retorno_real                              │
│ total, deposito_cobrado, costo_danos            │
│ estado (programado/activo/finalizado/cancelado) │
└─────────────────────┬───────────────────────────┘
                      │
                      │ 1:N
                      ▼
         ┌────────────────────────────┐
         │     alquiler_elementos     │
         ├────────────────────────────┤
         │ id                         │
         │ alquiler_id ──────────────►│
         │ elemento_id ──────────────►│ elementos
         │ serie_id ─────────────────►│ series (si aplica)
         │ lote_id ──────────────────►│ lotes (si aplica)
         │ cantidad_lote              │
         │ estado_salida              │
         │ estado_retorno             │
         │ costo_dano                 │
         │ ubicacion_original_id ────►│ ubicaciones
         └────────────────────────────┘
```

---

## 8. Estados y Transiciones

### Cotización
```
PENDIENTE ──┬──► APROBADA ──► (crea alquiler)
            │
            ├──► RECHAZADA
            │
            └──► VENCIDA (automático por fecha)
```

### Alquiler
```
PROGRAMADO ──► ACTIVO ──┬──► FINALIZADO
                        │
                        └──► CANCELADO
```

### Elementos (Series/Lotes) durante alquiler
```
bueno ──► alquilado ──┬──► bueno (retorno OK)
                      │
                      ├──► dañado (retorno con daño)
                      │
                      └──► perdido (no retornó)
```

---

## 9. Cálculo de Totales

```javascript
// Pseudocódigo del cálculo
const calcularTotalCotizacion = (productos, transporte, descuento) => {
  // 1. Sumar productos
  let subtotalProductos = 0;
  for (const prod of productos) {
    const precioProducto = prod.precio_base * prod.cantidad;
    const precioAdicionales = calcularAdicionales(prod.detalles);
    subtotalProductos += precioProducto + precioAdicionales;
  }

  // 2. Calcular transporte
  const costoTransporte = transporte.precioCamion * transporte.cantidadCamiones;

  // 3. Subtotal
  const subtotal = subtotalProductos + costoTransporte;

  // 4. Aplicar descuento
  const totalDescuento = descuento || 0;

  // 5. Total final
  const total = subtotal - totalDescuento;

  // 6. Depósito sugerido (ej: 30% del total productos)
  const depositoSugerido = subtotalProductos * 0.30;

  return {
    subtotalProductos,
    costoTransporte,
    subtotal,
    descuento: totalDescuento,
    total,
    depositoSugerido
  };
};
```

---

## 10. Próximos Pasos

1. **Revisar este plan** y confirmar los requisitos
2. **Ejecutar migraciones** de base de datos
3. **Implementar backend** fase por fase
4. **Implementar frontend** componente por componente
5. **Pruebas de integración**
6. **Ajustes según feedback**

---

## Notas Adicionales

- La tabla de clientes ya existe y está funcional
- Los elementos compuestos ya tienen precio_base y deposito definidos
- Las ubicaciones ya existen y pueden usarse para el cálculo de transporte
- El sistema de series/lotes ya maneja estados, solo hay que integrar la lógica de alquiler
