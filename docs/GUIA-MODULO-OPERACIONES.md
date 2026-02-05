# Guia para Trabajar en el Modulo de Operaciones

## Resumen

Esta guia documenta la arquitectura, patrones y convenciones aprendidos durante el desarrollo del modulo de Alquileres. Sirve como referencia para continuar con el modulo de Operaciones.

---

## 1. Arquitectura General del Proyecto

### Estructura de Directorios

```
backend/
├── config/
│   ├── constants.js          # Estados, limites, mensajes estandar
│   └── database.js           # Pool MySQL (mysql2/promise, 10 conexiones)
├── middleware/
│   ├── errorHandler.js       # Manejo global de errores (MySQL codes, dev/prod)
│   ├── httpLogger.js         # Log de requests HTTP
│   └── validator.js          # Validadores reutilizables (validateId, required, etc.)
├── modules/
│   ├── alquileres/           # Modulo comercial (cotizaciones, clientes, eventos)
│   ├── operaciones/          # Modulo operativo (ordenes, salida/retorno)
│   ├── inventario/           # Stock fisico (categorias, elementos, series, lotes)
│   ├── productos/            # Productos compuestos (templates)
│   ├── configuracion/        # Datos maestros (ciudades, empleados, vehiculos)
│   └── auth/                 # Autenticacion JWT + roles
├── utils/
│   ├── AppError.js           # throw new AppError('mensaje', 400)
│   ├── logger.js             # logger.info/warn/error/database
│   └── pagination.js         # Helper de paginacion
└── server.js                 # Entry point, middleware stack, rutas

inventario-frontend/src/
├── api/                      # 25 archivos, uno por entidad
│   ├── Axios.config.js       # Interceptors (token auto-refresh, auth header)
│   └── api[Entidad].js       # CRUD functions por entidad
├── components/               # 81 componentes JSX
│   ├── common/               # Modal, Button, Badge, Spinner, EmptyState...
│   ├── cards/                # Tarjetas de entidades
│   ├── forms/                # Modales de formulario
│   ├── modals/               # Modales de detalle/accion
│   └── layouts/              # AlquileresLayout (sidebar + Outlet)
├── hooks/                    # 36 hooks (React Query wrappers)
├── pages/                    # 26 paginas
├── stores/
│   └── authStore.js          # Zustand (usuario, tokens, permisos)
└── utils/
    ├── helpers.js            # formatearFecha, formatearMoneda, etc.
    ├── constants.js          # Estados, colores, config React Query
    └── validation.js         # Reglas para react-hook-form
```

---

## 2. Patrones de Codigo (Backend)

### 2.1 Modelo (Static Methods + Pool)

Todos los modelos usan metodos estaticos con el pool de MySQL:

```javascript
// backend/modules/[modulo]/models/[Entidad]Model.js
const pool = require('../../../config/database');

class EntidadModel {
  // READ - Siempre retorna rows
  static async obtenerTodos() {
    const query = `SELECT * FROM tabla ORDER BY created_at DESC`;
    const [rows] = await pool.query(query);
    return rows;
  }

  // READ con parametro - Usa placeholder ?
  static async obtenerPorId(id) {
    const query = `SELECT * FROM tabla WHERE id = ?`;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  // CREATE - Destructuring de campos
  static async crear({ campo1, campo2 }) {
    const query = `INSERT INTO tabla (campo1, campo2) VALUES (?, ?)`;
    const [result] = await pool.query(query, [campo1, campo2]);
    return { id: result.insertId, campo1, campo2 };
  }

  // UPDATE - Solo campos proporcionados
  static async actualizar(id, { campo1, campo2 }) {
    const query = `UPDATE tabla SET campo1 = ?, campo2 = ? WHERE id = ?`;
    const [result] = await pool.query(query, [campo1, campo2, id]);
    return result.affectedRows > 0;
  }

  // DELETE (soft o hard segun entidad)
  static async eliminar(id) {
    const [result] = await pool.query(`DELETE FROM tabla WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = EntidadModel;
