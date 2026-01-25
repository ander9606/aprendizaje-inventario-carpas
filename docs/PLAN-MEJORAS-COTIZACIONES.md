# Plan de Mejoras: Módulo de Cotizaciones

## Resumen Ejecutivo

Este documento describe las mejoras propuestas para el módulo de cotizaciones, incluyendo un nuevo flujo de trabajo, sistema de descuentos predefinidos, cálculo de IVA y una mejor experiencia de selección de productos.

---

## 1. ANÁLISIS DEL ESTADO ACTUAL

### Flujo Actual (Problemático)
```
┌──────────────────────────────────────────────────────────────┐
│  CREAR COTIZACIÓN (Todo en un solo formulario)               │
├──────────────────────────────────────────────────────────────┤
│  1. Seleccionar cliente                                       │
│  2. Ingresar fechas (montaje, evento, desmontaje)            │
│  3. Datos del evento (nombre, ciudad, dirección)             │
│  4. Agregar productos (select dropdown)                       │
│  5. Agregar transporte                                        │
│  6. Descuento (número manual)                                 │
│  7. Guardar                                                   │
└──────────────────────────────────────────────────────────────┘
```

### Problemas Identificados

| # | Problema | Impacto |
|---|----------|---------|
| 1 | No existe concepto de "Evento" separado de cotización | Un evento puede tener múltiples cotizaciones (versiones) |
| 2 | Fechas de montaje/desmontaje sin restricción | No hay validación de días máximos antes/después del evento |
| 3 | No hay cobro por días adicionales | Se pierden ingresos por montajes/desmontajes extendidos |
| 4 | Selección de productos por dropdown | Mala UX, difícil comparar y visualizar productos |
| 5 | Descuento solo manual | No hay catálogo de descuentos reutilizables |
| 6 | No se calcula IVA | La cotización no cumple requisitos fiscales colombianos |
| 7 | PDF sin desglose de impuestos | El cliente no ve el detalle de IVA |

---

## 2. NUEVO FLUJO PROPUESTO

### Flujo Revisado
```
┌─────────────────────────────────────────────────────────────────────┐
│                         NUEVO FLUJO                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PASO 1: CREAR EVENTO                                                │
│  ├── Nombre del evento                                               │
│  ├── Seleccionar cliente                                             │
│  ├── Fecha del evento (fecha central)                                │
│  ├── Ciudad                                                          │
│  └── Dirección/Ubicación                                             │
│                                                                      │
│              ↓                                                       │
│                                                                      │
│  PASO 2: CREAR COTIZACIÓN (para el evento)                           │
│  ├── Fechas de montaje y desmontaje                                  │
│  │   └── Restricción: máximo 2 días antes/después                    │
│  │   └── Días adicionales = cobro por porcentaje                     │
│  │                                                                   │
│  ├── Selección de productos (interfaz de tarjetas)                   │
│  │   └── Ver producto, precio, imagen                                │
│  │   └── Seleccionar cantidad                                        │
│  │   └── Configurar opciones                                         │
│  │                                                                   │
│  ├── Selección de transporte (mantener actual)                       │
│  │                                                                   │
│  ├── Aplicar descuentos                                              │
│  │   └── Descuentos predefinidos (catálogo)                          │
│  │   └── Descuento adicional manual                                  │
│  │                                                                   │
│  └── Resumen con IVA                                                 │
│      ├── Subtotal productos                                          │
│      ├── Subtotal transporte                                         │
│      ├── Descuentos aplicados                                        │
│      ├── Base gravable                                               │
│      ├── IVA (19%)                                                   │
│      └── TOTAL                                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. NUEVAS ENTIDADES DE BASE DE DATOS

### 3.1 Tabla: `eventos`
```sql
-- Nueva tabla para separar eventos de cotizaciones
CREATE TABLE IF NOT EXISTS eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,

    -- Información del evento
    nombre VARCHAR(200) NOT NULL,
    fecha_evento DATE NOT NULL,
    ciudad VARCHAR(100),
    direccion TEXT,
    ubicacion_id INT,

    -- Notas
    notas TEXT,

    -- Estado: activo, cancelado, completado
    estado ENUM('activo', 'cancelado', 'completado') DEFAULT 'activo',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Tabla: `descuentos` (Catálogo)
