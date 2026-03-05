# Ciclo de Vida de un Elemento (Inventario Físico)

Un **Elemento** es una pieza del inventario físico (ej: lona, estructura, tubo). Puede rastrearse de dos formas: por **serie** (unidad individual) o por **lote** (cantidad en bulk).

---

## 1. Creación

El elemento nace cuando se registra en el sistema.

**Tablas involucradas:**
- `elementos` — registro maestro del ítem
- `series` — si `requiere_series = true` (rastreo individual)
- `lotes` — si `requiere_series = false` (rastreo por cantidad)

**Campos clave al crear:**
```
elementos.nombre
elementos.cantidad          -- total en inventario
elementos.stock_minimo      -- umbral de alerta
elementos.requiere_series   -- boolean: ¿rastreo por serie o lote?
elementos.costo_adquisicion
elementos.precio_unitario
elementos.categoria_id
elementos.ubicacion
elementos.fecha_ingreso
```

**Estado inicial:**
- Serie:  `estado = 'bueno'`
- Lote:   `estado = 'bueno'`, `cantidad = N`

---

## 2. Estados de una Serie

```
            ┌─────────┐
            │  bueno  │  ← estado inicial / retorno sin daños
            └────┬────┘
                 │ asignado a orden de montaje
                 ▼
          ┌────────────┐
          │ alquilado  │  ← ejecutarSalida() en SincronizacionAlquilerService
          └─────┬──────┘
                │ retorno desde desmontaje
        ┌───────┴──────────┐
        ▼                  ▼
   ┌─────────┐      ┌─────────────┐
   │  bueno  │      │mantenimiento│  ← retorno con daño
   └─────────┘      └──────┬──────┘
                           │ reparado
                           ▼
                      ┌─────────┐
                      │  bueno  │
                      └─────────┘

  Nota: estado 'dañado' = pérdida total (no retorna al stock)
```

**Constantes:** `ESTADOS_SERIE` en `estadosOperaciones.js`
```js
bueno | mantenimiento | alquilado | dañado
```

---

## 3. Estados de un Elemento dentro de una Orden de Trabajo

Cuando un elemento está asignado a una orden (`orden_trabajo_elementos`), tiene su propio estado de progreso operativo:

```
pendiente → preparado → cargado → instalado → desmontado → retornado
                                                    ↓
                                               incidencia  (problema en campo)
```

**Constantes:** `ESTADOS_ELEMENTO` en `estadosOperaciones.js`
```js
pendiente | preparado | cargado | descargado | instalado | desmontado | retornado | incidencia
```

---

## 4. Transiciones que afectan el inventario

### Al ejecutar SALIDA (montaje completado)
Ejecutado por `SincronizacionAlquilerService.ejecutarSalida()`:

1. Copia `orden_trabajo_elementos` → `alquiler_elementos`
2. Para series: `UPDATE series SET estado = 'alquilado'`
3. Para lotes: `UPDATE lotes SET cantidad = cantidad - N`
4. El alquiler pasa a estado `activo`

### Al ejecutar RETORNO (desmontaje completado)
Ejecutado por `SincronizacionAlquilerService.registrarRetorno()`:

| `estado_retorno` en `alquiler_elementos` | Acción en inventario |
|---|---|
| `bueno` | Serie → `bueno`, Lote → `cantidad + N` |
| `dañado` | Serie → `mantenimiento`, Lote queda reducido |
| `perdido` | Serie → `dañado`, Lote queda reducido |

---

## 5. Disponibilidad

Para saber si un elemento tiene stock para un rango de fechas, se usa `DisponibilidadModel`:

```
stock_disponible = stock_total - cantidad_ocupada_en_fechas
```

La `cantidad_ocupada` se calcula sobre `alquiler_elementos` cruzando con fechas de `alquileres`.

---

## 6. Eliminación / Baja

Un elemento puede eliminarse del catálogo (`DELETE FROM elementos`).
Las series y lotes asociados se eliminan en cascada.

> **Restricción:** No se puede eliminar si tiene series en estado `alquilado` o lotes activos en un alquiler.

---

## Resumen de tablas

| Tabla | Rol |
|---|---|
| `elementos` | Registro maestro del ítem |
| `series` | Unidades individuales (con número de serie) |
| `lotes` | Grupos de unidades (por cantidad) |
| `orden_trabajo_elementos` | Estado del elemento dentro de una orden |
| `alquiler_elementos` | Registro de salida/retorno del elemento en un alquiler |
| `ubicaciones` | Dónde está físicamente almacenado |
