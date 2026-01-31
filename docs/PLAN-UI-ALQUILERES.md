# Plan de Implementación: UI del Módulo de Alquileres

## Objetivo

Crear la interfaz de usuario para gestionar alquileres activos y programados, permitiendo:
- Ver dashboard de alquileres
- Marcar salida (asignar elementos físicos)
- Marcar retorno (registrar estado de devolución)
- Ver detalle completo de cada alquiler

---

## 1. Componentes a Implementar

### 1.1 AlquileresPage (Dashboard Principal)

**Archivo:** `inventario-frontend/src/pages/AlquileresPage.jsx`

**Descripción:** Página principal del módulo que muestra todos los alquileres organizados por estado.

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver a Módulos                                             │
│                                                                 │
│  📦 Alquileres                                                  │
│  Gestiona los alquileres activos y programados                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ESTADÍSTICAS                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │📅 Programados│ │🚀 Activos │ │✅ Finalizados│ │❌ Cancelados│  │
│  │     5      │ │     3     │ │    12     │ │     2     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar por cliente o evento...          [Filtros ▼]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TABS: [Activos] [Programados] [Finalizados] [Todos]           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AlquilerCard                                             │   │
│  │ Evento: Boda García  |  Cliente: Juan Pérez             │   │
│  │ 📅 Salida: 15/01  →  Retorno: 20/01                      │   │
│  │ 📦 8 elementos asignados                                 │   │
│  │ 💰 Total: $2,500,000                                     │   │
│  │ Estado: 🟢 ACTIVO                                        │   │
│  │                     [Ver Detalle] [Marcar Retorno]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AlquilerCard                                             │   │
│  │ Evento: Fiesta Corp  |  Cliente: Empresa XYZ            │   │
│  │ 📅 Salida: 25/01  →  Retorno: 27/01                      │   │
│  │ 📦 Elementos: Pendientes de asignar                      │   │
│  │ 💰 Total: $1,800,000                                     │   │
│  │ Estado: 📅 PROGRAMADO                                    │   │
│  │                     [Ver Detalle] [Marcar Salida]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Estadísticas de alquileres por estado
- Filtrado por estado (tabs)
- Búsqueda por cliente/evento
- Acciones rápidas desde las cards

**Datos del API:**
- `GET /api/alquileres` - Lista todos
- `GET /api/alquileres/estadisticas` - Estadísticas

---

### 1.2 AlquilerCard

**Archivo:** `inventario-frontend/src/components/cards/AlquilerCard.jsx`

**Props:**
```javascript
{
  alquiler: {
    id: number,
    cotizacion_id: number,
    evento_nombre: string,
    cliente_nombre: string,
    fecha_salida: date,
    fecha_retorno_esperado: date,
    fecha_retorno_real: date | null,
    total: number,
    deposito_cobrado: number,
    costo_danos: number,
    estado: 'programado' | 'activo' | 'finalizado' | 'cancelado',
    total_elementos: number
  },
  onVerDetalle: (id) => void,
  onMarcarSalida: (id) => void,
  onMarcarRetorno: (id) => void
}
```

**Estados visuales:**
| Estado | Color | Icono | Acciones |
|--------|-------|-------|----------|
| programado | Amarillo | 📅 | Ver Detalle, Marcar Salida |
| activo | Verde | 🚀 | Ver Detalle, Marcar Retorno |
| finalizado | Azul | ✅ | Ver Detalle |
| cancelado | Rojo | ❌ | Ver Detalle |

---

### 1.3 AlquilerDetallePage

**Archivo:** `inventario-frontend/src/pages/AlquilerDetallePage.jsx`