```sql
-- Catálogo de descuentos predefinidos
CREATE TABLE IF NOT EXISTS descuentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Tipo: porcentaje o valor fijo
    tipo ENUM('porcentaje', 'fijo') DEFAULT 'porcentaje',

    -- Valor del descuento (ej: 20 para 20% o 50000 para $50,000)
    valor DECIMAL(12,2) NOT NULL,

    -- Restricciones opcionales
    valor_minimo_compra DECIMAL(12,2) DEFAULT 0,  -- Mínimo de compra para aplicar
    fecha_inicio DATE,                              -- Vigencia desde
    fecha_fin DATE,                                 -- Vigencia hasta

    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ejemplos de descuentos:
-- INSERT INTO descuentos (nombre, tipo, valor) VALUES
-- ('Familia', 'porcentaje', 20),
-- ('Cliente Frecuente', 'porcentaje', 15),
-- ('Referido', 'porcentaje', 10),
-- ('Descuento Corporativo', 'porcentaje', 25);
```

### 3.3 Tabla: `cotizacion_descuentos` (Pivote)
```sql
-- Descuentos aplicados a cada cotización
CREATE TABLE IF NOT EXISTS cotizacion_descuentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    descuento_id INT,  -- NULL si es descuento manual

    -- Copia del valor al momento de aplicar
    tipo ENUM('porcentaje', 'fijo') NOT NULL,
    valor DECIMAL(12,2) NOT NULL,

    -- Valor calculado en pesos
    monto_calculado DECIMAL(12,2) NOT NULL,

    -- Descripción (para descuentos manuales)
    descripcion VARCHAR(200),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (descuento_id) REFERENCES descuentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 Modificar tabla: `cotizaciones`
```sql
-- Agregar nuevos campos a cotizaciones
ALTER TABLE cotizaciones
    ADD COLUMN evento_id INT AFTER cliente_id,
    ADD COLUMN dias_montaje_extra INT DEFAULT 0 AFTER fecha_montaje,
    ADD COLUMN dias_desmontaje_extra INT DEFAULT 0 AFTER fecha_desmontaje,
    ADD COLUMN porcentaje_dias_extra DECIMAL(5,2) DEFAULT 15.00,
    ADD COLUMN cobro_dias_extra DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN subtotal_productos DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN subtotal_transporte DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN total_descuentos DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN base_gravable DECIMAL(12,2) DEFAULT 0,
    ADD COLUMN porcentaje_iva DECIMAL(5,2) DEFAULT 19.00,
    ADD COLUMN valor_iva DECIMAL(12,2) DEFAULT 0,
    ADD FOREIGN KEY (evento_id) REFERENCES eventos(id);
