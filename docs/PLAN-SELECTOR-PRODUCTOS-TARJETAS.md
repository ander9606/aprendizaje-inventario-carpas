# Plan: Selector de Productos con Tarjetas

## Resumen

Reemplazar el selector dropdown actual de productos por una interfaz visual de tarjetas que muestre imágenes, precios y disponibilidad en tiempo real.

---

## 1. PROBLEMA ACTUAL

### Flujo Actual (Select/Dropdown)
```
┌─────────────────────────────────────────────────────────┐
│ Agregar Producto:                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Seleccionar producto...                         ▼] │ │
│ │  • Carpa 10x10 Premium - $850,000                   │ │
│ │  • Carpa 6x6 Económica - $450,000                   │ │
│ │  • Silla plástica - $5,000                          │ │
│ └─────────────────────────────────────────────────────┘ │
│ Cantidad: [___1___]     [Agregar]                        │
└─────────────────────────────────────────────────────────┘
```

### Problemas
| # | Problema | Impacto |
|---|----------|---------|
| 1 | Solo texto, sin imágenes | Usuario no visualiza el producto |
| 2 | Sin información de disponibilidad | No sabe si hay stock para las fechas |
| 3 | Difícil comparar productos | Debe abrir/cerrar el dropdown |
| 4 | Sin filtros | Lista larga difícil de navegar |
| 5 | Sin desglose de componentes | No ve qué incluye cada producto |

---

## 2. SOLUCIÓN PROPUESTA

### Nuevo Flujo (Tarjetas)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ SELECCIONAR PRODUCTOS                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...]  [Categoría ▼]  [Precio ▼]  [☑ Solo disponibles]         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│ │ ┌────────────────┐ │  │ ┌────────────────┐ │  │ ┌────────────────┐ │  │
│ │ │    [IMAGEN]    │ │  │ │    [IMAGEN]    │ │  │ │    [IMAGEN]    │ │  │
│ │ └────────────────┘ │  │ └────────────────┘ │  │ └────────────────┘ │  │
│ │ Carpa 10x10 Premium│  │ Carpa 6x6 Económica│  │ Silla Tiffany      │  │
│ │ ─────────────────  │  │ ─────────────────  │  │ ─────────────────  │  │
│ │ $850,000 / evento  │  │ $450,000 / evento  │  │ $15,000 / unidad   │  │
│ │ Depósito: $500,000 │  │ Depósito: $250,000 │  │ Depósito: $10,000  │  │
│ │                    │  │                    │  │                    │  │
│ │ ✅ Disponible (5)  │  │ ⚠️ Parcial (2/4)   │  │ ❌ No disponible   │  │
│ │                    │  │                    │  │                    │  │
│ │ [-] 1 [+]  [➕ Add]│  │ [-] 2 [+]  [➕ Add]│  │ Ver componentes    │  │
│ └────────────────────┘  └────────────────────┘  └────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENTES A CREAR

### 3.1 ProductoCardSelector (Contenedor Principal)
```jsx
// Componente contenedor con filtros y grid de tarjetas
<ProductoCardSelector
  fechaInicio={fechaMontaje}
  fechaFin={fechaDesmontaje}
  onProductoAgregado={(producto, cantidad) => {...}}
  productosSeleccionados={[...]}
/>
```

**Responsabilidades:**
- Cargar productos desde API
- Manejar filtros (categoría, precio, búsqueda)
- Calcular disponibilidad por fechas
- Renderizar grid de tarjetas

### 3.2 ProductoCard (Tarjeta Individual)
```jsx
<ProductoCard
  producto={producto}
  disponibilidad={disponibilidadData}
  onAgregar={(cantidad) => {...}}
  onVerComponentes={() => {...}}
/>
```

**Estados visuales:**
- ✅ `disponible`: Todos los componentes OK (borde verde)
- ⚠️ `parcial`: Algunos componentes limitados (borde amarillo)
- ❌ `no-disponible`: Componentes críticos faltantes (borde rojo, deshabilitado)

### 3.3 ComponentesModal (Desglose)
```jsx
<ComponentesModal
  isOpen={showModal}
  producto={productoSeleccionado}
  cantidad={cantidadSolicitada}
  fechaInicio={fechaMontaje}
  fechaFin={fechaDesmontaje}
  onClose={() => {...}}
/>
```

**Muestra:**
- Lista de componentes del producto
- Cantidad necesaria vs disponible
- Indicador de estado por componente
- Máximo posible a cotizar

---

## 4. API NECESARIA

### 4.1 Endpoint Existente (Modificar)
```
GET /api/productos/disponibilidad
```

**Query params:**
- `fecha_inicio`: Fecha montaje
- `fecha_fin`: Fecha desmontaje
- `categoria_id`: (opcional) Filtrar por categoría
- `incluir_componentes`: (opcional) true para desglose

