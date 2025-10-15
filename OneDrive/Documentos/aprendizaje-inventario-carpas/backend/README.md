# 🚀 API REST - Sistema de Inventario de Carpas

API RESTful desarrollada con Node.js y Express para gestionar inventario de elementos de alquiler con números de serie individuales.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Endpoints](#-endpoints)
  - [Categorías](#categorías)
  - [Elementos](#elementos)
  - [Series](#series)
- [Ejemplos de Uso](#-ejemplos-de-uso)
- [Códigos de Estado](#-códigos-de-estado)
- [Manejo de Errores](#-manejo-de-errores)

---

## ✨ Características

- ✅ **Arquitectura MVC** (Model-View-Controller)
- ✅ **CRUD completo** para todos los recursos
- ✅ **Relaciones entre tablas** (JOINs)
- ✅ **Validaciones** de negocio
- ✅ **Manejo de errores** robusto
- ✅ **Consultas avanzadas** (búsquedas, filtros, estadísticas)
- ✅ **Gestión de series individuales** con números únicos
- ✅ **Sistema de estados** para elementos y series
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

Antes de comenzar, asegúrate de tener instalado:

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
│   ├── categoriaController.js # Lógica de negocio de categorías
│   ├── elementoController.js  # Lógica de negocio de elementos
│   └── serieController.js     # Lógica de negocio de series
├── models/
│   ├── CategoriaModel.js     # Consultas SQL de categorías
│   ├── ElementoModel.js      # Consultas SQL de elementos
│   └── SerieModel.js         # Consultas SQL de series
├── routes/
│   ├── categorias.js         # Rutas de categorías
│   ├── elementos.js          # Rutas de elementos
│   └── series.js             # Rutas de series
├── .env                      # Variables de entorno (no incluido en Git)
├── .gitignore               # Archivos ignorados por Git
├── package.json             # Dependencias del proyecto
├── README.md                # Este archivo
└── server.js                # Punto de entrada del servidor
```

---

## 📡 Endpoints

### URL Base
```
http://localhost:3000/api
```

### Formato de Respuesta

Todas las respuestas siguen este formato estándar:

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

### Obtener todas las categorías
```http
GET /api/categorias
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Carpas",
      "padre_id": null,
      "created_at": "2025-10-14T16:30:00.000Z"
    },
    {
      "id": 6,
      "nombre": "Carpas Grandes",
      "padre_id": 1,
      "created_at": "2025-10-14T16:30:00.000Z"
    }
  ],
  "total": 12
}
```

---

### Obtener categorías padre
```http
GET /api/categorias/padres
```

**Descripción:** Retorna solo las categorías que no tienen padre (categorías raíz).

---

### Obtener categoría por ID
```http
GET /api/categorias/:id
```

**Parámetros:**
- `id` (number) - ID de la categoría

**Ejemplo:**
```http
GET /api/categorias/1
```

---

### Obtener subcategorías de una categoría
```http
GET /api/categorias/:id/hijas
```

**Ejemplo:**
```http
GET /api/categorias/1/hijas
```

**Respuesta:** Todas las subcategorías que tienen como padre la categoría ID 1.

---

### Crear nueva categoría
```http
POST /api/categorias
```

**Body:**
```json
{
  "nombre": "Carpas VIP",
  "padre_id": 1
}
```

**Validaciones:**
- `nombre` es obligatorio
- `padre_id` es opcional (si es null, será categoría padre)

---

### Actualizar categoría
```http
PUT /api/categorias/:id
```

**Body:**
```json
{
  "nombre": "Carpas Premium",
  "padre_id": 1
}
```

---

### Eliminar categoría
```http
DELETE /api/categorias/:id
```

**Nota:** Si la categoría tiene subcategorías, estas quedarán sin padre (padre_id = null).

---

## 📦 Elementos

Gestión de elementos del inventario con o sin números de serie.

### Obtener todos los elementos
```http
GET /api/elementos
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Carpa 10x10",
      "descripcion": "Carpa de tela nautica...",
      "cantidad": 5,
      "requiere_series": 1,
      "estado": "bueno",
      "ubicacion": "Bodega A",
      "fecha_ingreso": "2024-01-15",
      "categoria": "Carpas Grandes",
      "material": "Tela Nautica",
      "unidad": "Unidad",
      "unidad_abrev": "und"
    }
  ],
  "total": 5
}
```

---

### Obtener elemento por ID
```http
GET /api/elementos/:id
```

---

### Obtener elementos por categoría
```http
GET /api/elementos/categoria/:categoriaId
```

**Ejemplo:**
```http
GET /api/elementos/categoria/6
```

---

### Obtener elementos con series
```http
GET /api/elementos/con-series
```

**Descripción:** Retorna solo elementos que requieren números de serie individuales.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Carpa 10x10",
      "cantidad": 5,
      "estado": "bueno",
      "categoria": "Carpas Grandes",
      "total_series": 5
    }
  ],
  "total": 2
}
```

---

### Obtener elementos sin series
```http
GET /api/elementos/sin-series
```

**Descripción:** Retorna elementos que se manejan solo por cantidad total (stock general).

---

### Buscar elementos
```http
GET /api/elementos/buscar?q=termino
```

**Query Params:**
- `q` (string) - Término de búsqueda

**Ejemplo:**
```http
GET /api/elementos/buscar?q=carpa
```

---

### Crear nuevo elemento
```http
POST /api/elementos
```

**Body:**
```json
{
  "nombre": "Carpa 8x8 Estándar",
  "descripcion": "Carpa económica para eventos pequeños",
  "cantidad": 10,
  "requiere_series": false,
  "categoria_id": 7,
  "material_id": 1,
  "unidad_id": 3,
  "estado": "bueno",
  "ubicacion": "Bodega B",
  "fecha_ingreso": "2025-10-14"
}
```

**Validaciones:**
- `nombre` es obligatorio
- Todos los demás campos son opcionales

**Valores por defecto:**
- `cantidad`: 0
- `requiere_series`: false
- `estado`: "bueno"

---

### Actualizar elemento
```http
PUT /api/elementos/:id
```

**Body:** Mismo formato que crear, todos los campos opcionales.

---

### Eliminar elemento
```http
DELETE /api/elementos/:id
```

**Nota:** Si el elemento tiene series, estas se eliminarán automáticamente (ON DELETE CASCADE).

---

## 🏷️ Series

Gestión de números de serie individuales para elementos.

### Obtener todas las series
```http
GET /api/series
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_serie": "C10X10-001",
      "estado": "bueno",
      "ubicacion": "Bodega A",
      "fecha_ingreso": "2024-01-15",
      "elemento_id": 1,
      "elemento_nombre": "Carpa 10x10",
      "categoria": "Carpas Grandes"
    }
  ],
  "total": 8
}
```

---

### Obtener serie por ID
```http
GET /api/series/:id
```

---

### Obtener serie por número de serie
```http
GET /api/series/numero/:numeroSerie
```

**Ejemplo:**
```http
GET /api/series/numero/C10X10-001
```

---

### Obtener series de un elemento
```http
GET /api/series/elemento/:elementoId
```

**Ejemplo:**
```http
GET /api/series/elemento/1
```

**Respuesta:**
```json
{
  "success": true,
  "elemento": {
    "id": 1,
    "nombre": "Carpa 10x10"
  },
  "estadisticas": {
    "total": 5,
    "disponibles": 2,
    "alquiladas": 1,
    "en_mantenimiento": 1
  },
  "data": [
    {
      "id": 1,
      "numero_serie": "C10X10-001",
      "estado": "bueno",
      "ubicacion": "Bodega A",
      "fecha_ingreso": "2024-01-15"
    }
  ],
  "total": 5
}
```

---

### Obtener series por estado
```http
GET /api/series/estado/:estado
```

**Estados válidos:**
- `nuevo`
- `bueno`
- `mantenimiento`
- `alquilado`
- `dañado`

**Ejemplo:**
```http
GET /api/series/estado/alquilado
```

---

### Obtener series disponibles
```http
GET /api/series/disponibles
```

**Descripción:** Retorna series en estado "bueno" (disponibles para alquilar).

---

### Obtener series alquiladas
```http
GET /api/series/alquiladas
```

---

### Crear nueva serie
```http
POST /api/series
```

**Body:**
```json
{
  "id_elemento": 1,
  "numero_serie": "C10X10-006",
  "estado": "nuevo",
  "ubicacion": "Bodega A",
  "fecha_ingreso": "2025-10-14"
}
```

**Validaciones:**
- `id_elemento` es obligatorio
- `numero_serie` es obligatorio y debe ser único
- El elemento debe existir
- El elemento debe requerir series (`requiere_series = true`)

---

### Actualizar serie
```http
PUT /api/series/:id
```

**Body:**
```json
{
  "numero_serie": "C10X10-006-NUEVA",
  "estado": "bueno",
  "ubicacion": "Bodega B",
  "fecha_ingreso": "2025-10-14"
}
```

---

### Cambiar estado de serie
```http
PATCH /api/series/:id/estado
```

**Body:**
```json
{
  "estado": "alquilado",
  "ubicacion": null
}
```

**Descripción:** Endpoint específico para cambiar solo el estado (más rápido que PUT).

---

### Eliminar serie
```http
DELETE /api/series/:id
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Flujo completo de crear elemento con series
```bash
# 1. Crear el elemento
POST /api/elementos
{
  "nombre": "Proyector 4K",
  "cantidad": 3,
  "requiere_series": true,
  "categoria_id": 5,
  "estado": "nuevo"
}

# Respuesta: { "data": { "id": 6 } }

# 2. Crear series para ese elemento
POST /api/series
{
  "id_elemento": 6,
  "numero_serie": "PROJ4K-001",
  "estado": "nuevo",
  "ubicacion": "Bodega C"
}

POST /api/series
{
  "id_elemento": 6,
  "numero_serie": "PROJ4K-002",
  "estado": "nuevo",
  "ubicacion": "Bodega C"
}

# 3. Ver las series del elemento
GET /api/series/elemento/6
```

---

### Ejemplo 2: Buscar y alquilar una serie
```bash
# 1. Buscar series disponibles de carpas
GET /api/series/disponibles

# 2. Cambiar estado a alquilado
PATCH /api/series/1/estado
{
  "estado": "alquilado",
  "ubicacion": null
}

# 3. Cuando se devuelve, cambiar a estado de mantenimiento
PATCH /api/series/1/estado
{
  "estado": "mantenimiento",
  "ubicacion": "Taller"
}

# 4. Después de limpieza, disponible nuevamente
PATCH /api/series/1/estado
{
  "estado": "bueno",
  "ubicacion": "Bodega A"
}
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

### Error de validación (400)
```json
{
  "success": false,
  "mensaje": "El nombre es obligatorio"
}
```

### Recurso no encontrado (404)
```json
{
  "success": false,
  "mensaje": "Elemento no encontrado"
}
```

### Error del servidor (500)
```json
{
  "success": false,
  "mensaje": "Error al obtener elementos",
  "error": "Connection timeout"
}
```

---

## 🧪 Probar la API

### Usar el navegador

Para peticiones GET simples:
```
http://localhost:3000/api/categorias
```

### Usar curl
```bash
# GET
curl http://localhost:3000/api/categorias

# POST
curl -X POST http://localhost:3000/api/categorias \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nueva Categoría", "padre_id": 1}'

# PUT
curl -X PUT http://localhost:3000/api/categorias/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Categoría Actualizada"}'

# DELETE
curl -X DELETE http://localhost:3000/api/categorias/1
```

### Usar Thunder Client (VS Code)

1. Instalar extensión Thunder Client
2. Nueva Request → POST
3. URL: `http://localhost:3000/api/categorias`
4. Body → JSON → Escribir el JSON
5. Send

---

## 🚧 TODO / Futuras Mejoras

- [ ] Autenticación y autorización (JWT)
- [ ] Paginación en listados grandes
- [ ] Filtros avanzados (por rango de fechas, múltiples estados)
- [ ] Endpoints de estadísticas (dashboards)
- [ ] Sistema de logs
- [ ] Tests automatizados
- [ ] Documentación con Swagger/OpenAPI
- [ ] Rate limiting
- [ ] Webhooks para notificaciones

---

## 📝 Notas

### Sobre los números de serie

- Cada serie tiene un número **único** en todo el sistema
- Solo elementos con `requiere_series = true` pueden tener series
- Al eliminar un elemento, sus series se eliminan automáticamente

### Sobre las categorías

- Soportan jerarquía ilimitada (categoría → subcategoría → sub-subcategoría...)
- Al eliminar una categoría padre, las hijas quedan sin padre (no se eliminan)

### Sobre los estados

**Elementos:**
- `nuevo`, `bueno`, `mantenimiento`, `alquilado`, `dañado`, `agotado`

**Series:**
- `nuevo`, `bueno`, `mantenimiento`, `alquilado`, `dañado`

---

## 👨‍💻 Autor

**Anderson Moreno**

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Última actualización:** 14 de octubre de 2025