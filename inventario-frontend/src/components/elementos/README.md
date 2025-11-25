# 📦 Componentes de Elementos - Guía de Uso

## 📋 Índice
- [Estructura de componentes](#estructura-de-componentes)
- [Componentes de Series](#componentes-de-series)
- [Componentes de Lotes](#componentes-de-lotes)
- [Integración con Hooks](#integración-con-hooks)
- [Ejemplos completos](#ejemplos-completos)

---

## 🏗️ Estructura de Componentes

```
src/components/
├── common/
│   ├── Badge.jsx (✏️ con EstadoBadge)
│   ├── Card.jsx (✏️ con menú de opciones)
│   ├── StatCard.jsx (🆕)
│   ├── AlertaBanner.jsx (🆕)
│   └── UbicacionBadge.jsx (🆕)
│
└── elementos/
    ├── series/
    │   ├── SerieItem.jsx (🆕)
    │   └── ElementoSerieCard.jsx (🆕)
    │
    ├── lotes/
    │   ├── LoteUbicacionGroup.jsx (🆕)
    │   └── ElementoLoteCard.jsx (🆕)
    │
    └── ElementosExample.jsx (📚 ejemplos)
```

---

## 🎯 Componentes de Series

### SerieItem.jsx
Item individual de una serie (elemento con número de serie único).

**Props:**
```jsx
<SerieItem
  serie={{
    numero_serie: "DOITE-001",
    estado: "bueno",
    ubicacion: "Bodega A",
    con_alquiler: false,
    alquiler: { cliente: "...", fecha_devolucion: "..." }
  }}
  onEdit={(serie) => {}}
  onDelete={(serie) => {}}
  onMove={(serie) => {}}
  onClick={(serie) => {}}
  compact={false}
/>
```

**Características:**
- ✅ Vista normal y compacta
- ✅ Menú de opciones (editar, mover, eliminar)
- ✅ Muestra estado, ubicación y datos de alquiler
- ✅ Clickeable opcional

---

### ElementoSerieCard.jsx
Card principal para elementos gestionados por series.

**Props:**
```jsx
<ElementoSerieCard
  elemento={{
    nombre: "Carpa Doite 4P",
    icono: "🏕️",
    series: [...],
    estadisticas: {
      total: 10,
      disponible: 5,
      alquilado: 3,
      mantenimiento: 2
    },
    alertas: [
      {
        tipo: "warning",
        mensaje: "Devolución HOY",
        detalles: { cliente: "Juan", telefono: "300-123-4567" }
      }
    ]
  }}
  onEdit={(elemento) => {}}
  onDelete={(elemento) => {}}
  onAddSerie={(elemento) => {}}
  onEditSerie={(serie) => {}}
  onDeleteSerie={(serie) => {}}
  onMoveSerie={(serie) => {}}
/>
```

**Características:**
- ✅ Estadísticas por estado (4 cards)
- ✅ Lista de series con paginación
- ✅ Alertas de devoluciones
- ✅ Botón agregar nueva serie
- ✅ EmptyState cuando no hay series
- ✅ Menú de opciones del elemento

---

## 📊 Componentes de Lotes

### LoteUbicacionGroup.jsx
Agrupa lotes por ubicación.

**Props:**
```jsx
<LoteUbicacionGroup
  ubicacion={{
    nombre: "Bodega A",
    cantidad_total: 50,
    lotes: [
      { estado: "nuevo", cantidad: 20 },
      { estado: "bueno", cantidad: 30 }
    ]
  }}
  onEditLote={(lote, ubicacion) => {}}
  onMoveLote={(lote, ubicacion) => {}}
  onDeleteLote={(lote, ubicacion) => {}}
  compact={false}
/>
```

**Características:**
- ✅ Vista expandible/colapsable
- ✅ Sub-componente LoteItem con menú de opciones
- ✅ Muestra cantidad total por ubicación
- ✅ Vista compacta opcional

---

### ElementoLoteCard.jsx
Card principal para elementos gestionados por lotes.

**Props:**
```jsx
<ElementoLoteCard
  elemento={{
    nombre: "Estaca 20cm",
    icono: "📌",
    ubicaciones: [
      {
        nombre: "Bodega A",
        cantidad_total: 50,
        lotes: [...]
      }
    ],
    estadisticas: {
      total: 150,
      nuevo: 50,
      bueno: 80,
      danado: 20
    },
    alertas: []
  }}
  onEdit={(elemento) => {}}
  onDelete={(elemento) => {}}
  onAddLote={(elemento) => {}}
  onEditLote={(lote, ubicacion) => {}}
  onMoveLote={(lote, ubicacion) => {}}
  onDeleteLote={(lote, ubicacion) => {}}
/>
```

**Características:**
- ✅ Estadísticas por los 5 estados
- ✅ Grupos expandibles por ubicación
- ✅ Resumen de ubicaciones y cantidades totales
- ✅ Botón agregar nuevo lote
- ✅ EmptyState cuando no hay lotes

---

## 🔗 Integración con Hooks

### Ejemplo 1: ElementoSerieCard con useGetSeries

```jsx
import { useGetSeries } from '../../hooks/Useseries'
import ElementoSerieCard from '../elementos/series/ElementoSerieCard'

function ElementoSerieView({ elementoId }) {
  // 1. Hook para obtener datos
  const {
    series,
    elemento,
    estadisticas,
    isLoading,
    error
  } = useGetSeries(elementoId)

  // 2. Handlers
  const handleAddSerie = (elemento) => {
    // Abrir modal para agregar serie
  }

  const handleEditSerie = (serie) => {
    // Abrir modal para editar
  }

  // 3. Estados de carga
  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage />

  // 4. Transformar datos
  const elementoData = {
    nombre: elemento?.nombre,
    icono: elemento?.icono,
    series: series || [],
    estadisticas: {
      total: estadisticas?.total || 0,
      disponible: estadisticas?.disponible || 0,
      alquilado: estadisticas?.alquilado || 0,
      mantenimiento: estadisticas?.mantenimiento || 0
    },
    alertas: []
  }

  // 5. Renderizar
  return (
    <ElementoSerieCard
      elemento={elementoData}
      onAddSerie={handleAddSerie}
      onEditSerie={handleEditSerie}
      // ... otros handlers
    />
  )
}
```

---

### Ejemplo 2: ElementoLoteCard con useGetLotes

```jsx
import { useGetLotes } from '../../hooks/Uselotes'
import ElementoLoteCard from '../elementos/lotes/ElementoLoteCard'

function ElementoLoteView({ elementoId }) {
  // 1. Hook para obtener datos
  const {
    lotes,
    elemento,
    estadisticas,
    lotes_por_ubicacion,
    cantidad_total,
    isLoading,
    error
  } = useGetLotes(elementoId)

  // 2. Handlers
  const handleMoveLote = (lote, ubicacion) => {
    // Abrir modal para mover cantidad
  }

  // 3. Estados de carga
  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage />

  // 4. Datos ya vienen en formato correcto
  const elementoData = {
    nombre: elemento?.nombre,
    icono: elemento?.icono,
    ubicaciones: lotes_por_ubicacion || [],
    estadisticas: {
      total: cantidad_total || 0,
      nuevo: estadisticas?.nuevo || 0,
      bueno: estadisticas?.bueno || 0,
      mantenimiento: estadisticas?.mantenimiento || 0,
      danado: estadisticas?.danado || 0
    },
    alertas: []
  }

  // 5. Renderizar
  return (
    <ElementoLoteCard
      elemento={elementoData}
      onMoveLote={handleMoveLote}
      // ... otros handlers
    />
  )
}
```

---

## 📚 Ejemplos Completos

Ver archivo `ElementosExample.jsx` para ejemplos completos con:
- ✅ Integración hooks + componentes
- ✅ Transformación de datos
- ✅ Handlers completos
- ✅ Manejo de estados de carga y error

---

## 🎯 Próximos Pasos

### 1. Formularios
Crear formularios modales para:
- [ ] Agregar/editar elemento
- [ ] Agregar/editar serie
- [ ] Agregar/mover lote
- [ ] Cambiar estado de serie
- [ ] Mover cantidad entre lotes

### 2. Páginas
Crear páginas completas:
- [ ] `ElementosPage.jsx` - Lista de elementos por subcategoría
- [ ] `ElementoDetallePage.jsx` - Detalle completo de un elemento

### 3. Mutations
Integrar mutations de los hooks:
- [ ] `useCreateSerie`
- [ ] `useUpdateSerie`
- [ ] `useDeleteSerie`
- [ ] `useMoverCantidad`
- [ ] `useAjustarLote`

### 4. Validaciones
- [ ] Validar cantidad antes de mover lote
- [ ] Confirmar eliminaciones
- [ ] Validar números de serie únicos
- [ ] Validar transiciones de estado

---

## 💡 Tips de Desarrollo

### 1. **Usa los hooks existentes**
Los hooks en `/hooks/` ya están probados y funcionan correctamente:
- `useGetSeries(elementoId)` - Para elementos con series
- `useGetLotes(elementoId)` - Para elementos con lotes
- `useGetElementos(subcategoriaId)` - Para listar elementos

### 2. **Los datos ya vienen transformados**
Los hooks ya devuelven:
- ✅ `series` agrupadas correctamente
- ✅ `estadisticas` calculadas
- ✅ `lotes_por_ubicacion` agrupados
- Solo necesitas mapear a las props del componente UI

### 3. **Maneja los estados de carga**
Siempre valida:
```jsx
if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
if (!data) return <EmptyState />
```

### 4. **Usa los componentes comunes**
Aprovecha los componentes existentes:
- `Badge` / `EstadoBadge` para estados
- `StatCard` para estadísticas
- `AlertaBanner` para notificaciones
- `UbicacionBadge` para ubicaciones
- `EmptyState` cuando no hay datos
- `Modal` para formularios

---

## 🐛 Troubleshooting

### Error: "Cannot read property 'map' of undefined"
**Solución:** Agrega valores por defecto en la destructuración:
```jsx
const { series = [] } = useGetSeries(elementoId)
```

### Error: Import no encontrado
**Solución:** Verifica las rutas relativas:
```jsx
// ✅ Correcto
import ElementoSerieCard from '../elementos/series/ElementoSerieCard'

// ❌ Incorrecto
import ElementoSerieCard from './ElementoSerieCard'
```

### Las estadísticas no se actualizan
**Solución:** Invalida el caché después de mutations:
```jsx
queryClient.invalidateQueries(['series', 'elemento', elementoId])
```

---

## 📞 Contacto y Soporte

Si tienes dudas sobre cómo usar estos componentes:
1. Revisa los ejemplos en `ElementosExample.jsx`
2. Consulta los hooks en `/hooks/`
3. Revisa los comentarios en el código fuente

---

**Última actualización:** 2024-01-15
**Versión:** 1.0.0