```

---

## 4. LÓGICA DE DÍAS ADICIONALES

### Regla de Negocio
- **Días incluidos gratis**: Hasta 2 días antes (montaje) y 2 días después (desmontaje)
- **Días adicionales**: Cada día extra tiene un cobro porcentual sobre el valor de productos

### Ejemplo de Cálculo
```javascript
const calcularDiasAdicionales = (fechaEvento, fechaMontaje, fechaDesmontaje, subtotalProductos) => {
    // Calcular días de diferencia
    const diasMontaje = diferenciaEnDias(fechaEvento, fechaMontaje);
    const diasDesmontaje = diferenciaEnDias(fechaDesmontaje, fechaEvento);

    // Días incluidos gratis
    const DIAS_GRATIS = 2;

    // Días adicionales
    const diasMontajeExtra = Math.max(0, diasMontaje - DIAS_GRATIS);
    const diasDesmontrajeExtra = Math.max(0, diasDesmontaje - DIAS_GRATIS);
    const totalDiasExtra = diasMontajeExtra + diasDesmontrajeExtra;

    // Porcentaje por día adicional (configurable)
    const PORCENTAJE_DIA_EXTRA = 15; // 15% por día

    // Cobro adicional
    const cobroDiasExtra = (subtotalProductos * (PORCENTAJE_DIA_EXTRA / 100)) * totalDiasExtra;

    return {
        diasMontajeExtra,
        diasDesmontrajeExtra,
        totalDiasExtra,
        porcentaje: PORCENTAJE_DIA_EXTRA,
        cobro: cobroDiasExtra
    };
};
```

### Ejemplo Numérico
| Concepto | Valor |
|----------|-------|
| Fecha evento | 15 de enero |
| Fecha montaje | 10 de enero (5 días antes) |
| Fecha desmontaje | 18 de enero (3 días después) |
| Días montaje extra | 5 - 2 = **3 días** |
| Días desmontaje extra | 3 - 2 = **1 día** |
| Total días extra | **4 días** |
| Subtotal productos | $1,000,000 |
| Cobro 15% × 4 días | $600,000 |

---

## 5. SELECCIÓN DE PRODUCTOS EN TARJETAS

### Ventajas del Sistema de Tarjetas vs Select

| Aspecto | Select (Actual) | Tarjetas (Propuesto) |
|---------|-----------------|----------------------|
| **Visualización** | Solo texto | Imagen + precio + descripción |
| **Comparación** | Difícil | Fácil, vista paralela |
| **Información** | Limitada | Completa en un vistazo |
| **Filtrado** | No disponible | Por categoría, precio, disponibilidad |
| **UX móvil** | Pobre | Optimizada con scroll horizontal |
| **Accesibilidad** | Básica | Mejor contraste y área de toque |
| **Cantidad** | Campo separado | Integrada en la tarjeta |
| **Disponibilidad** | No visible | Indicador visual |

### Diseño de Tarjeta de Producto

**Estado: DISPONIBLE (todos los componentes OK)**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  │ CARPA 10x10 PREMIUM                     │
│  │             │  │ ────────────────────                    │
│  │   [IMAGEN]  │  │ Categoría: Carpas Grandes               │
│  │             │  │                                          │
│  │             │  │ Precio: $850,000 / evento                │
│  └─────────────┘  │ Depósito: $500,000                       │
│                   │                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅ Disponible para las fechas seleccionadas           │  │
│  │    Máximo disponible: 5 unidades                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ [-] 1 [+]  │  │ 📋 Ver componentes │  │ ➕ Agregar       │    │
│  └─────────┘  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Estado: PARCIALMENTE DISPONIBLE (faltan algunos componentes)**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  │ CARPA 10x10 PREMIUM                     │
│  │             │  │ ────────────────────                    │
│  │   [IMAGEN]  │  │ Categoría: Carpas Grandes               │
│  │             │  │                                          │
│  │             │  │ Precio: $850,000 / evento                │
│  └─────────────┘  │ Depósito: $500,000                       │
│                   │                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⚠️ Disponibilidad limitada (3 de 5 solicitadas)       │  │
│  │    Componentes faltantes:                             │  │
│  │    • Tubo central 6m: faltan 4 unidades               │  │
│  │    • Lona lateral: faltan 2 unidades                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ [-] 3 [+]  │  │ 📋 Ver componentes │  │ ➕ Agregar (3)    │    │
│  └─────────┘  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Estado: NO DISPONIBLE (componentes críticos faltantes)**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  │ CARPA 10x10 PREMIUM                     │
│  │             │  │ ────────────────────                    │
│  │   [IMAGEN]  │  │ Categoría: Carpas Grandes               │
│  │             │  │                                          │
│  │             │  │ Precio: $850,000 / evento                │
│  └─────────────┘  │ Depósito: $500,000                       │
│                   │                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ❌ No disponible para fechas: 12-17 Feb 2025          │  │
│  │    Componentes en uso:                                │  │
│  │    • Lona principal 10x10: 0 disponibles (5 en uso)   │  │
│  │    • Tubo central 6m: 2 disponibles (necesita 8)      │  │
│  │    [Ver eventos que usan estos componentes]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ [-] 0 [+]  │  │ 📋 Ver componentes │  │    Agregar       │    │
│  └─────────┘  └──────────────────┘  └────(deshabilitado)───┘    │
└─────────────────────────────────────────────────────────────┘
```

### Modal: Ver Componentes del Producto