```

### 2.2 Controlador (exports + try/catch/next)

```javascript
// backend/modules/[modulo]/controllers/[entidad]Controller.js
const EntidadModel = require('../models/EntidadModel');
const AppError = require('../../../utils/AppError');

// Patron estandar: async (req, res, next) + try/catch
exports.obtenerTodos = async (req, res, next) => {
  try {
    const datos = await EntidadModel.obtenerTodos();
    res.json({ success: true, data: datos, total: datos.length });
  } catch (error) {
    next(error); // Error handler global lo procesa
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { campo1, campo2 } = req.body;
    if (!campo1) throw new AppError('campo1 es requerido', 400);

    const nuevo = await EntidadModel.crear({ campo1, campo2 });
    res.status(201).json({ success: true, data: nuevo, message: 'Creado exitosamente' });
  } catch (error) {
    next(error);
  }
};
```

**Formato de respuesta estandar:**
```json
{ "success": true, "data": [...], "total": 10, "message": "opcional" }
```

### 2.3 Rutas (Express Router)

```javascript
// backend/modules/[modulo]/routes/[entidad].js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/[entidad]Controller');

// Orden: GET generales primero, luego GET con params, POST, PUT, DELETE
router.get('/', controller.obtenerTodos);
router.get('/:id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
```

**Registro en server.js:**
```javascript
app.use('/api/[ruta]', require('./modules/[modulo]/routes/[entidad]'));
```

### 2.4 Servicios (Logica compleja)

Para operaciones que involucran multiples modelos o logica de negocio compleja:

```javascript
// backend/modules/[modulo]/services/[Nombre]Service.js
class NombreService {
  // Metodos estaticos para operaciones complejas
  static async operacionCompleja(params) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // ... multiples queries
      await connection.commit();
      return resultado;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
```

**Ejemplo real:** `SincronizacionAlquilerService.js` (1,549 lineas) maneja:
- Asignacion de elementos fisicos a ordenes
- Ejecucion de salida (actualiza inventario, activa alquiler)
- Registro de retorno (restaura inventario, calcula danos)
- Todo con transacciones y rollback

---

## 3. Patrones de Codigo (Frontend)

### 3.1 Archivo API

```javascript
// inventario-frontend/src/api/api[Entidad].js
import api from './Axios.config';

const apiEntidad = {
  obtenerTodos: async () => {
    const response = await api.get('/entidad');
    return response.data;
  },
  obtenerPorId: async (id) => {
    const response = await api.get(`/entidad/${id}`);
    return response.data;
  },
  crear: async (datos) => {
    const response = await api.post('/entidad', datos);
    return response.data;
  },
  actualizar: async (id, datos) => {
    const response = await api.put(`/entidad/${id}`, datos);
    return response.data;
  },
  eliminar: async (id) => {
    const response = await api.delete(`/entidad/${id}`);
    return response.data;
  },
  // Con query params:
  obtenerConFiltro: async ({ param1, param2 } = {}) => {
    const params = {};
    if (param1) params.param1 = param1;
    if (param2) params.param2 = param2;
    const response = await api.get('/entidad/ruta', { params });
    return response.data;
  }
};

export default apiEntidad;
```

### 3.2 Hook (React Query)

```javascript
// inventario-frontend/src/hooks/use[Entidad].js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiEntidad from '../api/api[Entidad]';

// === QUERIES ===

// Query simple
export const useGetEntidades = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entidades'],
    queryFn: apiEntidad.obtenerTodos
  });
  return {
    entidades: data?.data || [],
    isLoading, error, refetch
  };
};

// Query con parametro (se deshabilita si no hay id)
export const useGetEntidad = (id) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entidad', id],
    queryFn: () => apiEntidad.obtenerPorId(id),
    enabled: !!id
  });
  return {
    entidad: data?.data || null,
    isLoading, error, refetch
  };
};

// Query con filtros (filtros van en queryKey para auto-refetch)
export const useGetEntidadesConFiltro = (filtros = {}) => {
  const { param1, param2 } = filtros;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entidades', 'filtro', param1, param2],
    queryFn: () => apiEntidad.obtenerConFiltro({ param1, param2 })
  });
  return {
    entidades: data?.data || [],
    isLoading, error, refetch
  };
};

