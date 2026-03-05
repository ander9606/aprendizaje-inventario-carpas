# Ciclo de Vida de una Cotización

Una **Cotización** es una propuesta comercial que se genera para un cliente para un evento específico. Es el punto de entrada del proceso de alquiler.

---

## 1. Estados y Transiciones

```
            ┌──────────┐
            │ borrador │  ← creada sin fechas confirmadas
            └────┬─────┘
                 │ confirmar fechas (POST /cotizaciones/:id/confirmar-fechas)
                 ▼
          ┌───────────┐
          │ pendiente │  ← esperando respuesta del cliente
          └─────┬─────┘
         ┌──────┴──────┐
         ▼             ▼
   ┌──────────┐   ┌──────────┐
   │ aprobada │   │rechazada │
   └────┬─────┘   └──────────┘
        │ crear alquiler
        ▼
   (se genera Alquiler)
        │
        │ pasa tiempo sin aprobar
        ▼
   ┌─────────┐
   │ vencida │  ← vigencia_dias superados sin respuesta
   └─────────┘
```

**Fuente:** `CotizacionModel.actualizarEstado()` — `PUT /api/cotizaciones/:id`

---

## 2. Paso a Paso Detallado

### Paso 1 — Creación en Borrador

**Endpoint:** `POST /api/cotizaciones`

Se crea sin fechas o sin confirmarlas. Campos requeridos:
```
cliente_id
evento_nombre  (opcional al inicio)
```

**Lógica de estado al crear:**
```js
// CotizacionModel.crear()
const esBorrador = fechas_confirmadas === false || !fecha_evento;
const estado = esBorrador ? 'borrador' : 'pendiente';
```

El sistema carga valores desde `configuracion_alquileres`:
- `porcentaje_iva` (default: 19%)
- `porcentaje_dias_extra` (default: 15%)
- `vigencia_cotizacion_dias` (default: 15 días)
- `dias_gratis_montaje` (default: 2 días)
- `dias_gratis_desmontaje` (default: 1 día)

---

### Paso 2 — Agregar Productos y Transporte

**Endpoints:**
- `POST /api/cotizaciones/:id/productos`
- `POST /api/cotizaciones/:id/transportes`
- `POST /api/cotizaciones/:id/descuentos`

Cada vez que se agrega/modifica algo, se llama `CotizacionModel.recalcularTotales()`:

```
subtotal = Σ (precio_base × cantidad + recargos) de productos
         + Σ (precio × cantidad) de transportes

cobro_dias_extra = subtotal_productos × (porcentaje_dias_extra / 100) × total_dias_extra

total_descuentos = descuento_manual + Σ descuentos_tabla

base_gravable = subtotal + cobro_dias_extra - total_descuentos

valor_iva = base_gravable × (porcentaje_iva / 100)

total = base_gravable + valor_iva
```

---

### Paso 3 — Confirmar Fechas → Transición a `pendiente`

**Endpoint:** `POST /api/cotizaciones/:id/confirmar-fechas`

```json
{
  "fecha_montaje": "2024-03-10",
  "fecha_evento": "2024-03-12",
  "fecha_desmontaje": "2024-03-13"
}
```

**Lógica en `CotizacionModel.confirmarFechas()`:**
1. Calcula días extra de montaje y desmontaje
2. Actualiza `fechas_confirmadas = 1`, `estado = 'pendiente'`
3. Recalcula totales con los días extra

**Cálculo de días extra:**
```
dias_montaje_extra  = max(0, dias(evento - montaje)  - dias_gratis_montaje)
dias_desmontaje_extra = max(0, dias(desmontaje - evento) - dias_gratis_desmontaje)
```

---

### Paso 4 — Aprobación del Cliente → `aprobada`

**Endpoint:** `PUT /api/cotizaciones/:id` con `{ "estado": "aprobada" }`

Una cotización aprobada habilita la creación del Alquiler correspondiente.

> Al aprobar, el sistema puede generar automáticamente el `Alquiler` con estado `programado` y las dos `ordenes_trabajo` (montaje + desmontaje).

---

### Paso 5 — Rechazo o Vencimiento

- **Rechazada:** `PUT /api/cotizaciones/:id` con `{ "estado": "rechazada" }`
- **Vencida:** Se determina comparando `created_at + vigencia_dias` con la fecha actual

El campo `ultimo_seguimiento` permite rastrear cuándo fue el último contacto con el cliente:
```js
// CotizacionModel.registrarSeguimiento(id, notas)
// Registra fecha y notas del último contacto
```

---

## 3. Reglas de Negocio Importantes

| Regla | Descripción |
|---|---|
| **Días gratis** | Los primeros N días de montaje/desmontaje no generan recargo (configurable) |
| **Precio congelado** | El precio del producto se copia al crear `cotizacion_productos`; cambios posteriores al catálogo no afectan la cotización |
| **Vigencia** | Transcurridos `vigencia_dias` sin aprobación, la cotización se considera vencida |
| **IVA aplicable** | Configurable por sistema (`aplicar_iva = true/false`) |
| **Depósito** | Configurable si se cobra o no (`cobrar_deposito`) |

---

## 4. Duplicación

**Endpoint:** `POST /api/cotizaciones/:id/duplicar`

Crea una nueva cotización en estado `borrador` con los mismos productos y transporte. El nombre del evento incluye `" (copia)"`.

---

## 5. Generación de PDF

El servicio `CotizacionPDFService` genera un PDF con:
- Datos del cliente y evento
- Lista de productos con precios y depósitos
- Transporte
- Desglose de totales (días extra, IVA, descuentos)

---

## Resumen de tablas

| Tabla | Rol |
|---|---|
| `cotizaciones` | Registro principal de la cotización |
| `cotizacion_productos` | Productos incluidos (snapshot de precio) |
| `cotizacion_transportes` | Transporte incluido |
| `cotizacion_descuentos` | Descuentos aplicados (desde tabla `descuentos`) |
| `cotizacion_producto_recargo` | Recargos específicos por producto |
| `descuentos` | Catálogo de reglas de descuento |
| `tarifas_transporte` | Catálogo de tarifas por ciudad/tipo camión |
