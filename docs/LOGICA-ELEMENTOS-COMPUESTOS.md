# Lógica del Sistema: Elementos Compuestos (Productos de Alquiler)

## Resumen

El sistema permite crear **plantillas de productos** (elementos compuestos) que se arman con componentes del inventario al momento de cotizar/alquilar.

---

## Estructura Jerárquica

```
CATEGORÍA (ej: "Carpas")
    │
    └── ELEMENTO COMPUESTO / PLANTILLA (ej: "Carpa 10x10")
            │
            ├── Componentes FIJOS
            │     (siempre incluidos, no afectan precio)
            │
            ├── Componentes con ALTERNATIVAS
            │     (obligatorios, combinables, pueden afectar precio)
            │
            └── Componentes ADICIONALES
                  (opcionales, siempre suman al precio)
```

---

## Tipos de Componentes

### 1. FIJO
- **Siempre incluido** en el producto
- **No tiene alternativas**
- **No afecta el precio** (incluido en precio base)
- Ejemplo: Tela Náutica 10x10, Mástiles

### 2. ALTERNATIVA (con grupo)
- **Obligatorio**: debe completar la cantidad requerida del grupo
- **Combinable**: puede mezclar opciones del mismo grupo
- **Precio variable**: la opción default es $0, las demás tienen costo adicional
- Ejemplo: Grupo "Anclajes" necesita 11 → puede ser 6 estacas + 5 contrapesos

### 3. ADICIONAL
- **Opcional**: el cliente decide si lo quiere
- **Siempre suma** al precio base
- Ejemplo: Iluminación LED (+$50,000), Piso de madera (+$150,000)

---

## Ejemplo Completo: Carpa 10x10

### Precio base: $800,000

### Componentes FIJOS (incluidos):
| Elemento | Cantidad |
|----------|----------|
| Tela Náutica 10x10 | 1 |
| Mástiles Central 3m | 2 |
| Reatas 5m | 12 |

### Componentes con ALTERNATIVAS:

**Grupo: Anclajes (11 requeridos)**
| Opción | Precio c/u | Default |
|--------|------------|---------|
| Estacas 30cm | $0 | ⭐ Sí |
| Contrapesos 20kg | +$10,000 | No |
| Sacos de Arena | +$5,000 | No |

**Grupo: Postes (4 requeridos)**
| Opción | Precio c/u | Default |
|--------|------------|---------|
| Postes 2.0m | $0 | ⭐ Sí |
| Postes 2.5m (alta) | +$15,000 | No |

### Componentes ADICIONALES (opcionales):
| Elemento | Precio |
|----------|--------|
| Set Iluminación LED | +$50,000 |
| Piso de Madera 10x10 | +$150,000 |
| Cortinas Laterales | +$80,000 |

---

## Flujo de Operación

### 1. Configuración (una vez)
```
Admin crea Categoría → "Carpas"
Admin crea Plantilla → "Carpa 10x10" con precio base $800,000
Admin agrega componentes:
  - Fijos: Tela, Mástiles, Reatas
  - Alternativas: Anclajes (estacas/contrapesos/sacos)
  - Adicionales: Iluminación, Piso, Cortinas
```

### 2. Cotización (por cliente)
```
Cliente solicita "Carpa 10x10"
                    ↓
Sistema muestra formulario:
  - Alternativas obligatorias (debe completar cantidades)
  - Adicionales opcionales (checkboxes)
                    ↓
Cliente elige:
  - Anclajes: 6 estacas + 5 contrapesos
  - Postes: 4 postes 2.0m (default)
  - Adicionales: ✓ Iluminación
                    ↓
Sistema calcula:
  $800,000 (base)
  + $50,000 (5 contrapesos × $10,000)
  + $50,000 (iluminación)
  = $900,000 total
```

### 3. Alquiler (confirmación)
```
Cliente aprueba cotización
                    ↓
Sistema verifica disponibilidad en bodega
                    ↓
Se asigna inventario real:
  - 1× Tela serie #101
  - 2× Mástiles serie #201, #202
  - 6× Estacas del lote
  - 5× Contrapesos del lote
  - etc.
                    ↓
Se registra el alquiler con fechas y cliente
```

### 4. Devolución
```
Cliente devuelve el equipo
                    ↓
Se verifica estado de cada componente
                    ↓
Se registran daños/pérdidas si hay
                    ↓
Inventario vuelve a estar disponible
```

---

## Tablas Necesarias

### Configuración:
1. **categorias_productos** - Categorías (Carpas, Salas Lounge, etc.)
2. **elementos_compuestos** - Plantillas de productos
3. **compuesto_componentes** - Componentes de cada plantilla

### Operación:
4. **clientes** - Datos de clientes
5. **cotizaciones** - Cotizaciones generadas
6. **cotizacion_detalles** - Componentes elegidos en cada cotización
7. **alquileres** - Alquileres confirmados

---

## Lógica de Precios

```
PRECIO TOTAL = Precio Base
             + Σ (Alternativas no-default × precio_adicional × cantidad)
             + Σ (Adicionales elegidos × precio_adicional)
```

### Ejemplo:
```
Precio base Carpa 10x10:           $800,000
+ 5 Contrapesos (no-default):      $50,000  (5 × $10,000)
+ 0 Postes 2.5m:                   $0       (eligió default)
+ Iluminación LED:                 $50,000
─────────────────────────────────────────────
TOTAL:                             $900,000
```

---

## Validaciones

### Al crear plantilla:
- Cada grupo de alternativas debe tener exactamente 1 opción default
- La opción default debe tener precio_adicional = 0

### Al cotizar:
- La suma de cantidades en cada grupo debe igualar la cantidad requerida
- No puede quedar ningún grupo incompleto

### Al alquilar:
- Debe haber inventario suficiente en bodega para todos los componentes
- Si no hay suficiente de una opción, sugerir alternativas disponibles