// === MUTATIONS ===

export const useCrearEntidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => apiEntidad.crear(datos),
    retry: 0,
    onSuccess: () => {
      // Invalida queries relacionadas para que se refresquen
      queryClient.invalidateQueries({ queryKey: ['entidades'] });
    }
  });
};

export const useActualizarEntidad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => apiEntidad.actualizar(id, datos),
    retry: 0,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entidades'] });
      queryClient.invalidateQueries({ queryKey: ['entidad', variables.id] });
    }
  });
};
```

**Claves de cache importantes:**
- `queryKey` debe incluir todos los parametros que afectan la query
- Cambiar cualquier valor en `queryKey` dispara un refetch automatico
- `invalidateQueries` marca como stale y dispara refetch inmediato

### 3.3 Pagina Tipica (Patron Consistente)

**IMPORTANTE:** Todas las paginas dentro de un layout con sidebar deben seguir este patron exacto para mantener consistencia visual entre modulos.

```jsx
// inventario-frontend/src/pages/[Entidad]Page.jsx
import { useState } from 'react';
import { Plus, Search, Icono } from 'lucide-react';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useGetEntidades } from '../hooks/use[Entidad]';
import EntidadCard from '../components/cards/EntidadCard';
import EntidadFormModal from '../components/forms/EntidadFormModal';

const EntidadPage = () => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { entidades, isLoading, error, refetch } = useGetEntidades();

  const filtradas = entidades.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // === LOADING: Spinner inline (NUNCA fullScreen dentro de sidebar) ===
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Cargando entidades..." />
      </div>
    );
  }

  // === ERROR: Banner inline ===
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar entidades: {error.message || 'Ocurrió un error inesperado'}
          <Button variant="ghost" onClick={() => refetch()} className="ml-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* === HEADER CONSISTENTE === */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icono className="w-6 h-6 text-blue-600" />
              </div>
              Titulo de la Pagina
            </h1>
            <p className="text-slate-500 mt-1">
              Descripcion breve de la pagina
            </p>
          </div>

          {/* Botones de accion alineados a la derecha */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => setModalAbierto(true)}
            >
              Nueva Entidad
            </Button>
          </div>
        </div>
      </div>

      {/* === BUSCADOR (si aplica) === */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      {/* === CONTADOR === */}
      <div className="mb-4 text-sm text-slate-500">
        Mostrando {filtradas.length} entidad{filtradas.length !== 1 ? 'es' : ''}
      </div>

      {/* === GRID RESPONSIVE === */}
      {filtradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtradas.map(e => <EntidadCard key={e.id} entidad={e} />)}
        </div>
      ) : (
        <EmptyState
          type="no-data"
          title="No hay entidades"
          description="Crea tu primera entidad para comenzar"
          icon={Icono}
          action={{
            label: "Crear entidad",
            icon: <Plus />,
            onClick: () => setModalAbierto(true)
          }}
        />
      )}

      {/* Modales */}
      {modalAbierto && (
        <EntidadFormModal onClose={() => setModalAbierto(false)} />
      )}
    </div>
  );
};

export default EntidadPage;
```

### 3.4 Formulario con React Hook Form

```jsx
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';

