# 🚀 API REST - Sistema de Inventario de Carpas

API RESTful desarrollada con Node.js y Express para gestionar inventario de elementos de alquiler con **dos sistemas complementarios**: números de serie individuales y lotes por cantidad.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Concepto: Series vs Lotes](#-concepto-series-vs-lotes)
- [Endpoints](#-endpoints)
  - [Categorías](#-categorías)
  - [Elementos](#-elementos)
  - [Series](#️-series)
  - [Lotes](#-lotes)
  - [Materiales](#-materiales)
  - [Unidades](#-unidades)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Códigos de Estado](#-códigos-de-estado)

---

## ✨ Características

- ✅ **Arquitectura MVC** (Model-View-Controller)
- ✅ **CRUD completo** para todos los recursos
- ✅ **Dos sistemas de inventario:**
  - **Series individuales** (tracking exacto por número de serie)
  - **Lotes por cantidad** (tracking grupal con estados)
- ✅ **Gestión automática de lotes:**
  - Creación dinámica según necesidad
  - Consolidación automática
  - Eliminación de lotes vacíos
- ✅ **Historial completo** de movimientos
- ✅ **Relaciones entre tablas** con JOINs
- ✅ **Validaciones** de negocio robustas
- ✅ **Manejo de errores** profesional
- ✅ **Respuestas JSON** estandarizadas

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 18+ | Runtime de JavaScript |
| Express | 4.19+ | Framework web |
| MySQL | 8.0+ | Base de datos relacional |
| mysql2 | 3.11+ | Driver de MySQL con Promises |
| cors | 2.8+ | Middleware CORS |
| dotenv | 16.4+ | Variables de entorno |

---

## 📦 Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) v8.0 o superior
- [Git](https://git-scm.com/)

---

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/aprendizaje-inventario-carpas.git
cd aprendizaje-inventario-carpas/backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Crear base de datos
```bash
# Desde la raíz del proyecto
mysql -u root -p < sql/00_SCHEMA_COMPLETO.sql
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=aprendizaje_inventario

# Servidor
PORT=3000
```

### 5. Iniciar servidor
```bash
npm start
# o en modo desarrollo:
node server.js
```

El servidor estará disponible en: `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | (vacío) |
| `DB_NAME` | Nombre de la base de datos | `aprendizaje_inventario` |
| `PORT` | Puerto del servidor | `3000` |

---

## 📁 Estructura del Proyecto
```
backend/
├── config/
│   └── database.js           # Configuración de MySQL
├── controllers/
│   ├── categoriaController.js
│   ├── elementoController.js
│   ├── serieController.js
│   ├── loteController.js     # Lógica de lotes y movimientos
│   ├── materialController.js
│   └── unidadController.js
├── models/
│   ├── CategoriaModel.js
│   ├── ElementoModel.js
│   ├── SerieModel.js
│   ├── LoteModel.js          # Consultas SQL de lotes
│   ├── MaterialModel.js
│   └── UnidadModel.js
├── routes/
│   ├── categorias.js
│   ├── elementos.js
│   ├── series.js
│   ├── lotes.js              # Rutas de lotes
│   ├── materiales.js
│   └── unidades.js
├── .env                      # Variables de entorno
├── .gitignore
├── package.json
├── README.md
└── server.js                 # Punto de entrada
```

---

## 💡 Concepto: Series vs Lotes

Este sistema maneja inventario con **dos enfoques complementarios**:

### 🏷️ **Sistema de SERIES** (Elementos con `requiere_series = TRUE`)

**Para elementos únicos o de alto valor que necesitan tracking individual.**
```
Elemento: Carpa 10x10 Premium
  requiere_series: TRUE
  
Series (tabla series):
├── C10X10-001: estado=bueno, ubicacion=Bodega A
├── C10X10-002: estado=bueno, ubicacion=Bodega A
├── C10X10-003: estado=alquilado, ubicacion=NULL
├── C10X10-004: estado=mantenimiento, ubicacion=Taller
└── C10X10-005: estado=bueno, ubicacion=Bodega A

✅ Tracking exacto
✅ Sabes CUÁL carpa específica está alquilada
✅ Historial individual
```

**Ejemplos:** Carpas, Proyectores, Equipos de sonido, Tarimas

---

### 📦 **Sistema de LOTES** (Elementos con `requiere_series = FALSE`)

**Para elementos consumibles o de bajo valor que se manejan por cantidad.**
```
Elemento: Reatas de tensión
  requiere_series: FALSE
  
Lotes (tabla lotes - creación dinámica):
├── Lote 1: 70 reatas (bueno, Bodega A)
├── Lote 2: 30 reatas (alquilado, NULL)
└── Lote 3: 10 reatas (mantenimiento, Taller)

✅ Tracking por cantidad
✅ Sabes CUÁNTAS reatas alquiladas
✅ Lotes se crean/eliminan automáticamente
✅ Consolidación automática
```

**Ejemplos:** Reatas, Estacas, Tornillos, Cuerdas, Tubos

---

### 🔄 **Diferencias Clave**

| Aspecto | Series | Lotes |
|---------|--------|-------|
| **Granularidad** | Individual | Por cantidad |
| **Identificación** | Número único | Estado + Ubicación |
| **Cambio de estado** | Por serie | Por movimiento de cantidad |
| **Tracking** | Exacto (sabes cuál) | Aproximado (sabes cuántas) |
| **Complejidad** | Alta | Media |
| **Uso** | Elementos únicos | Elementos consumibles |

---

## 📡 Endpoints

### URL Base
```
http://localhost:3000/api
```

### Formato de Respuesta

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "mensaje": "Operación exitosa"
}
```

**Respuesta de Error:**
```json
{
  "success": false,
  "mensaje": "Descripción del error",
  "error": "Detalles técnicos"
}
```

---

## 📂 Categorías

Gestión de categorías y subcategorías (jerarquía ilimitada).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categorias` | Obtener todas |
| GET | `/api/categorias/padres` | Solo categorías raíz |
| GET | `/api/categorias/:id` | Obtener por ID |
| GET | `/api/categorias/:id/hijas` | Subcategorías de una categoría |
| POST | `/api/categorias` | Crear nueva |
| PUT | `/api/categorias/:id` | Actualizar |
| DELETE | `/api/categorias/:id` | Eliminar |

---

## 📦 Elementos

Gestión de elementos del inventario.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/elementos` | Obtener todos |
| GET | `/api/elementos/con-series` | Solo elementos con series |
| GET | `/api/elementos/sin-series` | Solo elementos con lotes |
| GET | `/api/elementos/buscar?q=termino` | Buscar elementos |
| GET | `/api/elementos/:id` | Obtener por ID |
| POST | `/api/elementos` | Crear nuevo |
| PUT | `/api/elementos/:id` | Actualizar |
| DELETE | `/api/elementos/:id` | Eliminar |

---

## 🏷️ Series

Gestión de números de serie individuales.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/series` | Obtener todas |
| GET | `/api/series/disponibles` | Series en estado "bueno" |
| GET | `/api/series/alquiladas` | Series en estado "alquilado" |
| GET | `/api/series/estado/:estado` | Series por estado |
| GET | `/api/series/elemento/:elementoId` | Series de un elemento |
| GET | `/api/series/numero/:numeroSerie` | Buscar por número |
| GET | `/api/series/:id` | Obtener por ID |
| POST | `/api/series` | Crear nueva |
| PUT | `/api/series/:id` | Actualizar |
| PATCH | `/api/series/:id/estado` | Cambiar solo el estado |
| DELETE | `/api/series/:id` | Eliminar |

### Ejemplo: Cambiar estado de serie
```bash
PATCH /api/series/1/estado
```

**Body:**
```json
{
  "estado": "alquilado",
  "ubicacion": null
}
```

---

## 📊 Lotes

Gestión de lotes para elementos sin series.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/lotes` | Obtener todos los lotes |
| GET | `/api/lotes/resumen` | **Resumen de disponibilidad** |
| GET | `/api/lotes/estado/:estado` | Lotes por estado |
| GET | `/api/lotes/elemento/:elementoId` | Lotes de un elemento |
| GET | `/api/lotes/:id` | Obtener por ID |
| GET | `/api/lotes/:id/historial` | **Historial de movimientos** |
| POST | `/api/lotes` | Crear lote manualmente |
| POST | `/api/lotes/movimiento` | **⭐ Mover cantidad (principal)** |
| PUT | `/api/lotes/:id` | Actualizar lote |
| DELETE | `/api/lotes/:id` | Eliminar lote vacío |

---

### 📊 GET `/api/lotes/resumen` - Resumen de Disponibilidad

Obtiene un resumen de la disponibilidad de todos los elementos sin series.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "elemento": "Reatas de tensión",
      "cantidad_total": 0,
      "disponibles": 70,
      "alquilados": 30,
      "en_mantenimiento": 0
    },
    {
      "id": 7,
      "elemento": "Estacas metálicas",
      "cantidad_total": 0,
      "disponibles": 0,
      "alquilados": 0,
      "en_mantenimiento": 0
    }
  ],
  "total": 7
}
```

---

### 📊 GET `/api/lotes/elemento/:elementoId` - Lotes de un Elemento

Obtiene todos los lotes de un elemento específico con estadísticas.

**Ejemplo:**
```
GET /api/lotes/elemento/6
```

**Respuesta:**
```json
{
  "success": true,
  "elemento": {
    "id": 6,
    "nombre": "Reatas de tensión",
    "cantidad_total": 0
  },
  "estadisticas": {
    "total": 100,
    "disponibles": 70,
    "nuevos": 0,
    "alquilados": 30,
    "en_mantenimiento": 0,
    "dañados": 0
  },
  "lotes": [
    {
      "id": 1,
      "lote_numero": "REATAS-2025-001",
      "cantidad": 70,
      "estado": "bueno",
      "ubicacion": "Bodega A",
      "created_at": "2025-10-15T..."
    },
    {
      "id": 6,
      "lote_numero": "LOTE-1729012345",
      "cantidad": 30,
      "estado": "alquilado",
      "ubicacion": null,
      "created_at": "2025-10-15T..."
    }
  ],
  "total_lotes": 2
}
```

---

### ⭐ POST `/api/lotes/movimiento` - Mover Cantidad (Función Principal)

**Este es el endpoint más importante del sistema de lotes.**

Mueve una cantidad de un lote a otro estado/ubicación. El sistema automáticamente:
- ✅ Busca si existe un lote con el estado/ubicación destino
- ✅ Si existe: suma la cantidad (consolidación)
- ✅ Si no existe: crea un nuevo lote
- ✅ Resta la cantidad del lote origen
- ✅ Registra el movimiento en el historial
- ✅ Elimina el lote origen si queda vacío

**Body:**
```json
{
  "lote_origen_id": 1,
  "cantidad": 30,
  "estado_destino": "alquilado",
  "ubicacion_destino": null,
  "motivo": "alquiler",
  "descripcion": "Cliente ABC - Evento Boda - Parque Central",
  "costo_reparacion": null
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `lote_origen_id` | number | ✅ Sí | ID del lote de donde se mueve |
| `cantidad` | number | ✅ Sí | Cantidad a mover (debe ser > 0) |
| `estado_destino` | string | ✅ Sí | Estado destino (`nuevo`, `bueno`, `mantenimiento`, `alquilado`, `dañado`) |
| `ubicacion_destino` | string | No | Ubicación destino (puede ser `null`) |
| `motivo` | string | No | Motivo del movimiento (`alquiler`, `devolucion`, `limpieza`, etc.) |
| `descripcion` | string | No | Descripción detallada |
| `costo_reparacion` | number | No | Costo de reparación (si aplica) |

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Movimiento realizado exitosamente",
  "movimiento": {
    "cantidad_movida": 30,
    "estado_origen": "bueno",
    "estado_destino": "alquilado",
    "lote_origen_eliminado": false,
    "lote_destino_creado": true
  },
  "estadisticas": {
    "total": 100,
    "disponibles": 70,
    "nuevos": 0,
    "alquilados": 30,
    "en_mantenimiento": 0,
    "dañados": 0
  },
  "lotes_actuales": [
    {
      "id": 1,
      "cantidad": 70,
      "estado": "bueno",
      "ubicacion": "Bodega A"
    },
    {
      "id": 6,
      "cantidad": 30,
      "estado": "alquilado",
      "ubicacion": null
    }
  ]
}
```

---

### 📜 GET `/api/lotes/:id/historial` - Historial de Movimientos

Obtiene el historial completo de movimientos de un lote.

**Ejemplo:**
```
GET /api/lotes/1/historial
```

**Respuesta:**
```json
{
  "success": true,
  "lote": {
    "id": 1,
    "elemento": "Reatas de tensión",
    "cantidad_actual": 70,
    "estado": "bueno"
  },
  "historial": [
    {
      "id": 2,
      "lote_origen_id": 1,
      "lote_destino_id": 6,
      "cantidad": 20,
      "motivo": "alquiler",
      "descripcion": "Cliente XYZ - Evento Corporativo",
      "estado_origen": "bueno",
      "estado_destino": "alquilado",
      "ubicacion_origen": "Bodega A",
      "ubicacion_destino": null,
      "fecha_movimiento": "2025-10-15T14:30:00.000Z"
    },
    {
      "id": 1,
      "lote_origen_id": 1,
      "lote_destino_id": 6,
      "cantidad": 30,
      "motivo": "alquiler",
      "descripcion": "Cliente ABC - Evento Boda",
      "estado_origen": "bueno",
      "estado_destino": "alquilado",
      "fecha_movimiento": "2025-10-15T10:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

## 🎨 Materiales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/materiales` | Obtener todos |
| GET | `/api/materiales/mas-usados` | Materiales más usados |
| GET | `/api/materiales/buscar?q=termino` | Buscar materiales |
| GET | `/api/materiales/:id` | Obtener por ID |
| POST | `/api/materiales` | Crear nuevo |
| PUT | `/api/materiales/:id` | Actualizar |
| DELETE | `/api/materiales/:id` | Eliminar |

---

## 📏 Unidades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/unidades` | Obtener todas |
| GET | `/api/unidades/mas-usadas` | Unidades más usadas |
| GET | `/api/unidades/tipo/:tipo` | Unidades por tipo |
| GET | `/api/unidades/:id` | Obtener por ID |
| POST | `/api/unidades` | Crear nueva |
| PUT | `/api/unidades/:id` | Actualizar |
| DELETE | `/api/unidades/:id` | Eliminar |

---

## 💡 Ejemplos de Uso

### 🔄 Ejemplo 1: Flujo Completo de Alquiler de Reatas
```bash
# ESTADO INICIAL
# ════════════════════════════════════════
GET /api/lotes/elemento/6

Lotes actuales:
- Lote 1: 100 reatas (bueno, Bodega A)

# DÍA 1: Cliente alquila 30 reatas
# ════════════════════════════════════════
POST /api/lotes/movimiento
{
  "lote_origen_id": 1,
  "cantidad": 30,
  "estado_destino": "alquilado",
  "ubicacion_destino": null,
  "motivo": "alquiler",
  "descripcion": "Cliente ABC - Boda en Parque Central"
}

Resultado:
- Lote 1: 70 reatas (bueno, Bodega A)
- Lote 2: 30 reatas (alquilado, NULL) ← CREADO AUTOMÁTICAMENTE

# DÍA 2: Otro cliente alquila 20 reatas
# ════════════════════════════════════════
POST /api/lotes/movimiento
{
  "lote_origen_id": 1,
  "cantidad": 20,
  "estado_destino": "alquilado",
  "ubicacion_destino": null,
  "motivo": "alquiler",
  "descripcion": "Cliente XYZ - Evento Corporativo"
}

Resultado:
- Lote 1: 50 reatas (bueno, Bodega A)
- Lote 2: 50 reatas (alquilado, NULL) ← CONSOLIDACIÓN: 30 + 20

# DÍA 3: Cliente ABC devuelve 30 sucias
# ════════════════════════════════════════
POST /api/lotes/movimiento
{
  "lote_origen_id": 2,
  "cantidad": 30,
  "estado_destino": "mantenimiento",
  "ubicacion_destino": "Taller",
  "motivo": "devolucion",
  "descripcion": "Devolución - Requieren limpieza"
}

Resultado:
- Lote 1: 50 reatas (bueno, Bodega A)
- Lote 2: 20 reatas (alquilado, NULL)
- Lote 3: 30 reatas (mantenimiento, Taller) ← CREADO

# DÍA 4: Se limpian 20 reatas
# ════════════════════════════════════════
POST /api/lotes/movimiento
{
  "lote_origen_id": 3,
  "cantidad": 20,
  "estado_destino": "bueno",
  "ubicacion_destino": "Bodega A",
  "motivo": "limpieza",
  "descripcion": "Limpieza completada"
}

Resultado:
- Lote 1: 70 reatas (bueno, Bodega A) ← CONSOLIDÓ: 50 + 20
- Lote 2: 20 reatas (alquilado, NULL)
- Lote 3: 10 reatas (mantenimiento, Taller)

# VERIFICAR HISTORIAL
# ════════════════════════════════════════
GET /api/lotes/1/historial

Ver todos los movimientos registrados.
```

---

### 🏷️ Ejemplo 2: Gestión de Elementos con Series
```bash
# Ver carpas disponibles
GET /api/series/disponibles

# Alquilar una carpa específica
PATCH /api/series/3/estado
{
  "estado": "alquilado",
  "ubicacion": null
}

# Ver estadísticas de un elemento
GET /api/series/elemento/1

# Cuando se devuelve, mandar a mantenimiento
PATCH /api/series/3/estado
{
  "estado": "mantenimiento",
  "ubicacion": "Taller"
}

# Después de limpieza, disponible
PATCH /api/series/3/estado
{
  "estado": "bueno",
  "ubicacion": "Bodega A"
}
```

---

### 🔍 Ejemplo 3: Consultas de Disponibilidad
```bash
# Resumen general de elementos con lotes
GET /api/lotes/resumen

# Elementos con series disponibles
GET /api/series/disponibles

# Buscar elementos
GET /api/elementos/buscar?q=carpa

# Ver solo elementos sin series
GET /api/elementos/sin-series

# Ver categoría con todos sus elementos
GET /api/elementos?categoria_id=5
```

---

## 📊 Códigos de Estado

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Petición exitosa (GET, PUT, PATCH, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 400 | Bad Request | Datos inválidos o faltantes |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## ⚠️ Manejo de Errores

### Validaciones Comunes

**Cantidad insuficiente:**
```json
{
  "success": false,
  "mensaje": "Cantidad insuficiente en lote origen. Disponible: 50, Solicitado: 100"
}
```

**Estado inválido:**
```json
{
  "success": false,
  "mensaje": "Estado destino inválido",
  "estadosValidos": ["nuevo", "bueno", "mantenimiento", "alquilado", "dañado"]
}
```

**Elemento requiere series:**
```json
{
  "success": false,
  "mensaje": "Este elemento requiere series individuales. Use el endpoint /api/series"
}
```

**Lote con cantidad:**
```json
{
  "success": false,
  "mensaje": "No se puede eliminar un lote con cantidad 50. Primero mueva o reduzca la cantidad a 0."
}
```

---

## 🧪 Probar la API

### Con Thunder Client (VS Code)

1. Instalar extensión **Thunder Client**
2. Importar colección (opcional)
3. Crear requests según los ejemplos
4. Probar endpoints

### Con curl
```bash
# GET
curl http://localhost:3000/api/lotes/resumen

# POST
curl -X POST http://localhost:3000/api/lotes/movimiento \
  -H "Content-Type: application/json" \
  -d '{
    "lote_origen_id": 1,
    "cantidad": 30,
    "estado_destino": "alquilado",
    "ubicacion_destino": null,
    "motivo": "alquiler"
  }'
```

---

## 🚧 Notas Importantes

### Sobre Elementos y Lotes

- Un elemento con `requiere_series = TRUE` **NO puede** tener lotes
- Un elemento con `requiere_series = FALSE` **NO puede** tener series
- La decisión es a nivel de elemento y no se puede cambiar después de crear series o lotes

### Sobre Movimientos de Lotes

- Los lotes se crean **automáticamente** al hacer movimientos
- Los lotes **se consolidan** si ya existe uno con mismo estado+ubicación
- Los lotes **se eliminan** automáticamente cuando quedan en cantidad 0
- Todos los movimientos se registran en `lotes_movimientos` para auditoría

### Sobre Estados

**Elementos y Series:**
- `nuevo`, `bueno`, `mantenimiento`, `alquilado`, `dañado`, `agotado`

**Lotes:**
- `nuevo`, `bueno`, `mantenimiento`, `alquilado`, `dañado`

---

## 📝 TODO / Futuras Mejoras

- [ ] Autenticación y autorización (JWT)
- [ ] Sistema de usuarios y roles
- [ ] Paginación en listados grandes
- [ ] Filtros avanzados por fecha
- [ ] Dashboard con estadísticas
- [ ] Sistema de alquileres completo
- [ ] Notificaciones automáticas
- [ ] Reportes en PDF
- [ ] Tests automatizados
- [ ] Documentación con Swagger/OpenAPI

---

## 👨‍💻 Autor

**Anderson Moreno**

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Última actualización:** 15 de octubre de 2025  
**Versión:** 2.0 - Sistema completo con Lotes