Al hacer clic en "Ver componentes" se muestra el desglose:
```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENTES: CARPA 10x10 PREMIUM                    [X]        │
├─────────────────────────────────────────────────────────────────┤
│  Fechas: 12 Feb - 17 Feb 2025 | Cantidad solicitada: 3          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Componente           │ Necesario │ Disponible │ Estado         │
│  ─────────────────────┼───────────┼────────────┼───────────     │
│  Lona principal 10x10 │    3      │     5      │ ✅ OK          │
│  Tubo esquina 3m      │   12      │    20      │ ✅ OK          │
│  Tubo central 6m      │   24      │    20      │ ⚠️ Faltan 4    │
│  Lona lateral         │    6      │     4      │ ⚠️ Faltan 2    │
│  Estacas              │   24      │   100      │ ✅ OK          │
│  Cuerdas tensoras     │   12      │    50      │ ✅ OK          │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│  Resumen: 4 de 6 componentes disponibles                        │
│  Máximo de carpas posibles: 3 unidades (limitado por tubos)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Funcionalidades del Selector de Tarjetas

1. **Filtros superiores**
   - Por categoría (Carpas, Mobiliario, Accesorios)
   - Por rango de precio
   - Solo disponibles (todos los componentes OK)
   - Búsqueda por nombre

2. **Ordenamiento**
   - Por precio (menor a mayor / mayor a menor)
   - Por popularidad
   - Por disponibilidad de componentes
   - Alfabético

3. **Indicadores visuales (basados en componentes)**
   - ✅ Verde: Todos los componentes disponibles para la cantidad solicitada
   - ⚠️ Amarillo: Disponible parcialmente (algunos componentes limitados)
   - ❌ Rojo: No disponible (componentes críticos en uso para las fechas)

4. **Acciones rápidas**
   - Ajustar cantidad con +/- (limitado por componentes disponibles)
   - Ver desglose de componentes y su disponibilidad
   - Agregar al carrito de cotización

### Cálculo de Disponibilidad

```javascript
const calcularDisponibilidadProducto = (productoCompuesto, cantidad, fechaInicio, fechaFin) => {
    const componentes = productoCompuesto.componentes;
    const resultado = {
        disponible: true,
        maxDisponible: Infinity,
        componentesFaltantes: [],
        componentesOK: []
    };

    for (const comp of componentes) {
        // Cantidad necesaria = cantidad por unidad × unidades solicitadas
        const necesario = comp.cantidad_por_unidad * cantidad;

        // Disponibilidad del componente para las fechas
        const disponible = getDisponibilidadElemento(comp.elemento_id, fechaInicio, fechaFin);

        if (disponible >= necesario) {
            resultado.componentesOK.push({
                nombre: comp.nombre,
                necesario,
                disponible,
                estado: 'ok'
            });
        } else {
            resultado.disponible = false;
            resultado.componentesFaltantes.push({
                nombre: comp.nombre,
                necesario,
                disponible,
                faltante: necesario - disponible,
                estado: disponible === 0 ? 'sin_stock' : 'parcial'
            });
        }

        // Calcular máximo posible basado en este componente
        const maxPorComponente = Math.floor(disponible / comp.cantidad_por_unidad);
        resultado.maxDisponible = Math.min(resultado.maxDisponible, maxPorComponente);
    }

    return resultado;
};
```

---

## 6. SISTEMA DE DESCUENTOS

### 6.1 Catálogo de Descuentos (CRUD)

**Pantalla de Configuración:**
```
┌─────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE DESCUENTOS                          [+ Nuevo]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🏷️ FAMILIA                                    [Activo]     │ │
│  │ Tipo: Porcentaje | Valor: 20%                              │ │
│  │ Sin mínimo de compra                                       │ │
│  │                                         [Editar] [Eliminar] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🏷️ CLIENTE FRECUENTE                          [Activo]     │ │
│  │ Tipo: Porcentaje | Valor: 15%                              │ │
│  │ Mínimo de compra: $500,000                                 │ │
│  │                                         [Editar] [Eliminar] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🏷️ PROMOCIÓN NAVIDAD                          [Activo]     │ │
│  │ Tipo: Fijo | Valor: $100,000                               │ │
│  │ Vigente: 01/12/2025 - 31/12/2025                           │ │
│  │                                         [Editar] [Eliminar] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Aplicación en Cotización