const EntidadFormModal = ({ entidad, onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: entidad || { campo1: '', campo2: '' }
  });

  const { mutate: crear, isPending } = useCrearEntidad();

  const onSubmit = (data) => {
    crear(data, {
      onSuccess: () => {
        toast.success('Creado exitosamente');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error');
      }
    });
  };

  return (
    <Modal onClose={onClose} titulo="Nueva Entidad">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Campo 1</label>
          <input {...register('campo1', { required: 'Requerido' })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2" />
          {errors.campo1 && <p className="text-red-500 text-xs">{errors.campo1.message}</p>}
        </div>
        <button type="submit" disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg">
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  );
};
```

---

## 4. Estado Actual del Modulo de Operaciones

### 4.1 Lo que YA esta construido

El modulo de Operaciones ya tiene una implementacion sustancial:

#### Backend (Completo)

| Archivo | Lineas | Funcion |
|---------|--------|---------|
| `ordenTrabajoController.js` | 926 | CRUD ordenes, cambio estado, asignar responsable |
| `OrdenTrabajoModel.js` | 795 | Queries SQL para ordenes de trabajo |
| `OrdenElementoModel.js` | 371 | Gestion de elementos dentro de ordenes |
| `AlertaModel.js` | 375 | Sistema de alertas operacionales |
| `ValidadorFechasService.js` | 423 | Validacion de fechas y conflictos |
| `SincronizacionAlquilerService.js` | 1,549 | Puente entre Operaciones y Alquileres |
| `operaciones.js` (rutas) | 233 | 25+ endpoints REST |

#### Frontend (Completo)

| Archivo | Funcion |
|---------|---------|
| `OperacionesDashboard.jsx` | Dashboard con tarjetas de evento (hoy + semana), alertas |
| `OrdenesTrabajoPage.jsx` | Listado con filtros (estado, tipo, fecha, busqueda) |
| `OrdenDetallePage.jsx` | Detalle de orden (responsable, preparacion, salida, retorno) |
| `CalendarioOperaciones.jsx` | Calendario con vistas dia/semana/mes |
| `AlertasPage.jsx` | Panel de alertas con filtros y resolucion |
| `apiOperaciones.js` | Cliente API completo (ordenes, elementos, alertas, validacion) |
| `useOrdenesTrabajo.js` | 20 hooks (queries + mutations) |

#### API Endpoints Existentes

```
# ORDENES DE TRABAJO
GET    /api/operaciones/ordenes                      # Listar con filtros
GET    /api/operaciones/ordenes/:id                  # Obtener por ID
GET    /api/operaciones/ordenes/:id/completa         # Con cotizacion
PUT    /api/operaciones/ordenes/:id                  # Actualizar (notas, prioridad)
PUT    /api/operaciones/ordenes/:id/estado           # Cambiar estado
PUT    /api/operaciones/ordenes/:id/fecha            # Cambiar fecha (con validacion)
PUT    /api/operaciones/ordenes/:id/equipo           # Asignar responsable (1 empleado)
POST   /api/operaciones/ordenes                      # Crear orden manual

# ELEMENTOS DE ORDEN
GET    /api/operaciones/ordenes/:id/elementos        # Elementos de una orden
GET    /api/operaciones/ordenes/:id/elementos-disponibles  # Disponibles para asignar
PUT    /api/operaciones/ordenes/:id/elementos/:e/estado    # Cambiar estado elemento
POST   /api/operaciones/ordenes/:id/elementos/:e/incidencia # Reportar incidencia
POST   /api/operaciones/ordenes/:id/elementos/:e/foto      # Subir foto

# PREPARACION Y EJECUCION
POST   /api/operaciones/ordenes/:id/preparar-elementos     # Asignar series/lotes
POST   /api/operaciones/ordenes/:id/ejecutar-salida        # Despachar (activa alquiler)
POST   /api/operaciones/ordenes/:id/ejecutar-retorno       # Recibir (finaliza alquiler)

# CALENDARIO Y ESTADISTICAS
GET    /api/operaciones/calendario                   # Vista calendario
GET    /api/operaciones/estadisticas                 # KPIs operacionales

# ALERTAS
GET    /api/operaciones/alertas                      # Listar alertas
GET    /api/operaciones/alertas/pendientes           # Solo pendientes
GET    /api/operaciones/alertas/resumen              # Conteos por severidad
PUT    /api/operaciones/alertas/:id/resolver         # Resolver alerta

# SINCRONIZACION
GET    /api/operaciones/alquiler/:id/ordenes         # Ordenes de un alquiler
GET    /api/operaciones/alquiler/:id/sincronizacion  # Estado de sincronizacion
GET    /api/operaciones/alquiler/:id/verificar-consistencia  # Verificar integridad

# VALIDACION
POST   /api/operaciones/validar-fecha                # Validar cambio de fecha
```

### 4.2 Maquina de Estados de Ordenes

```
pendiente → confirmado → en_preparacion → en_ruta → en_sitio → en_proceso → completado
     ↓          ↓              ↓             ↓          ↓           ↓
  cancelado  cancelado     cancelado     cancelado  cancelado   cancelado
