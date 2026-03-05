# Ciclo de Vida de una Orden de Trabajo

Una **Orden de Trabajo** es la instrucción operativa que coordina el equipo humano y los elementos físicos para ejecutar un montaje o desmontaje. Siempre existe en pares: una orden de montaje y una de desmontaje, vinculadas al mismo Alquiler.

---

## 1. Tipos de Orden

```
TIPOS_ORDEN = {
  MONTAJE:    'montaje',     // Llevar y armar equipos en el sitio del evento
  DESMONTAJE: 'desmontaje'   // Recoger y traer equipos de vuelta al almacén
}
```

---

## 2. Estados y Transiciones

```
              ┌───────────┐
              │ pendiente │  ← creada automáticamente al aprobar cotización
              └─────┬─────┘
                    │ asignar equipo y vehículo
                    ▼
            ┌─────────────┐
            │ confirmado  │  ← equipo y vehículo asignados
            └──────┬──────┘
                   │ salir del almacén
                   ▼
          ┌────────────────┐
          │ en_preparacion │  ← cargando elementos en el vehículo
          └───────┬────────┘
                  │ salir a ruta
                  ▼
            ┌─────────┐
            │ en_ruta │  ← desplazamiento hacia el evento
            └────┬────┘
                 │ llegar al sitio
                 ▼
           ┌──────────┐
           │ en_sitio │  ← llegaron al lugar del evento
           └────┬─────┘
                │ comenzar trabajo
                ▼
          ┌────────────┐
          │ en_proceso │  ← armando/desarmando (trabajo activo)
          └──────┬─────┘

    Para MONTAJE:                    Para DESMONTAJE:
          │                                │
          │ trabajo terminado              │ cargado para retorno
          ▼                                ▼
    ┌───────────┐                   ┌────────────┐
    │completado │                   │ en_retorno │  ← viajando de vuelta
    └───────────┘                   └─────┬──────┘
    ↑ También ejecuta ejecutarSalida()     │ llegar al almacén
                                          ▼
                                    ┌──────────┐
                                    │ descargue│  ← descargando en bodega
                                    └────┬─────┘
                                         │ todo revisado
                                         ▼
                                   ┌───────────┐
                                   │completado │
                                   └───────────┘
                                   ↑ También ejecuta registrarRetorno()

  ──────────────────────────────────────────────
  En CUALQUIER estado → CANCELADO (si se cancela el alquiler)
```

**Fuente:** `ESTADOS_ORDEN` en `estadosOperaciones.js`

---

## 3. Creación Automática

Cuando una cotización se aprueba y se crea el Alquiler, el sistema genera automáticamente **dos órdenes**:

```
Cotización APROBADA
  → crear Alquiler (estado: 'programado')
      → crear Orden MONTAJE  (fecha = fecha_montaje de cotización)
      → crear Orden DESMONTAJE (fecha = fecha_desmontaje de cotización)
```

Simultáneamente, los elementos físicos se pre-asignan desde `cotizacion_productos` → `orden_trabajo_elementos`.

---

## 4. Asignación de Recursos

Antes de confirmar la orden, se asignan:

### Equipo humano (`orden_trabajo_equipo`)
```
orden_trabajo_equipo
├── orden_id
├── empleado_id
└── rol_en_orden: responsable | operario | conductor | auxiliar
```

### Vehículo
```
ordenes_trabajo.vehiculo_id  → referencia a vehículos
```

### Elementos físicos (`orden_trabajo_elementos`)
```
orden_trabajo_elementos
├── orden_id
├── elemento_id
├── serie_id    (si requiere_series = true)
├── lote_id     (si requiere_series = false)
├── cantidad
└── estado      ← sigue ESTADOS_ELEMENTO
```

---

## 5. Acción Crítica: ejecutarSalida() — solo para MONTAJE

**Cuándo ocurre:** Al transicionar la orden de montaje a `completado`

**Ejecutado por:** `SincronizacionAlquilerService.ejecutarSalida()`

```
orden_trabajo_elementos
        │
        │ copia datos
        ▼
alquiler_elementos  (crea registros con estado_salida = 'bueno')
        │
        ├── series involucradas → UPDATE estado = 'alquilado'
        └── lotes involucrados  → UPDATE cantidad = cantidad - N

alquileres → UPDATE estado = 'activo'
```

Todo ocurre dentro de una **transacción atómica**.

---

## 6. Acción Crítica: registrarRetorno() — solo para DESMONTAJE

**Cuándo ocurre:** Al transicionar la orden de desmontaje a `completado`

**Ejecutado por:** `SincronizacionAlquilerService.registrarRetorno()`

```
Para cada elemento en alquiler_elementos:

  estado_retorno = 'bueno'   → serie: estado = 'bueno'   | lote: cantidad + N
  estado_retorno = 'dañado'  → serie: estado = 'mantenimiento' | lote: queda reducido
  estado_retorno = 'perdido' → serie: estado = 'dañado'  | lote: queda reducido

  Si hay daños → alquiler_elementos.costo_dano = valor del daño

alquileres → UPDATE estado = 'finalizado'
             fecha_retorno_real = NOW()
```

---

## 7. Cambios de Fecha

Las fechas de una orden pueden cambiarse, pero deben pasar validación:

**Servicio:** `ValidadorFechasService`

Verifica:
1. **Disponibilidad de elementos** en la nueva fecha
2. **Disponibilidad del equipo** (empleados sin conflictos)
3. **Disponibilidad del vehículo** en la nueva fecha
4. **Interdependencia** montaje/desmontaje (desmontaje no puede ser antes de montaje)

```
PUT /api/operaciones/ordenes/:id/fecha
{
  "nueva_fecha": "2024-03-15",
  "motivo": "Cliente solicitó cambio"
}
```

El historial de cambios queda en `orden_trabajo_cambios_fecha`.

---

## 8. Alertas

El sistema genera alertas automáticas en `alertas_operaciones`:

| Tipo de Alerta | Severidad | Descripción |
|---|---|---|
| Conflicto de fechas | alta | Dos órdenes con el mismo recurso en la misma fecha |
| Sin vehículo | media | Orden confirmada sin vehículo asignado |
| Sin equipo | media | Orden sin responsable asignado |
| Fecha próxima | baja | Orden en menos de 24h sin confirmar |

---

## 9. Cancelación

Una orden puede cancelarse en cualquier estado:

```
PUT /api/operaciones/ordenes/:id con { "estado": "cancelado" }
```

Si se cancela el Alquiler:
- Ambas órdenes pasan a `cancelado`
- Si ya ejecutó salida → se debe registrar retorno manual del inventario

---

## Resumen de tablas

| Tabla | Rol |
|---|---|
| `ordenes_trabajo` | Registro principal de la orden |
| `orden_trabajo_equipo` | Empleados asignados y su rol |
| `orden_trabajo_elementos` | Elementos físicos que se mueven en la orden |
| `orden_trabajo_cambios_fecha` | Historial de cambios de fecha con motivo |
| `alertas_operaciones` | Alertas de conflicto o riesgo operativo |
| `vehiculos` | Vehículos disponibles para asignar |
| `empleados` | Personal asignado a la operación |
