# Flujo Completo del Sistema de Alquiler de Carpas

Este documento muestra cómo se conectan los cuatro ciclos de vida del sistema en un flujo de extremo a extremo.

---

## Visión General

```
CONFIGURACIÓN DEL CATÁLOGO
  Producto (ElementoCompuesto) ──────┐
  Elemento (inventario físico) ───────┤
                                      │
                                      ▼
PROCESO COMERCIAL                COTIZACIÓN
                                 borrador → pendiente → aprobada
                                      │
                                      ▼
PROCESO OPERATIVO                 ALQUILER
                                 programado → activo → finalizado
                                 /                   \
                          Orden MONTAJE         Orden DESMONTAJE
                      pendiente→completado   pendiente→completado
                                 │                   │
                                 ▼                   ▼
INVENTARIO                ejecutarSalida()    registrarRetorno()
                          serie→alquilado     serie→bueno/mantenimiento/dañado
                          lote-=N             lote+=N (si retorna)
```

---

## Flujo Paso a Paso

### FASE 1 — Configuración (una sola vez)

```
1. Crear categorías de inventario
      → tabla: categorias

2. Crear elementos físicos
      → tabla: elementos
      → tabla: series (si requiere_series = true)
      → tabla: lotes  (si requiere_series = false)
      Estado inicial de series: 'bueno'

3. Crear categorías de productos
      → tabla: categorias_productos

4. Crear productos de alquiler (elementos compuestos)
      → tabla: elementos_compuestos (activo = true)
      → tabla: compuesto_componentes (qué elementos físicos lo forman)

5. Configurar tarifas de transporte
      → tabla: tarifas_transporte

6. Configurar parámetros del sistema
      → tabla: configuracion_alquileres
         (IVA, días gratis montaje/desmontaje, vigencia cotización, etc.)
```

---

### FASE 2 — Proceso Comercial

```
7. Registrar cliente
      → tabla: clientes

8. Crear cotización en borrador
      → tabla: cotizaciones (estado = 'borrador')
      Puede crearse sin fechas definidas.

9. Agregar productos a la cotización
      → tabla: cotizacion_productos (snapshot de precio_base y deposito)
      Cada agregado recalcula totales automáticamente.

10. Agregar transporte (opcional)
      → tabla: cotizacion_transportes
      Recalcula totales.

11. Aplicar descuentos (opcional)
      → tabla: cotizacion_descuentos

12. Confirmar fechas del evento
      → cotizaciones.fechas_confirmadas = true
      → cotizaciones.estado = 'pendiente'
      → Calcula dias_montaje_extra y dias_desmontaje_extra
      → Recalcula totales con recargos por días extra e IVA

      NOTA: El sistema verifica disponibilidad de inventario
            para las fechas elegidas antes de confirmar.

13. Cliente aprueba
      → cotizaciones.estado = 'aprobada'

                    ── O ──

    Cliente rechaza o vence sin respuesta
      → cotizaciones.estado = 'rechazada' | 'vencida'
      → FIN del flujo para esta cotización
```

---

### FASE 3 — Proceso Operativo

```
14. Crear Alquiler desde cotización aprobada
      → tabla: alquileres (estado = 'programado', cotizacion_id = X)

15. Sistema crea automáticamente dos Órdenes de Trabajo
      → ordenes_trabajo tipo='montaje'    (estado = 'pendiente')
      → ordenes_trabajo tipo='desmontaje' (estado = 'pendiente')
      → orden_trabajo_elementos: se pre-asignan elementos desde cotizacion_productos

16. Asignar equipo y vehículo a cada orden
      → orden_trabajo_equipo (roles: responsable, conductor, operario, auxiliar)
      → ordenes_trabajo.vehiculo_id
      → Validar: sin conflictos de fecha en equipo/vehículo/elementos

17. Confirmar ordenes
      → ordenes_trabajo.estado = 'confirmado'
```

---

### FASE 4 — Ejecución del Montaje

