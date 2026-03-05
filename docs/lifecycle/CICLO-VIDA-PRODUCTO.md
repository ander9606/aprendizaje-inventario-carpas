# Ciclo de Vida de un Producto (Elemento Compuesto)

Un **Producto** (`elemento_compuesto`) es un paquete de alquiler que se ofrece al cliente (ej: "Carpa 6x6 con piso"). Es una plantilla que agrupa múltiples elementos físicos del inventario.

> Los productos **no** tienen estados propios — su "ciclo de vida" es el de su configuración y uso dentro de cotizaciones.

---

## 1. Creación

Se define el producto y sus componentes.

**Tablas involucradas:**
- `elementos_compuestos` — la plantilla del producto
- `compuesto_componentes` — los elementos físicos que lo forman
- `categorias_productos` — categoría del producto (con emoji)

**Campos clave:**
```
elementos_compuestos.nombre
elementos_compuestos.codigo          -- código único (ej: CARPA-6X6)
elementos_compuestos.descripcion
elementos_compuestos.categoria_id
elementos_compuestos.precio_base     -- precio de alquiler base
elementos_compuestos.deposito        -- valor del depósito
elementos_compuestos.activo          -- boolean: si se puede cotizar
```

**Componentes:**
```
compuesto_componentes.compuesto_id
compuesto_componentes.elemento_id   -- elemento del inventario
compuesto_componentes.cantidad      -- cuántas unidades del elemento requiere
```

---

## 2. Estados del Producto

El producto solo tiene un campo de control: `activo (boolean)`.

```
activo = true   →  Se puede agregar a cotizaciones
activo = false  →  Oculto del catálogo (no cotizable)
```

No hay una máquina de estados formal. El "estado" se gestiona habilitando/deshabilitando el producto.

---

## 3. Uso dentro de una Cotización

Cuando un producto se agrega a una cotización, se crea una fila en `cotizacion_productos` con precios y cantidades **copiados** desde el producto en ese momento (snapshot de precio).

```
cotizacion_productos
├── cotizacion_id
├── compuesto_id          ← referencia al producto
├── cantidad              ← cuántos productos se alquilan
├── precio_base           ← copia del precio al momento de cotizar
├── deposito              ← copia del depósito
├── precio_adicionales
├── descuento_porcentaje
├── descuento_monto
├── total_recargos        ← recargo por días extra de montaje/desmontaje
└── subtotal              ← precio_base × cantidad (con descuentos)
```

> El precio en la cotización es independiente del precio actual del producto. Cambiar el `precio_base` del producto NO afecta cotizaciones ya creadas.

---

## 4. Impacto en Disponibilidad de Inventario

Cuando el producto se agrega a una cotización con fechas confirmadas, el sistema verifica si hay stock suficiente de **cada elemento componente**:

```
Para cada compuesto_componentes del producto:
  stock_requerido = componente.cantidad × cotizacion_productos.cantidad
  stock_disponible = elementos.cantidad - ocupado_en_fechas
  ¿stock_disponible >= stock_requerido? → OK / CONFLICTO
```

Esto se calcula en `DisponibilidadModel.verificarDisponibilidadCotizacion()`.

---

## 5. Relación con Órdenes de Trabajo

Los productos NO se asignan directamente a órdenes. El flujo es:

```
Producto (elementos_compuestos)
  └── tiene componentes (compuesto_componentes)
        └── cada componente es un elemento (elementos)
              └── ese elemento se asigna a orden_trabajo_elementos
                    └── y luego a alquiler_elementos al ejecutar salida
```

---

## 6. Modificación

Se puede editar nombre, precio, depósito, componentes en cualquier momento.

**Consideración importante:** Si se modifica el `precio_base` de un producto:
- Las cotizaciones en estado `borrador` o `pendiente` pueden recalcularse manualmente.
- Las cotizaciones `aprobadas` o alquileres activos no se ven afectados (usan el precio copiado).

---

## 7. Desactivación / Eliminación

- **Desactivar** (`activo = false`): El producto deja de aparecer en el selector de cotizaciones. Los alquileres existentes no se afectan.
- **Eliminar**: Solo posible si no tiene `cotizacion_productos` asociados. Si los tiene, se recomienda solo desactivar.

---

## Resumen de tablas

| Tabla | Rol |
|---|---|
| `elementos_compuestos` | Plantilla del producto de alquiler |
| `compuesto_componentes` | Elementos físicos que componen el producto |
| `categorias_productos` | Clasificación del producto (con emoji visual) |
| `cotizacion_productos` | Snapshot del producto dentro de cada cotización |
