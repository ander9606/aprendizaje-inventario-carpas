# Bitácora de Trabajo de Grado - N° 03

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 1 de noviembre de 2025 |
| **Periodo** | 1 de noviembre – 14 de noviembre de 2025 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 25 horas |

---

## Objetivo del Periodo

Diseñar la arquitectura del sistema, seleccionar el stack tecnológico y crear el modelo de base de datos.

---

## Actividades Realizadas

1. **Diseño de la arquitectura**: Se definió una arquitectura cliente-servidor con:
   - **Frontend**: Aplicación de página única (SPA) con React.js.
   - **Backend**: API REST con Node.js y Express.
   - **Base de datos**: MySQL para almacenamiento relacional.
   - **Comunicación**: API RESTful con JSON.

2. **Selección del stack tecnológico**:
   - Frontend: React 18, Vite, TailwindCSS, React Query (TanStack Query), React Router.
   - Backend: Node.js, Express, MySQL2 (driver nativo).
   - Herramientas: Git/GitHub para control de versiones, ESLint para calidad de código.

3. **Diseño del modelo de base de datos**: Se diseñaron las tablas principales:
   - `categorias`: Categorías jerárquicas de productos con soporte de iconos.
   - `elementos`: Elementos individuales del inventario con cantidad y estado.
   - `series`: Seguimiento individual de unidades con número de serie y ubicación.
   - `lotes`: Agrupación de elementos por cantidad y ubicación.
   - `ubicaciones`: Ubicaciones físicas (bodega principal, eventos, etc.).
   - `elementos_compuestos`: Plantillas de productos compuestos con componentes.

4. **Evaluación de alternativas**: Se comparó React vs. Vue.js y MySQL vs. PostgreSQL, justificando la elección con base en la curva de aprendizaje, comunidad y requisitos del proyecto.

---

## Resultados y Avances

- Diagrama de arquitectura del sistema (cliente-servidor con API REST).
- Diagrama entidad-relación con 12 tablas principales.
- Documento de justificación tecnológica.
- Estructura inicial del repositorio en GitHub.

---

## Dificultades Encontradas

- La decisión entre usar un ORM (Sequelize/Prisma) o consultas SQL directas requirió análisis. Se optó por SQL directo con MySQL2 para tener mayor control sobre las consultas y evitar la abstracción innecesaria de un ORM.
- El modelado de elementos compuestos con alternativas intercambiables (ej: una carpa puede usar lona tipo A o tipo B) requirió un diseño flexible con tablas de relación.

---

## Plan para el Siguiente Periodo

- Configurar el entorno de desarrollo (frontend y backend).
- Implementar la estructura base del proyecto.
- Crear las migraciones de base de datos.