**Ruta:** `/alquileres/:id`

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver a Alquileres                                          │
│                                                                 │
│  ALQUILER #123                                     [Estado: 🟢] │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INFORMACIÓN GENERAL                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cliente: Juan Pérez                                      │   │
│  │ Evento: Boda García                                      │   │
│  │ Dirección: Calle 123, Bogotá                            │   │
│  │ Fecha Salida: 15/01/2026 10:00                          │   │
│  │ Retorno Esperado: 20/01/2026                            │   │
│  │ Retorno Real: -                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  RESUMEN FINANCIERO                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Total     │ │ Depósito  │ │ Daños    │                       │
│  │$2,500,000 │ │ $500,000  │ │   $0     │                       │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
│  TIMELINE                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● Cotización creada         10/01/2026 09:00            │   │
│  │ ● Cotización aprobada       12/01/2026 14:30            │   │
│  │ ● Alquiler programado       12/01/2026 14:30            │   │
│  │ ● Elementos asignados (8)   14/01/2026 16:00            │   │
│  │ ● Salida marcada            15/01/2026 10:00            │   │
│  │ ○ Retorno pendiente         20/01/2026                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PRODUCTOS COTIZADOS                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Producto           │ Cantidad │ Precio    │ Subtotal    │   │
│  │ Carpa 6x12         │    2     │ $800,000  │ $1,600,000  │   │
│  │ Sillas plásticas   │   100    │  $5,000   │   $500,000  │   │
│  │ Mesas redondas     │   10     │ $40,000   │   $400,000  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ELEMENTOS ASIGNADOS                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Elemento    │ Serie/Lote │ Cantidad │ Salida  │ Retorno │   │
│  │ Lona 6x12   │ LN-001     │    1     │ Bueno   │    -    │   │
│  │ Lona 6x12   │ LN-003     │    1     │ Bueno   │    -    │   │
│  │ Estructura  │ EST-015    │    1     │ Bueno   │    -    │   │
│  │ Estructura  │ EST-018    │    1     │ Bueno   │    -    │   │
│  │ Sillas      │ Lote L-045 │   100    │ Bueno   │    -    │   │
│  │ Mesas       │ Lote M-012 │   10     │ Bueno   │    -    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ACCIONES                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Asignar Elementos] [Cambiar Elemento] [Marcar Retorno] │   │
│  │ [Ver Cotización] [Imprimir]                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Datos del API:**
- `GET /api/alquileres/:id/completo` - Alquiler con productos y elementos

---

### 1.4 AsignacionElementosModal

**Archivo:** `inventario-frontend/src/components/modals/AsignacionElementosModal.jsx`