```

**Estados de elementos dentro de una orden:**
```
pendiente → preparado → cargado → instalado → desmontado → retornado
                                                    ↓
                                                incidencia
```

### 4.3 Tipos de Ordenes

| Tipo | Origen | Descripcion |
|------|--------|-------------|
| `montaje` | Automatico (al aprobar cotizacion) | Instalar en sitio del evento |
| `desmontaje` | Automatico (al aprobar cotizacion) | Retirar del sitio |
| `mantenimiento` | Manual | Reparar equipos danados |
| `traslado` | Manual | Mover entre ubicaciones |
| `revision` | Manual | Inspeccion de equipos |
| `inventario` | Manual | Conteo fisico |
| `otro` | Manual | Cualquier otra operacion |

### 4.4 Flujo Critico: Montaje (Salida)

```
1. Cotizacion aprobada → Se crea alquiler + ordenes (montaje + desmontaje)
2. Orden montaje: pendiente
3. Asignar responsable (1 empleado encargado)
4. Estado: en_preparacion
5. Preparar elementos (asignar series/lotes fisicos)
6. Ejecutar salida:
   - Series: estado → 'alquilado'
   - Lotes: reduce cantidad_disponible
   - Copia a alquiler_elementos
   - Orden → 'en_ruta'
   - Alquiler → 'activo'
```

### 4.5 Flujo Critico: Desmontaje (Retorno)

```
1. Orden desmontaje se activa cuando montaje esta completado
2. Registrar retorno de cada elemento:
   - bueno → restaura a inventario (estado 'bueno')
   - danado → estado 'mantenimiento' + costo_dano
   - perdido → estado 'danado' (baja)