**Response mejorado:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Carpa 10x10 Premium",
      "categoria": "Carpas",
      "precio": 850000,
      "deposito": 500000,
      "imagen_url": "/uploads/productos/carpa-10x10.jpg",
      "disponibilidad": {
        "estado": "disponible",
        "max_disponible": 5,
        "componentes": [
          {
            "nombre": "Lona 10x10",
            "necesario_por_unidad": 1,
            "disponible": 8,
            "estado": "ok"
          },
          {
            "nombre": "Tubo central 6m",
            "necesario_por_unidad": 8,
            "disponible": 45,
            "estado": "ok"
          }
        ]
      }
    },
    {
      "id": 2,
      "nombre": "Carpa 6x6 Económica",
      "disponibilidad": {
        "estado": "parcial",
        "max_disponible": 2,
        "componentes": [
          {
            "nombre": "Lona 6x6",
            "necesario_por_unidad": 1,
            "disponible": 5,
            "estado": "ok"
          },
          {
            "nombre": "Tubo lateral 3m",
            "necesario_por_unidad": 4,
            "disponible": 10,
            "estado": "limitado",
            "mensaje": "Solo para 2 carpas"
          }
        ]
      }
    }
  ]
}
```

---

## 5. DISEÑO DE TARJETA

### 5.1 Estructura HTML/JSX
```jsx
<div className="producto-card">
  {/* Imagen */}
  <div className="producto-imagen">
    <img src={producto.imagen_url || placeholder} alt={producto.nombre} />
    {producto.categoria && (
      <span className="categoria-badge">{producto.categoria}</span>
    )}
  </div>

  {/* Info */}
  <div className="producto-info">
    <h4>{producto.nombre}</h4>
    <div className="precios">
      <span className="precio">${formatMoney(producto.precio)}</span>
      <span className="deposito">Depósito: ${formatMoney(producto.deposito)}</span>
    </div>
  </div>

  {/* Disponibilidad */}
  <div className={`disponibilidad ${estado}`}>
    {estado === 'disponible' && <CheckCircle />}
    {estado === 'parcial' && <AlertTriangle />}
    {estado === 'no-disponible' && <XCircle />}
    <span>{mensajeDisponibilidad}</span>
  </div>

  {/* Acciones */}
  <div className="producto-acciones">
    <div className="cantidad-selector">
      <button onClick={() => setCantidad(c => Math.max(1, c - 1))}>-</button>
      <input type="number" value={cantidad} onChange={handleCantidad} />
      <button onClick={() => setCantidad(c => Math.min(maxDisponible, c + 1))}>+</button>
    </div>
    <button
      className="btn-agregar"
      onClick={() => onAgregar(cantidad)}
      disabled={estado === 'no-disponible'}
    >
      Agregar
    </button>
  </div>

  {/* Ver componentes */}
  <button className="btn-componentes" onClick={onVerComponentes}>
    📋 Ver componentes
  </button>
</div>
```

### 5.2 Estilos (Tailwind)
```jsx
// Estados de disponibilidad
const estadoClasses = {
  disponible: 'border-green-300 bg-green-50',
  parcial: 'border-yellow-300 bg-yellow-50',
  'no-disponible': 'border-red-300 bg-red-50 opacity-60'
};

// Badges
const badgeClasses = {
  disponible: 'bg-green-100 text-green-700',
  parcial: 'bg-yellow-100 text-yellow-700',
  'no-disponible': 'bg-red-100 text-red-700'
};
```

---

## 6. LÓGICA DE DISPONIBILIDAD

### 6.1 Cálculo en Backend
```javascript
// services/DisponibilidadService.js
class DisponibilidadService {

  static async calcularDisponibilidadProducto(productoId, cantidad, fechaInicio, fechaFin) {
    // 1. Obtener componentes del producto
    const componentes = await ElementoCompuestoModel.obtenerComponentes(productoId);

    // 2. Para cada componente, verificar disponibilidad
    const resultados = [];
    let maxDisponible = Infinity;
    let estado = 'disponible';

    for (const comp of componentes) {
      const necesario = comp.cantidad * cantidad;
      const disponible = await this.getDisponibilidadElemento(
        comp.elemento_id,
        fechaInicio,
        fechaFin
      );

      const compResult = {
        nombre: comp.elemento_nombre,
        necesario_por_unidad: comp.cantidad,
        disponible,
        estado: disponible >= necesario ? 'ok' : 'limitado'
      };

      if (disponible < necesario) {
        estado = 'parcial';
        compResult.mensaje = `Solo hay ${disponible} disponibles`;
      }

      if (disponible === 0) {
        estado = 'no-disponible';
      }

      // Calcular máximo posible basado en este componente
      const maxPorComp = Math.floor(disponible / comp.cantidad);
      maxDisponible = Math.min(maxDisponible, maxPorComp);

      resultados.push(compResult);
    }

    return {
      estado,
      max_disponible: maxDisponible === Infinity ? 999 : maxDisponible,
      componentes: resultados
    };
  }

