# Plan: Mejoras de UI para Tabletas - Módulo de Operaciones

## Análisis del Estado Actual

La interfaz actual está diseñada principalmente para desktop. Aunque tiene algunos breakpoints responsivos (`sm:`, `md:`, `lg:`), la experiencia en tableta para un operario en campo presenta estas fricciones:

1. **Sidebar siempre visible** consume ~256px en pantalla de tableta
2. **Stepper horizontal** con 7-9 pasos se comprime demasiado en pantalla de tableta
3. **Layout 3 columnas** (2+1) colapsa a 1 columna en tableta, mezclando info con acciones
4. **Botones y checkboxes pequeños** (w-6 h-6) — difíciles de usar con guantes o manos sucias
5. **Demasiada información simultánea** — el operario solo necesita la acción del paso actual
6. **Sin gestos táctiles** — no hay swipe ni interacciones optimizadas para touch
7. **Modales con scroll largo** — checklists en modal se sienten encerrados en tableta

## Propuesta de Mejoras (Priorizadas)

### 1. Barra de Acción Fija (Sticky Action Bar) — ALTO IMPACTO
**Archivo:** `OrdenDetallePage.jsx`

Convertir el banner "Siguiente Paso" en una **barra fija inferior (bottom bar)** en tableta, siempre visible mientras el operario hace scroll. El botón de acción principal debe ser grande y prominente.

```
┌─────────────────────────────────────────┐
│  ⚡ Preparación — 4 de 4 sin confirmar  │
│  ┌─────────────────────────────────┐    │
│  │   🚛  CONFIRMAR CARGUE          │    │  ← Botón grande, touch-friendly
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Cambios:**
- Agregar clase `lg:relative fixed bottom-0 left-0 right-0 z-30` al banner de acción
- Aumentar padding y tamaño del botón CTA a `py-4 text-lg`
- Agregar `pb-[100px]` al contenedor principal en tablet para evitar que el contenido quede oculto bajo la barra

---

### 2. Sidebar Colapsado por Defecto en Tableta — ALTO IMPACTO
**Archivo:** `ModuleLayout.jsx`

En tabletas (< 1024px), el sidebar debe iniciar **colapsado** y funcionar como overlay cuando se abre.

**Cambios:**
- Detectar `window.innerWidth < 1024` y setear `collapsed = true` por defecto
- Cuando se abre en tableta, usar `position: fixed` con backdrop semi-transparente
- Auto-cerrar al navegar a otra ruta

---

### 3. Touch Targets Más Grandes en Checklists — ALTO IMPACTO
**Archivo:** `ChecklistCargueDescargue.jsx`

Los operarios en campo usan la tableta con manos sucias o guantes. Los checkboxes actuales (24x24px) son muy pequeños.

**Cambios:**
- Aumentar checkbox de `w-6 h-6` a `w-10 h-10` en tableta
- Hacer toda la fila clickeable (no solo el icono del checkbox)
- Aumentar padding de cada fila de `py-3` a `py-4`
- Agregar feedback háptico visual (scale animation al tocar)
- Hacer el checklist **full-screen** en tableta en vez de modal

---

### 4. Stepper Optimizado para Tableta — MEDIO IMPACTO
**Archivo:** `OrdenDetallePage.jsx`

El stepper horizontal actual no funciona bien con 9 pasos en tableta. Usar un **stepper compacto** que muestre solo el paso anterior, actual y siguiente.

```
  ✅ Confirmado  →  🟠 Preparación  →  ○ En Ruta
                     Paso 3 de 7
```

**Cambios:**
- Agregar breakpoint intermedio `md:` entre la barra de progreso móvil y el stepper completo desktop
- Mostrar solo 3 pasos (anterior, actual, siguiente) con indicador de progreso
- Usar el nombre corto (`short`) para pasos no activos

---

### 5. Información Contextual por Estado — MEDIO IMPACTO
**Archivo:** `OrdenDetallePage.jsx`

En campo, el operario no necesita ver TODA la información. Mostrar solo lo relevante para el paso actual:

| Estado | Info Prioritaria |
|--------|-----------------|
| `en_preparacion` | Lista de productos + checklist de cargue |
| `en_ruta` | Dirección + teléfono cliente + botón "Llegué" |
| `en_sitio` | Cronómetro + botón "Iniciar Montaje" |
| `en_proceso` | Cronómetro + botón "Completar" |

**Cambios:**
- Agregar secciones colapsables (`<details>`) para info secundaria en tableta
- La sección de info rápida (fecha, hora, ubicación, cliente) se muestra compacta
- Priorizar la sección de productos/checklist en estados de preparación

---

### 6. Botón de Llamada Rápida al Cliente — BAJO IMPACTO (rápido de implementar)
**Archivo:** `OrdenDetallePage.jsx`

El teléfono del cliente ya existe pero está en la sección de info. En tableta, agregar un **botón flotante de llamada** cuando el operario está `en_ruta` o `en_sitio`.

**Cambios:**
- Agregar `<a href="tel:...">` como FAB (floating action button) en estados relevantes
- Icono de teléfono grande, verde, posicionado arriba de la barra de acción

---

### 7. Checklist Full-Screen Mode — MEDIO IMPACTO
**Archivo:** `ChecklistCargueDescargue.jsx`

En tableta, el checklist debería ocupar toda la pantalla en lugar de ser un modal con scroll limitado.

**Cambios:**
- Detectar tableta y usar `h-screen w-screen` en vez de `max-w-lg max-h-[90vh]`
- Barra de progreso fija en la parte superior
- Botón "Completar" fijo en la parte inferior
- Elementos con más espacio entre ellos para facilitar touch

---

### 8. Navegación por Gestos entre Estados — BAJO IMPACTO (nice-to-have)
**Archivo:** Nuevo hook `useSwipeGesture.js`

Permitir al operario deslizar (swipe) para ver info del paso anterior/siguiente sin necesidad de botones.

---

## Orden de Implementación Sugerido

1. **Barra de Acción Fija** (sticky bottom bar) — Impacto inmediato
2. **Sidebar colapsado** en tableta — Más espacio de contenido
3. **Touch targets grandes** en checklists — Usabilidad en campo
4. **Checklist full-screen** en tableta — Mejor experiencia de verificación
5. **Stepper compacto** para tableta — Mejor orientación visual
6. **Info contextual** por estado — Menos ruido visual
7. **Botón llamada rápida** — Conveniencia en campo
8. **Gestos** — Nice-to-have futuro

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `OrdenDetallePage.jsx` | Sticky bar, stepper, info contextual, botón llamada |
| `ChecklistCargueDescargue.jsx` | Touch targets, full-screen mode |
| `ModuleLayout.jsx` | Sidebar collapse behavior |
| `OperacionesSidebar.jsx` | Overlay mode en tableta |
| `index.css` | Nuevas animaciones, utilidades touch |