3. Orden → 'completado'
4. Alquiler → 'finalizado'
5. Calcula costo total de danos
```

---

## 5. Relacion entre Modulos

```
┌──────────────────────────────────────────────┐
│           MODULO ALQUILERES                   │
│  (Comercial)                                  │
│                                               │
│  Clientes → Eventos → Cotizaciones            │
│                           │                   │
│                     [Aprobar]                  │
│                           │                   │
│                    Crea Alquiler               │
│                    + Ordenes                   │
│                           │                   │
│  Vista solo lectura ←─────┘                   │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│          MODULO OPERACIONES                   │
│  (Operativo)                                  │
│                                               │
│  Ordenes de Trabajo                           │
│    ├── Asignar responsable                    │
│    ├── Preparar elementos (series/lotes)      │
│    ├── Ejecutar salida → Alquiler ACTIVO      │
│    └── Ejecutar retorno → Alquiler FINALIZADO │
│                                               │
│  Calendario | Alertas | Estadisticas          │
└──────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│          MODULO INVENTARIO                    │
│  (Stock fisico)                               │
│                                               │
│  Categorias → Subcategorias → Elementos       │
│    ├── Series (items individuales con serial)  │
│    └── Lotes (cantidades por ubicacion)        │
│                                               │
│  Ubicaciones (bodegas, talleres)              │
└──────────────────────────────────────────────┘
```

---

## 6. Dependencias del Proyecto

### Backend
```
express         5.1.0    # Framework web
mysql2          3.15.2   # MySQL con promises
cors            2.8.5    # Cross-Origin
dotenv          17.2.3   # Variables de entorno
bcryptjs        3.0.3    # Hash de passwords
jsonwebtoken    9.0.3    # JWT tokens
multer          2.0.2    # Upload de archivos
pdfkit          0.17.2   # Generacion de PDF
express-rate-limit 8.2.1 # Rate limiting
```

### Frontend
```
react           19.1.1   # UI framework
react-router-dom 7.9.4   # Routing
@tanstack/react-query 5.90.5  # Server state (caching, refetch)
zustand         5.0.8    # Global state (auth)
axios           1.13.1   # HTTP client con interceptors
react-hook-form 7.65.0   # Formularios
recharts        3.7.0    # Graficos
lucide-react    0.548.0  # Iconos
sonner          2.0.7    # Toast notifications
@fullcalendar/* 6.1.20   # Calendario
tailwindcss     4.1.16   # CSS utility-first
vite            7.1.7    # Build tool
```

---

## 7. Convenciones y Buenas Practicas

### Nombrado

| Elemento | Convencion | Ejemplo |
|----------|-----------|---------|
| Modelo | PascalCase + Model | `OrdenTrabajoModel` |
| Controlador | camelCase + Controller | `ordenTrabajoController` |
| Ruta | kebab-case | `/api/ordenes-trabajo` |
| API frontend | camelCase con prefijo api | `apiOperaciones` |
| Hook | camelCase con prefijo use | `useGetOrdenes` |
| Pagina | PascalCase + Page | `OrdenesTrabajoPage` |
| Componente | PascalCase | `AlquilerCard` |

### Queries SQL
- Siempre usar placeholders `?` (nunca concatenar)
- JOINs para relaciones, no queries separadas
- `COALESCE` para evitar NULL en agregaciones
- `DATE_FORMAT` para formateo de fechas en MySQL

### React Query
- `queryKey` incluye todos los parametros que afectan la query
- `enabled: !!param` para queries condicionales
- `invalidateQueries` en `onSuccess` de mutations
- `retry: 0` en mutations (no reintentar escrituras)

### Tailwind CSS
- Colores principales: `blue-600` (primario), `slate-*` (neutros)
- Cards: `bg-white rounded-xl border border-slate-200 p-5`
- Botones: `px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700`
- Grid responsive: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Spacing: `space-y-6` entre secciones, `gap-6` en grids

---

## 7.1 Parametros de UI/UX Consistentes entre Modulos

Esta seccion documenta los patrones visuales exactos que se deben seguir en **todas** las paginas de los modulos con sidebar (Alquileres, Operaciones, etc.) para mantener consistencia visual.

### Layout de Paginas dentro de Sidebar

Las paginas dentro de un layout con sidebar (`AlquileresLayout`, futuro `OperacionesLayout`) **NO deben**:
- Usar `min-h-screen` ni `bg-slate-50` (el layout ya lo provee)
- Tener headers sticky (`sticky top-0`) propios
- Tener botones "Volver a Modulos" individuales (el sidebar lo provee)
- Usar contenedores `container mx-auto` (el `<main>` del layout ya maneja el ancho)

**SI deben:**
- Usar `div.p-6` como contenedor raiz
- Seguir el patron de header consistente (ver abajo)
- Usar estados de carga/error inline

### Header Consistente

Todas las paginas deben usar este patron exacto para el header:

```jsx
{/* HEADER - Patron obligatorio */}
<div className="mb-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
        <div className="p-2 bg-[COLOR]-100 rounded-lg">
          <Icono className="w-6 h-6 text-[COLOR]-600" />
        </div>
        Titulo de la Pagina
      </h1>
      <p className="text-slate-500 mt-1">
        Descripcion breve
      </p>
    </div>

    {/* Botones de accion (opcional) */}
    <div className="flex items-center gap-3">
      <Button variant="primary" icon={<Plus />} onClick={handler}>
        Accion Principal
      </Button>
    </div>
  </div>
</div>
```

**Parametros del icono del header:**
- Contenedor: `p-2 bg-[COLOR]-100 rounded-lg`
- Icono: `w-6 h-6 text-[COLOR]-600`
- Gap entre icono y titulo: `gap-3`

**Colores asignados por pagina (modulo Alquileres):**

| Pagina | Color | Icono |
|--------|-------|-------|
| Cotizaciones | `purple` | `Calendar` |
| Gestion de Alquileres | `indigo` | `Package` |
| Clientes | `blue` | `Users` |
| Calendario | `blue` | `Calendar` |
| Transporte | `orange` | `Truck` |
| Descuentos | `blue` | `Tag` |
| Reportes | `blue` | `BarChart3` |
| Configuracion | `slate` | `Settings` |

**Para el modulo de Operaciones, seguir el mismo patron con colores coherentes:**

| Pagina | Color sugerido | Icono |
|--------|---------------|-------|
| Dashboard Operaciones | `amber` | `Wrench` o `Cog` |
| Ordenes de Trabajo | `blue` | `ClipboardList` |
| Detalle de Orden | `blue` | `ClipboardCheck` |
| Calendario Operaciones | `blue` | `Calendar` |
| Alertas | `red` | `AlertTriangle` |

### Estados de Carga

**NUNCA usar `fullScreen` en paginas dentro de sidebar.** El spinner fullscreen rompe el layout del sidebar.

```jsx
// CORRECTO: Spinner inline
if (isLoading) {
  return (
    <div className="flex justify-center py-12">
      <Spinner size="lg" text="Cargando datos..." />
    </div>
  );
}