**Descripción:** Modal para asignar elementos físicos (series/lotes) al momento de marcar salida.

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ASIGNAR ELEMENTOS - MARCAR SALIDA                    [X]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alquiler: Boda García - Juan Pérez                            │
│  Fecha salida: 15/01/2026                                       │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  📦 CARPA 6X12 (necesita 2 unidades)                           │
│                                                                 │
│  Lonas 6x12 (seleccionar 2):                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ LN-001 │ Bodega Central │ Bueno │ Disponible          │   │
│  │ ☑ LN-003 │ Bodega Central │ Bueno │ Disponible          │   │
│  │ ☐ LN-005 │ Bodega Norte   │ Bueno │ Disponible          │   │
│  │ ☐ LN-007 │ Bodega Central │ Mant. │ No disponible       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ 2 de 2 seleccionadas                                        │
│                                                                 │
│  Estructuras 6x12 (seleccionar 2):                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ EST-015 │ Bodega Central │ Bueno │ Disponible         │   │
│  │ ☑ EST-018 │ Bodega Central │ Bueno │ Disponible         │   │
│  │ ☐ EST-020 │ Bodega Norte   │ Bueno │ Disponible         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ 2 de 2 seleccionadas                                        │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  📦 SILLAS PLÁSTICAS (necesita 100 unidades)                   │
│                                                                 │
│  Seleccionar de lotes disponibles:                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lote     │ Ubicación      │ Disponibles │ Asignar       │   │
│  │ L-045    │ Bodega Central │    250      │ [   100   ]   │   │
│  │ L-048    │ Bodega Norte   │    150      │ [     0   ]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ✓ 100 de 100 asignadas                                        │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  NOTAS DE SALIDA                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │ (Opcional: observaciones al momento de salida)          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RESUMEN:                                                       │
│  • 4 series seleccionadas (Lonas: 2, Estructuras: 2)           │
│  • 100 unidades de lotes                                        │
│  • Total: 6 elementos                                           │
│                                                                 │
│                      [Cancelar]   [✓ Confirmar Salida]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  alquilerId: number,
  onSuccess: () => void
}
```

**Flujo:**
1. Cargar productos del alquiler (desde cotización)
2. Para cada producto, mostrar elementos disponibles
3. Series: checkbox múltiple
4. Lotes: input numérico con validación de disponibilidad
5. Al confirmar: `POST /api/alquileres/:id/salida`

---

### 1.5 RetornoElementosModal

**Archivo:** `inventario-frontend/src/components/modals/RetornoElementosModal.jsx`

**Descripción:** Modal para registrar el estado de retorno de cada elemento.

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  REGISTRAR RETORNO                                     [X]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Alquiler: Boda García - Juan Pérez                            │
│  Fecha retorno esperado: 20/01/2026                             │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ELEMENTOS A RETORNAR                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lona 6x12 - Serie LN-001                                 │   │
│  │ Estado: [Bueno     ▼]                                    │   │
│  │ Costo daño: $[         ]                                 │   │
│  │ Notas: [                                            ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lona 6x12 - Serie LN-003                                 │   │
│  │ Estado: [Dañado    ▼]                                    │   │
│  │ Costo daño: $[   50,000 ]                                │   │
│  │ Notas: [ Rasgadura en esquina inferior              ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Estructura 6x12 - Serie EST-015                          │   │
│  │ Estado: [Bueno     ▼]                                    │   │
│  │ Costo daño: $[         ]                                 │   │
│  │ Notas: [                                            ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Estructura 6x12 - Serie EST-018                          │   │
│  │ Estado: [Bueno     ▼]                                    │   │
│  │ Costo daño: $[         ]                                 │   │
│  │ Notas: [                                            ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sillas plásticas - Lote L-045 (100 unidades)            │   │
│  │ Estado: [Bueno     ▼]                                    │   │
│  │ Unidades perdidas: [  2  ]                               │   │
│  │ Costo daño: $[   20,000 ]                                │   │
│  │ Notas: [ 2 sillas rotas                             ]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  NOTAS GENERALES DEL RETORNO                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │ (Observaciones generales del retorno)                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  RESUMEN FINANCIERO                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Total daños:           $70,000                          │   │
│  │ Depósito cobrado:     $500,000                          │   │
│  │ ─────────────────────────────────                       │   │
│  │ Saldo a devolver:     $430,000                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                      [Cancelar]   [✓ Confirmar Retorno]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Estados de retorno:**
- `bueno` - Elemento en buen estado, vuelve a disponible
- `dañado` - Elemento dañado, va a mantenimiento
- `perdido` - Elemento no retornado, se da de baja

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  alquilerId: number,
  onSuccess: () => void
}
```

**Flujo:**
1. Cargar elementos asignados del alquiler
2. Para cada elemento, permitir registrar estado
3. Calcular total de daños
4. Mostrar resumen vs depósito
5. Al confirmar: `POST /api/alquileres/:id/retorno`

---

### 1.6 AlquilerTimeline

**Archivo:** `inventario-frontend/src/components/alquileres/AlquilerTimeline.jsx`

**Descripción:** Componente visual que muestra el historial de un alquiler.

**Props:**
```javascript
{
  cotizacion: {
    created_at: date,
    estado: string,
    fecha_aprobacion: date
  },
  alquiler: {
    created_at: date,
    fecha_salida: date,
    fecha_retorno_real: date,
    estado: string
  },
  elementos: [
    { fecha_asignacion: date, fecha_retorno: date }
  ]
}
```

**Eventos del timeline:**
1. ● Cotización creada (fecha)
2. ● Cotización aprobada (fecha)
3. ● Alquiler programado (fecha)
4. ● Elementos asignados (fecha, cantidad)
5. ● Salida marcada (fecha)
6. ● Retorno registrado (fecha) / ○ Pendiente