  static async getDisponibilidadElemento(elementoId, fechaInicio, fechaFin) {
    // Usar DisponibilidadModel existente
    const result = await DisponibilidadModel.verificarDisponibilidadElemento(
      elementoId,
      fechaInicio,
      fechaFin
    );
    return result.disponible;
  }
}
```

---

## 7. PLAN DE IMPLEMENTACIÓN

### Fase 1: Backend (2-3 tareas)
| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Crear endpoint `/productos/disponibilidad` | `productosController.js` |
| 2 | Crear servicio `DisponibilidadService` | `services/DisponibilidadService.js` |
| 3 | Modificar query para incluir componentes | `ElementoCompuestoModel.js` |

### Fase 2: Frontend - Componentes (4-5 tareas)
| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Crear hook `useProductosDisponibilidad` | `hooks/useProductos.js` |
| 2 | Crear componente `ProductoCard` | `components/productos/ProductoCard.jsx` |
| 3 | Crear componente `ProductoCardSelector` | `components/productos/ProductoCardSelector.jsx` |
| 4 | Crear modal `ComponentesModal` | `components/modals/ComponentesModal.jsx` |
| 5 | Agregar imágenes placeholder | `assets/productos/` |

### Fase 3: Integración (2 tareas)
| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Reemplazar dropdown en `CotizacionFormModal` | `CotizacionFormModal.jsx` |
| 2 | Ajustar estilos y responsividad | Varios |

---

## 8. WIREFRAME DETALLADO

### 8.1 Vista Desktop (Grid 3-4 columnas)
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ SELECCIONAR PRODUCTOS                                               🔍 Buscar... │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Categoría: [Todas ▼]   Precio: [Todos ▼]   [☑ Solo disponibles para 12-15 Feb]  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │  [IMAGEN]    │   │  [IMAGEN]    │   │  [IMAGEN]    │   │  [IMAGEN]    │       │
│  │  ─────────   │   │  ─────────   │   │  ─────────   │   │  ─────────   │       │
│  │ Carpa 10x10  │   │ Carpa 6x6    │   │ Silla Tiff.  │   │ Mesa Redonda │       │
│  │ $850,000     │   │ $450,000     │   │ $15,000      │   │ $35,000      │       │
│  │ ✅ Disp: 5   │   │ ⚠️ Disp: 2   │   │ ✅ Disp: 50  │   │ ❌ Agotado   │       │
│  │ [-] 1 [+]    │   │ [-] 2 [+]    │   │ [-] 10 [+]   │   │              │       │
│  │ [Agregar]    │   │ [Agregar]    │   │ [Agregar]    │   │              │       │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                          │
│  │  [IMAGEN]    │   │  [IMAGEN]    │   │  [IMAGEN]    │                          │
│  │  ...         │   │  ...         │   │  ...         │                          │
│  └──────────────┘   └──────────────┘   └──────────────┘                          │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Vista Mobile (1 columna con scroll horizontal)
```
┌─────────────────────────────────┐
│ SELECCIONAR PRODUCTOS           │
├─────────────────────────────────┤
│ [🔍 Buscar...                 ] │
│ [Categoría ▼] [Filtros ▼]       │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [IMAGEN]                    │ │
│ │ Carpa 10x10 Premium         │ │
│ │ $850,000 / evento           │ │
│ │ ✅ Disponible (5 unidades)  │ │
│ │                             │ │
│ │ [-] 1 [+]        [Agregar]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [IMAGEN]                    │ │
│ │ Carpa 6x6 Económica         │ │
│ │ $450,000 / evento           │ │
│ │ ⚠️ Parcial (max 2)          │ │
│ │                             │ │
│ │ [-] 2 [+]        [Agregar]  │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## 9. PRÓXIMOS PASOS

1. [ ] Crear endpoint backend `/productos/disponibilidad`
2. [ ] Crear `ProductoCard.jsx` con estados visuales
3. [ ] Crear `ProductoCardSelector.jsx` con filtros
4. [ ] Crear `ComponentesModal.jsx`
5. [ ] Integrar en `CotizacionFormModal.jsx`
6. [ ] Probar con datos reales
7. [ ] Ajustar responsive

---

## 10. NOTAS TÉCNICAS

### Dependencias
- Iconos: `lucide-react` (ya instalado)
- Imágenes: Usar placeholder si no hay imagen
- Grid: Tailwind CSS Grid

### Consideraciones de Performance
- Lazy loading de imágenes
- Debounce en búsqueda (300ms)
- Cache de disponibilidad (5 min)
- Skeleton loaders mientras carga

### Accesibilidad
- Labels en inputs de cantidad
- Colores con contraste suficiente
- Foco visible en tarjetas
- Anunciar cambios de disponibilidad