```
18. Avanzar estados de la Orden de MONTAJE:
      pendiente → confirmado → en_preparacion → en_ruta → en_sitio → en_proceso

19. Completar montaje → ejecutarSalida()
      → ordenes_trabajo.estado = 'completado'
      → Copia orden_trabajo_elementos → alquiler_elementos (estado_salida = 'bueno')
      → UPDATE series SET estado = 'alquilado' (por cada serie asignada)
      → UPDATE lotes SET cantidad = cantidad - N (por cada lote asignado)
      → UPDATE alquileres SET estado = 'activo', fecha_salida = NOW()

      ¡El inventario ya no está disponible para otras cotizaciones en estas fechas!
```

---

### FASE 5 — Ejecución del Desmontaje

```
20. Avanzar estados de la Orden de DESMONTAJE:
      pendiente → confirmado → en_preparacion → en_ruta → en_sitio → en_proceso → en_retorno → descargue

21. Registrar condición de retorno de cada elemento
      → alquiler_elementos.estado_retorno = 'bueno' | 'dañado' | 'perdido'
      → alquiler_elementos.costo_dano (si aplica)

22. Completar desmontaje → registrarRetorno()
      → ordenes_trabajo.estado = 'completado'

      Para cada elemento retornado:
        estado = 'bueno'   → serie: 'bueno',          lote: cantidad += N
        estado = 'dañado'  → serie: 'mantenimiento',  lote: sin recuperación
        estado = 'perdido' → serie: 'dañado',          lote: sin recuperación

      → UPDATE alquileres SET estado = 'finalizado', fecha_retorno_real = NOW()

      ¡El inventario vuelve a estar disponible para nuevas cotizaciones!
```

---

## Diagrama de Tablas Involucradas por Fase

```
FASE 1 (Config)          FASE 2 (Comercial)       FASE 3-5 (Operativo)
─────────────            ──────────────────        ───────────────────────
categorias               cotizaciones              alquileres
elementos                cotizacion_productos      ordenes_trabajo
series                   cotizacion_transportes    orden_trabajo_equipo
lotes                    cotizacion_descuentos     orden_trabajo_elementos
categorias_productos     clientes                  alquiler_elementos
elementos_compuestos     tarifas_transporte        orden_trabajo_cambios_fecha
compuesto_componentes    descuentos                alertas_operaciones
configuracion_alquileres                           vehiculos
ubicaciones                                        empleados
```

---

## Casos Especiales

### Cancelación de Alquiler
- Si el alquiler está en `programado` → cancelar alquiler y ambas órdenes
- Si el alquiler está en `activo` (ya salió) → requiere registrar retorno emergencia primero
- Los elementos se liberan del inventario solo cuando `registrarRetorno()` se ejecuta

### Cambio de Fecha en Orden
1. `PUT /api/operaciones/ordenes/:id/fecha`
2. `ValidadorFechasService` verifica disponibilidad
3. Si OK → actualiza fecha, registra en `orden_trabajo_cambios_fecha`
4. Si conflicto → devuelve errores por recurso (elemento/empleado/vehículo)

### Cotización Duplicada
- `POST /api/cotizaciones/:id/duplicar`
- Crea nueva cotización en `borrador` con mismos productos y transporte
- Precio copiado del original (NO del catálogo actual)

---

## Referencias

| Documento | Contenido |
|---|---|
| [CICLO-VIDA-ELEMENTO.md](./CICLO-VIDA-ELEMENTO.md) | Estados de series y lotes, transiciones de inventario |
| [CICLO-VIDA-PRODUCTO.md](./CICLO-VIDA-PRODUCTO.md) | Gestión de plantillas de alquiler |
| [CICLO-VIDA-COTIZACION.md](./CICLO-VIDA-COTIZACION.md) | Estados y cálculo de totales de cotizaciones |
| [CICLO-VIDA-ORDEN-TRABAJO.md](./CICLO-VIDA-ORDEN-TRABAJO.md) | Estados operativos, salida y retorno de inventario |

**Servicios clave:**
- `SincronizacionAlquilerService` — puente entre operaciones e inventario
- `ValidadorFechasService` — validación de conflictos en cambios de fecha
- `DisponibilidadModel` — cálculo de stock disponible por fechas
- `CotizacionModel.recalcularTotales()` — motor de cálculo de precios
