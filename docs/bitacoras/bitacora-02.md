# Bitácora de Trabajo de Grado - N° 02

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 18 de octubre de 2025 |
| **Periodo** | 18 de octubre – 31 de octubre de 2025 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 22 horas |

---

## Objetivo del Periodo

Definir los requisitos funcionales y no funcionales del sistema y elaborar los diagramas de casos de uso principales.

---

## Actividades Realizadas

1. **Levantamiento de requisitos funcionales**: Se definieron los módulos principales del sistema:
   - Módulo de Inventario: gestión de elementos individuales, series y lotes.
   - Módulo de Productos: categorías jerárquicas y elementos compuestos (plantillas).
   - Módulo de Alquileres: cotizaciones, eventos y control de disponibilidad.
   - Módulo de Operaciones: flujos de montaje, desmontaje y checklist.
   - Módulo de Configuración: ubicaciones, ciudades y tarifas de transporte.

2. **Definición de requisitos no funcionales**: Se establecieron requisitos de rendimiento (respuesta < 2s), usabilidad (diseño responsive), seguridad y escalabilidad.

3. **Elaboración de casos de uso**: Se diseñaron los diagramas de casos de uso para cada módulo, identificando actores principales (administrador, operario) y flujos alternativos.

4. **Selección de metodología**: Se decidió utilizar una metodología ágil basada en iteraciones cortas, priorizando la entrega incremental de funcionalidades.

---

## Resultados y Avances

- Documento de especificación de requisitos con 25 requisitos funcionales y 8 no funcionales.
- 5 diagramas de casos de uso (uno por módulo).
- Priorización de módulos: primero Inventario, luego Productos, Alquileres, Operaciones y Configuración.

---

## Dificultades Encontradas

- Definir el nivel de granularidad del seguimiento de inventario (por unidad individual vs. por lote) fue complejo, ya que algunos elementos como sillas se manejan por lote y otros como carpas necesitan seguimiento individual por serie.
- La relación entre elementos compuestos (una carpa "completa" incluye estructura + lona + amarres) requirió un modelado más detallado.

---

## Plan para el Siguiente Periodo

- Diseñar la arquitectura técnica del sistema.
- Seleccionar el stack tecnológico.
- Diseñar el modelo de base de datos.