---

## 2. Estructura de Archivos a Crear

```
inventario-frontend/src/
├── pages/
│   ├── AlquileresPage.jsx              [CREAR]
│   └── AlquilerDetallePage.jsx         [CREAR]
│
├── components/
│   ├── cards/
│   │   └── AlquilerCard.jsx            [CREAR]
│   │
│   ├── modals/
│   │   ├── AsignacionElementosModal.jsx [CREAR]
│   │   └── RetornoElementosModal.jsx    [CREAR]
│   │
│   └── alquileres/
│       └── AlquilerTimeline.jsx         [CREAR]
│
└── routes/
    └── AppRoutes.jsx                    [MODIFICAR - agregar rutas]
```

---

## 3. Rutas a Agregar

```javascript
// En AppRoutes.jsx agregar:
<Route path="/alquileres/gestion" element={<AlquileresPage />} />
<Route path="/alquileres/gestion/:id" element={<AlquilerDetallePage />} />
```

---

## 4. APIs ya Disponibles (Backend listo)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/alquileres` | GET | Lista todos los alquileres |
| `/api/alquileres/activos` | GET | Solo activos |
| `/api/alquileres/programados` | GET | Solo programados |
| `/api/alquileres/estadisticas` | GET | Estadísticas por estado |
| `/api/alquileres/:id` | GET | Alquiler por ID |
| `/api/alquileres/:id/completo` | GET | Con productos y elementos |
| `/api/alquileres/:id/elementos` | GET | Elementos asignados |
| `/api/alquileres/:id/elementos` | POST | Asignar elementos |
| `/api/alquileres/:id/salida` | POST | Marcar salida |
| `/api/alquileres/:id/retorno` | POST | Marcar retorno |
| `/api/alquileres/:id/cancelar` | POST | Cancelar alquiler |
| `/api/disponibilidad/cotizacion/:id` | GET | Elementos disponibles |

---

## 5. Hooks ya Disponibles

```javascript
// En useAlquileres.js ya existen:
useGetAlquileres()
useGetAlquileresActivos()
useGetAlquileresProgramados()
useGetAlquilerById(id)
useGetAlquilerCompleto(id)
useGetAlquilerElementos(id)
useGetAlquilerEstadisticas()
useMarcarSalida()
useMarcarRetorno()
useAsignarElementos()
useCancelarAlquiler()
```

---

## 6. Orden de Implementación

### Fase 1: Componentes Base
1. `AlquilerCard.jsx` - Tarjeta de alquiler
2. `AlquilerTimeline.jsx` - Timeline visual

### Fase 2: Páginas
3. `AlquileresPage.jsx` - Dashboard principal
4. `AlquilerDetallePage.jsx` - Detalle del alquiler

### Fase 3: Modales de Operación
5. `AsignacionElementosModal.jsx` - Marcar salida
6. `RetornoElementosModal.jsx` - Marcar retorno

### Fase 4: Integración
7. Agregar rutas en `AppRoutes.jsx`
8. Agregar navegación desde `CotizacionesPage.jsx`
9. Pruebas de integración

---

## 7. Dependencias

- Componentes comunes existentes: `Button`, `Spinner`, `EmptyState`, `Modal`
- Iconos de `lucide-react`
- Toast notifications con `sonner`
- React Query para manejo de estado

---

## 8. Consideraciones

### UX
- Mostrar indicadores visuales claros de estado
- Validar disponibilidad antes de permitir asignación
- Confirmar acciones destructivas (marcar retorno con daños)
- Mostrar resumen financiero en retorno

### Validaciones
- No permitir marcar salida sin elementos asignados
- No permitir asignar elementos ya en otro alquiler
- No permitir retornar más unidades de las asignadas
- Validar que costo_dano sea > 0 si estado es 'dañado'

### Estados
- Deshabilitar botones según estado del alquiler
- Mostrar advertencias si retorno está vencido
- Indicar elementos pendientes de asignar