```
┌─────────────────────────────────────────────────────────────────┐
│  DESCUENTOS                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Descuento predefinido:                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Seleccionar descuento...                           ▼]   │   │
│  │  ├── Familia (20%)                                        │   │
│  │  ├── Cliente Frecuente (15%)                              │   │
│  │  ├── Referido (10%)                                       │   │
│  │  └── Promoción Navidad ($100,000)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Descuento adicional (manual):                                   │
│  ┌────────────────┐  ┌─────────────────────────────────────┐    │
│  │ [Porcentaje ▼] │  │ $____________                      │    │
│  └────────────────┘  └─────────────────────────────────────┘    │
│  Motivo: [_____________________________________________]         │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│  Descuentos aplicados:                                           │
│  • Familia (20%):                            -$340,000           │
│  • Descuento especial (5%):                   -$85,000           │
│  ────────────────────────────────────────────────────────────   │
│  Total descuentos:                           -$425,000           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. CÁLCULO DE IVA

### Regla Fiscal Colombia
- **IVA General**: 19%
- **Base gravable**: Subtotal - Descuentos
- **Aplicación**: Sobre productos y transporte

### Desglose en Cotización/PDF

```
┌─────────────────────────────────────────────────────────────────┐
│                         RESUMEN                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Subtotal productos:                          $1,700,000         │
│  Cobro días adicionales (4 días × 15%):        +$600,000         │
│  Subtotal transporte:                           +$350,000         │
│                                                ───────────        │
│  Subtotal:                                    $2,650,000         │
│                                                                  │
│  Descuentos aplicados:                                           │
│    • Familia (20%):                            -$340,000         │
│    • Descuento especial:                        -$85,000         │
│                                                ───────────        │
│  Total descuentos:                             -$425,000         │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  Base gravable:                               $2,225,000         │
│  IVA (19%):                                    +$422,750         │
│  ═══════════════════════════════════════════════════════════    │
│  TOTAL A PAGAR:                              $2,647,750         │
│                                                                  │
│  Depósito sugerido (30%):                      $794,325         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fórmula de Cálculo

```javascript
const calcularTotales = (datos) => {
    const {
        subtotalProductos,
        cobroDiasExtra,
        subtotalTransporte,
        descuentos,
        porcentajeIVA = 19
    } = datos;

    // 1. Subtotal bruto
    const subtotalBruto = subtotalProductos + cobroDiasExtra + subtotalTransporte;

    // 2. Calcular descuentos
    let totalDescuentos = 0;
    for (const desc of descuentos) {
        if (desc.tipo === 'porcentaje') {
            totalDescuentos += subtotalBruto * (desc.valor / 100);
        } else {
            totalDescuentos += desc.valor;
        }
    }

    // 3. Base gravable
    const baseGravable = subtotalBruto - totalDescuentos;

    // 4. IVA
    const valorIVA = baseGravable * (porcentajeIVA / 100);

    // 5. Total final
    const totalFinal = baseGravable + valorIVA;

    // 6. Depósito sugerido (30% del total)
    const depositoSugerido = totalFinal * 0.30;

    return {
        subtotalProductos,
        cobroDiasExtra,
        subtotalTransporte,
        subtotalBruto,
        totalDescuentos,
        baseGravable,
        porcentajeIVA,
        valorIVA,
        totalFinal,
        depositoSugerido
    };
};
```

---

## 8. PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (Backend)
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear tabla `eventos` | Alta | Baja |
| Crear tabla `descuentos` | Alta | Baja |
| Crear tabla `cotizacion_descuentos` | Alta | Baja |
| Modificar tabla `cotizaciones` (nuevos campos) | Alta | Media |
| Crear seeds de descuentos ejemplo | Media | Baja |

### Fase 2: Backend - Modelos y Controladores
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear EventoModel | Alta | Baja |
| Crear DescuentoModel | Alta | Baja |
| Modificar CotizacionModel (IVA, descuentos, días extra) | Alta | Media |
| Crear EventoController | Alta | Baja |
| Crear DescuentoController | Alta | Baja |
| Modificar CotizacionController | Alta | Media |
| Crear servicio de cálculo de totales | Alta | Media |

### Fase 3: Frontend - Eventos
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear EventosPage (listado) | Alta | Media |
| Crear EventoFormModal | Alta | Media |
| Crear EventoCard | Alta | Baja |
| Botón "Crear Cotización" en EventoCard | Alta | Baja |

### Fase 4: Frontend - Selector de Productos
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear ProductoCardSelector | Alta | Alta |
| Implementar filtros y ordenamiento | Media | Media |
| Mostrar disponibilidad en tiempo real | Media | Media |
| Integrar con formulario de cotización | Alta | Media |

### Fase 5: Frontend - Descuentos
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear DescuentosPage (CRUD) | Media | Media |
| Crear DescuentoFormModal | Media | Baja |
| Crear selector de descuentos en cotización | Alta | Media |
| Mostrar descuentos aplicados | Alta | Baja |