// INCORRECTO: Spinner fullscreen dentro de sidebar
if (isLoading) {
  return <Spinner fullScreen size="xl" text="Cargando..." />;
}
```

### Estados de Error

```jsx
// CORRECTO: Banner inline
if (error) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error al cargar datos: {error.message || 'Ocurrio un error inesperado'}
        <Button variant="ghost" onClick={() => refetch()} className="ml-4">
          Reintentar
        </Button>
      </div>
    </div>
  );
}

// INCORRECTO: Pagina completa centrada
if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      ...
    </div>
  );
}
```

### Sidebar con "Volver a Modulos"

El sidebar de cada modulo debe incluir un boton "Volver a Modulos" en la parte superior:

```jsx
{/* Parte superior del sidebar, antes del titulo del modulo */}
<button
  onClick={() => navigate('/')}
  className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm mb-4 px-2 py-1.5 rounded-lg hover:bg-slate-100 w-full"
>
  <ArrowLeft className="w-4 h-4" />
  <span>Volver a Módulos</span>
</button>
```

Esto elimina la necesidad de botones "Volver" individuales en cada pagina.

### Buscador Consistente

```jsx
<div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
  <div className="flex items-center gap-3">
    <Search className="w-5 h-5 text-slate-400" />
    <input
      type="text"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar..."
      className="flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none"
    />
    {busqueda && (
      <button
        onClick={() => setBusqueda('')}
        className="text-sm text-blue-600 hover:underline"
      >
        Limpiar
      </button>
    )}
  </div>
</div>
```

### Contador de Resultados

Siempre mostrar un contador antes del grid/tabla:

```jsx
<div className="mb-4 text-sm text-slate-500">
  Mostrando {filtradas.length} orden{filtradas.length !== 1 ? 'es' : ''}
</div>
```

### Grid Responsive

```jsx
{/* 1 columna mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### Tarjetas de Estadisticas (Stats)

```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-[COLOR]-100 rounded-lg">
        <Icono className="w-5 h-5 text-[COLOR]-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{valor}</p>
        <p className="text-sm text-slate-500">Etiqueta</p>
      </div>
    </div>
  </div>
</div>
```

### Resumen de Clases CSS Estandar

| Elemento | Clases |
|----------|--------|
| Contenedor pagina | `p-6` |
| Contenedor con spacing | `p-6 space-y-6` |
| Header wrapper | `mb-6` |
| Header flex | `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4` |
| Titulo h1 | `text-2xl font-bold text-slate-900 flex items-center gap-3` |
| Icono header bg | `p-2 bg-[COLOR]-100 rounded-lg` |
| Icono header | `w-6 h-6 text-[COLOR]-600` |
| Subtitulo | `text-slate-500 mt-1` |
| Card/Panel | `bg-white rounded-xl border border-slate-200 p-4` |
| Buscador input | `flex-1 border-0 focus:ring-0 text-sm placeholder:text-slate-400 outline-none` |
| Contador | `mb-4 text-sm text-slate-500` |
| Grid 3 cols | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Error banner | `bg-red-50 border border-red-200 rounded-lg p-4 text-red-700` |
| Info banner | `bg-blue-50 border border-blue-200 rounded-lg p-4` |
| Spinner loading | `flex justify-center py-12` + `Spinner size="lg"` |

---

### Autenticacion
- JWT en header: `Authorization: Bearer <token>`
- Roles: `admin`, `gerente`, `operaciones`, `ventas`
- Middleware: `authRol(['admin', 'operaciones'])` en rutas protegidas
- Frontend: `useAuthStore().hasRole('admin')` para condicionales UI

---

## 8. Checklist para Agregar una Funcionalidad Nueva

### Backend
- [ ] Crear/modificar modelo en `models/`
- [ ] Crear/modificar controlador en `controllers/`
- [ ] Crear/modificar rutas en `routes/`
- [ ] Registrar ruta en `server.js` (si es nuevo router)
- [ ] Crear migracion SQL si hay cambios en BD
- [ ] Si es logica compleja multi-modelo, crear un Service

### Frontend
- [ ] Crear archivo API en `api/`
- [ ] Crear hooks en `hooks/`
- [ ] Crear pagina en `pages/`
- [ ] Crear componentes necesarios en `components/`
- [ ] Agregar ruta en `App.jsx`
- [ ] Agregar link en sidebar/navegacion correspondiente

---

## 9. Base de Datos - Tablas del Modulo de Operaciones

Las tablas ya existentes para operaciones:

```sql
-- Ordenes de trabajo (se crean automaticamente al aprobar cotizacion)
ordenes_trabajo (
  id, alquiler_id, tipo, estado, prioridad,
  fecha_programada, fecha_inicio, fecha_fin,
  vehiculo_id, notas, created_at, updated_at
)

-- Responsable asignado a cada orden (usa tabla equipo con 1 registro)
orden_trabajo_equipo (
  id, orden_id, empleado_id, rol_en_orden
  -- NOTA: Simplificado a 1 responsable por orden (rol_en_orden = 'responsable')
)

-- Elementos fisicos asignados a cada orden
orden_elementos (
  id, orden_id, elemento_id, serie_id, lote_id,
  cantidad, estado, notas, created_at
)

-- Alertas operacionales
alertas_operaciones (
  id, tipo, severidad, titulo, descripcion,
  orden_id, alquiler_id, estado, resuelto_por,
  resuelto_en, notas_resolucion, created_at
)

-- Relacion con modulo alquileres:
alquiler_elementos (
  id, alquiler_id, elemento_id, serie_id, lote_id,
  lote_alquilado_id, cantidad_lote,
  estado_salida, estado_retorno,
  costo_dano, notas_retorno,
  ubicacion_original_id,
  fecha_asignacion, fecha_retorno
)
```

---

## 10. Posibles Areas de Mejora/Extension

Estas son areas que podrian necesitar trabajo adicional:

### Testing End-to-End
- Probar flujo completo: cotizacion → aprobar → preparar → salida → retorno
- Verificar que el inventario se actualiza correctamente
- Probar cancelaciones en diferentes estados

### Reportes de Operaciones
- Tiempo promedio por tipo de orden
- Rendimiento por equipo/empleado
- Historial de incidencias
- Costos de danos acumulados

### Mejoras de UI
- Drag & drop para reasignar elementos entre ordenes
- Vista Gantt para planificacion de operaciones
- Notificaciones push para alertas criticas

### Historial de Cambios
- Tarea #11 pendiente del modulo de Alquileres
- Tabla de auditoria para registrar quien cambio que y cuando
- Aplicable tanto a Alquileres como a Operaciones

---

## 11. Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=aprendizaje_inventario

# Servidor
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=tu_secret_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend (.env en inventario-frontend/)
VITE_API_URL=http://localhost:3000/api
```

---

## 12. Comandos Utiles

```bash
# Backend
cd backend
npm start                    # Iniciar servidor
npm run dev                  # Modo desarrollo
npm run migrate              # Ejecutar migraciones

# Frontend
cd inventario-frontend
npm run dev                  # Servidor de desarrollo (port 5173)
npm run build                # Build de produccion

# Git
git status                   # Ver cambios
git add [archivos]           # Agregar archivos
git commit -m "mensaje"      # Commit
git push -u origin [branch]  # Push

# Base de datos
mysql -u root -p aprendizaje_inventario < migrations/archivo.sql
```