### Fase 6: Frontend - Totales e IVA
| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Modificar resumen de cotización | Alta | Media |
| Agregar cálculo de días adicionales | Alta | Media |
| Agregar cálculo de IVA | Alta | Baja |
| Modificar PDF/vista previa | Alta | Media |

---

## 9. WIREFRAMES PROPUESTOS

### 9.1 Tarjeta de Evento (con botón cotización)

```
┌─────────────────────────────────────────────────────────────────┐
│  🎪 BODA GARCÍA                                    [Activo]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 Cliente: María García                                        │
│  📅 Fecha: 15 de Febrero, 2025                                   │
│  📍 Bogotá - Hacienda San José                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Cotizaciones: 2                                                 │
│  • #COT-045 - Pendiente - $2,500,000                            │
│  • #COT-043 - Rechazada - $3,100,000                            │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │  Ver Evento    │  │  Ver Cotiz.    │  │ + Nueva Cotización │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Flujo Nueva Cotización (desde evento)

```
┌─────────────────────────────────────────────────────────────────┐
│  NUEVA COTIZACIÓN                                                │
│  Evento: Boda García | Cliente: María García | 15 Feb 2025     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ──────────── PASO 1: FECHAS ────────────                       │
│                                                                  │
│  Fecha del evento: 15 de Febrero, 2025 (fija desde evento)      │
│                                                                  │
│  Fecha de montaje:                                               │
│  [    12 de Febrero, 2025    ▼]                                 │
│  ⚠️ 3 días antes = 1 día adicional                              │
│                                                                  │
│  Fecha de desmontaje:                                            │
│  [    17 de Febrero, 2025    ▼]                                 │
│  ⚠️ 2 días después = 0 días adicionales                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📊 Resumen días adicionales:                              │   │
│  │    • Días extra montaje: 1                                │   │
│  │    • Días extra desmontaje: 0                             │   │
│  │    • Total días extra: 1                                  │   │
│  │    • Cobro adicional (15%): Pendiente calcular            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                              [Siguiente →]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. CONSIDERACIONES TÉCNICAS

### 10.1 Validaciones de Fechas
```javascript
// En el frontend, al seleccionar fecha de montaje
const validarFechaMontaje = (fechaMontaje, fechaEvento) => {
    const diasAntes = diferenciaEnDias(fechaEvento, fechaMontaje);

    if (diasAntes < 0) {
        return { valido: false, error: "El montaje debe ser antes del evento" };
    }
    if (diasAntes > 7) {
        return { valido: false, error: "Máximo 7 días antes del evento" };
    }

    const diasExtra = Math.max(0, diasAntes - 2);
    return {
        valido: true,
        diasExtra,
        advertencia: diasExtra > 0 ? `${diasExtra} día(s) adicional(es) con cobro` : null
    };
};
```

### 10.2 Configuración de IVA
```javascript
// Configuración centralizada (puede venir de BD o config)
const CONFIG_FISCAL = {
    pais: 'CO',
    porcentajeIVA: 19,
    aplicaIVATransporte: true,
    aplicaIVAProductos: true,
    // Algunos productos podrían estar exentos
    productosExentosIVA: []
};
```

### 10.3 Migraciones Incrementales
- Las migraciones deben ser reversibles
- Mantener compatibilidad con cotizaciones existentes
- Valores por defecto para nuevos campos

---

## 11. PREGUNTAS PENDIENTES

1. **¿El porcentaje por día adicional es configurable por usuario o fijo?**
   - Propuesta: Configurable desde panel de administración

2. **¿Los descuentos son acumulables?**
   - Propuesta: Sí, se pueden aplicar múltiples descuentos

3. **¿El IVA aplica al transporte?**
   - Propuesta: Sí, según normativa colombiana

4. **¿Límite máximo de días adicionales?**
   - Propuesta: 7 días máximo para montaje y desmontaje

5. **¿Un evento puede tener múltiples cotizaciones simultáneas?**
   - Propuesta: Sí, para comparar opciones antes de aprobar una

---

## 12. PRÓXIMOS PASOS

1. [ ] Revisar y aprobar este documento
2. [ ] Definir respuestas a preguntas pendientes
3. [ ] Crear migraciones de base de datos
4. [ ] Implementar backend por fases
5. [ ] Implementar frontend por fases
6. [ ] Pruebas de integración
7. [ ] Deploy a staging para validación
