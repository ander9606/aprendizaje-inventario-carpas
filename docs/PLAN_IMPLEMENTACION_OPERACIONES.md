# Plan de Implementación: Módulo de Operaciones y Autenticación JWT

## Resumen Ejecutivo

Este documento detalla los pasos para implementar:
1. **Autenticación JWT** con roles y permisos
2. **Módulo de Operaciones** para gestión de montajes/desmontajes
3. **Sistema de Alertas** para conflictos y aprobaciones

---

## Estado Actual

### ✅ Completado - Migraciones de Base de Datos

| Migración | Tablas Creadas | Estado |
|-----------|----------------|--------|
| 21_empleados.sql | `roles`, `empleados`, `refresh_tokens`, `audit_log` | ✅ |
| 22_vehiculos.sql | `vehiculos`, `vehiculo_uso_log`, `vehiculo_mantenimientos` | ✅ |
| 23_ordenes_trabajo.sql | `ordenes_trabajo`, `orden_trabajo_equipo`, `orden_trabajo_cambios_fecha` | ✅ |
| 24_orden_trabajo_elementos.sql | `orden_trabajo_elementos`, `elemento_incidencias`, `orden_elemento_fotos` | ✅ |
| 25_alertas_operaciones.sql | `alertas_operaciones`, `notificaciones_pendientes`, `empleado_notificaciones_config` | ✅ |

### Roles Configurados

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| admin | Acceso total | Todo |
| gerente | Aprobaciones | Aprobar cambios, ver reportes |
| ventas | Comercial | Cotizaciones, alquileres |
| operaciones | Campo | Órdenes de trabajo |
| bodega | Inventario | Gestión de stock |

---

## Fase 1: Backend - Autenticación JWT

### 1.1 Instalar Dependencias

```bash
cd backend
npm install jsonwebtoken bcryptjs
```

### 1.2 Crear Estructura de Archivos

```
backend/modules/auth/
├── controllers/
│   └── authController.js
├── models/
│   └── AuthModel.js
├── routes/
│   └── auth.js
├── middleware/
│   └── authMiddleware.js
└── services/
    └── TokenService.js
```

### 1.3 Implementar AuthModel.js

**Funciones requeridas:**
- `buscarPorEmail(email)` - Buscar empleado por email
- `actualizarUltimoLogin(empleadoId)` - Registrar último acceso
- `incrementarIntentosFallidos(empleadoId)` - Control de intentos
- `bloquearCuenta(empleadoId, hasta)` - Bloqueo temporal
- `desbloquearCuenta(empleadoId)` - Resetear bloqueo

### 1.4 Implementar TokenService.js

**Funciones requeridas:**
- `generarAccessToken(empleado)` - JWT corto (15-30 min)
- `generarRefreshToken(empleado)` - Token largo (7 días)
- `verificarAccessToken(token)` - Validar JWT
- `verificarRefreshToken(token)` - Validar refresh
- `revocarRefreshToken(token)` - Invalidar token
- `limpiarTokensExpirados()` - Mantenimiento

### 1.5 Implementar authController.js

**Endpoints:**
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/logout | Cerrar sesión |
| POST | /api/auth/refresh | Renovar access token |
| GET | /api/auth/me | Obtener perfil actual |
| PUT | /api/auth/password | Cambiar contraseña |

### 1.6 Implementar authMiddleware.js

**Middlewares:**
- `verificarToken` - Validar JWT en headers
- `verificarRol(roles[])` - Verificar rol permitido
- `verificarPermiso(modulo, accion)` - Verificar permiso específico

### 1.7 Variables de Entorno

Agregar a `.env`:
```env
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

## Fase 2: Backend - Módulo Empleados (CRUD)

### 2.1 Crear Estructura

```
backend/modules/configuracion/
├── controllers/
│   └── empleadoController.js   (NUEVO)
├── models/
│   └── EmpleadoModel.js        (NUEVO)
└── routes/
    └── empleados.js            (NUEVO)
```

### 2.2 Implementar EmpleadoModel.js

**Funciones requeridas:**
- `obtenerTodos()` - Listar empleados
- `obtenerPorId(id)` - Detalle de empleado
- `crear(datos)` - Crear empleado (con hash de password)
- `actualizar(id, datos)` - Actualizar empleado
- `eliminar(id)` - Desactivar empleado
- `obtenerPorRol(rolId)` - Filtrar por rol
- `obtenerDisponiblesCampo()` - Para asignar a órdenes

### 2.3 Endpoints Empleados

| Método | Ruta | Rol Mínimo |
|--------|------|------------|
| GET | /api/empleados | gerente |
| GET | /api/empleados/:id | gerente |
| POST | /api/empleados | admin |
| PUT | /api/empleados/:id | admin |
| DELETE | /api/empleados/:id | admin |
| GET | /api/empleados/disponibles/campo | operaciones |

---

## Fase 3: Backend - Módulo Vehículos

### 3.1 Crear Estructura

```
backend/modules/configuracion/
├── controllers/
│   └── vehiculoController.js   (NUEVO)
├── models/
│   └── VehiculoModel.js        (NUEVO)
└── routes/
    └── vehiculos.js            (NUEVO)
```

### 3.2 Implementar VehiculoModel.js

**Funciones requeridas:**
- `obtenerTodos()` - Listar vehículos
- `obtenerPorId(id)` - Detalle con historial
- `crear(datos)` - Crear vehículo
- `actualizar(id, datos)` - Actualizar vehículo
- `eliminar(id)` - Desactivar vehículo
- `obtenerDisponibles(fecha)` - Disponibles en fecha
- `registrarUso(vehiculoId, datos)` - Log de uso
- `registrarMantenimiento(vehiculoId, datos)` - Programar/registrar

### 3.3 Endpoints Vehículos

| Método | Ruta | Rol Mínimo |
|--------|------|------------|
| GET | /api/vehiculos | operaciones |
| GET | /api/vehiculos/:id | operaciones |
| POST | /api/vehiculos | admin |
| PUT | /api/vehiculos/:id | gerente |
| DELETE | /api/vehiculos/:id | admin |
| GET | /api/vehiculos/disponibles | operaciones |
| POST | /api/vehiculos/:id/uso | operaciones |
| POST | /api/vehiculos/:id/mantenimiento | gerente |

---

## Fase 4: Backend - Módulo Operaciones

### 4.1 Crear Estructura

```
backend/modules/operaciones/
├── controllers/
│   ├── ordenTrabajoController.js
│   ├── ordenElementoController.js
│   └── alertaController.js
├── models/
│   ├── OrdenTrabajoModel.js
│   ├── OrdenElementoModel.js
│   └── AlertaModel.js
├── routes/
│   └── operaciones.js
└── services/
    ├── ValidadorFechasService.js
    └── NotificacionService.js
```

### 4.2 Implementar OrdenTrabajoModel.js

**Funciones requeridas:**
- `obtenerTodas(filtros)` - Listar con filtros
- `obtenerPorId(id)` - Detalle completo
- `obtenerPorAlquiler(alquilerId)` - Órdenes de un alquiler
- `crear(datos)` - Crear orden
- `actualizar(id, datos)` - Actualizar orden
- `cambiarFecha(id, nuevaFecha, motivo)` - Con validación
- `cambiarEstado(id, estado)` - Actualizar estado
- `asignarEquipo(id, empleadoIds)` - Asignar personal
- `asignarVehiculo(id, vehiculoId)` - Asignar vehículo
- `obtenerCalendario(desde, hasta)` - Vista calendario

### 4.3 Implementar ValidadorFechasService.js

**Funciones requeridas:**
- `validarCambioFecha(ordenId, nuevaFecha)` - Verificar conflictos
- `detectarConflictos(elementosIds, fechaInicio, fechaFin)` - Buscar solapamientos
- `verificarDisponibilidadElementos(elementosIds, fecha)` - Check disponibilidad
- `verificarDisponibilidadEquipo(empleadoIds, fecha)` - Check personal
- `verificarDisponibilidadVehiculo(vehiculoId, fecha)` - Check vehículo
- `calcularSeveridad(conflictos)` - Determinar nivel de conflicto

**Niveles de severidad:**
| Severidad | Acción |
|-----------|--------|
| info | Permitir sin alerta |
| advertencia | Permitir con alerta |
| critico | Bloquear, requiere aprobación gerencia |

### 4.4 Endpoints Operaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/operaciones/ordenes | Listar órdenes |
| GET | /api/operaciones/ordenes/:id | Detalle orden |
| GET | /api/operaciones/alquiler/:id/ordenes | Órdenes de alquiler |
| PUT | /api/operaciones/ordenes/:id | Actualizar orden |
| PUT | /api/operaciones/ordenes/:id/fecha | Cambiar fecha |
| PUT | /api/operaciones/ordenes/:id/estado | Cambiar estado |
| PUT | /api/operaciones/ordenes/:id/equipo | Asignar equipo |
| PUT | /api/operaciones/ordenes/:id/vehiculo | Asignar vehículo |
| GET | /api/operaciones/calendario | Vista calendario |

### 4.5 Endpoints Elementos en Orden

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/operaciones/ordenes/:id/elementos | Elementos de orden |
| PUT | /api/operaciones/ordenes/:id/elementos/:elemId/estado | Cambiar estado |
| POST | /api/operaciones/ordenes/:id/elementos/:elemId/incidencia | Reportar incidencia |
| POST | /api/operaciones/ordenes/:id/elementos/:elemId/foto | Subir foto |

### 4.6 Endpoints Alertas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/operaciones/alertas | Listar alertas |
| GET | /api/operaciones/alertas/pendientes | Solo pendientes |
| PUT | /api/operaciones/alertas/:id/resolver | Resolver alerta |

---

## Fase 5: Integración - Auto-crear Órdenes

### 5.1 Modificar CotizacionController.aprobar()

Al aprobar una cotización y crear el alquiler:

```javascript
// Después de crear el alquiler
await OrdenTrabajoModel.crearDesdeAlquiler(alquiler.id, {
    montaje: {
        fecha: alquiler.fecha_montaje,
        direccion: alquiler.ubicacion_evento
    },
    desmontaje: {
        fecha: alquiler.fecha_desmontaje,
        direccion: alquiler.ubicacion_evento
    }
});
```

### 5.2 Implementar crearDesdeAlquiler()

1. Crear orden de montaje
2. Crear orden de desmontaje
3. Copiar elementos del alquiler a ambas órdenes
4. Retornar IDs de órdenes creadas

---

## Fase 6: Frontend - APIs y Hooks

### 6.1 Crear Archivos API

```
inventario-frontend/src/api/
├── apiAuth.js           (NUEVO)
├── apiEmpleados.js      (NUEVO)
├── apiVehiculos.js      (NUEVO)
└── apiOperaciones.js    (NUEVO)
```

### 6.2 Crear Hooks

```
inventario-frontend/src/hooks/
├── auth/
│   ├── useAuth.js           - Login/logout/estado
│   └── usePermisos.js       - Verificar permisos
├── empleados/
│   └── useEmpleados.js      - CRUD empleados
├── vehiculos/
│   └── useVehiculos.js      - CRUD vehículos
└── operaciones/
    ├── useOrdenesTrabajo.js - Gestión órdenes
    └── useAlertas.js        - Sistema alertas
```

### 6.3 Contexto de Autenticación

```
inventario-frontend/src/context/
└── AuthContext.jsx      - Estado global de auth
```

---

## Fase 7: Frontend - Páginas de Configuración

### 7.1 Páginas a Crear

```
inventario-frontend/src/pages/
├── LoginPage.jsx            - Inicio de sesión
├── EmpleadosPage.jsx        - CRUD empleados
└── VehiculosPage.jsx        - CRUD vehículos
```

### 7.2 Componentes de Soporte

```
inventario-frontend/src/components/
├── auth/
│   ├── LoginForm.jsx
│   ├── ProtectedRoute.jsx   - HOC para rutas protegidas
│   └── PermisoGate.jsx      - Mostrar/ocultar por permiso
├── empleados/
│   ├── TablaEmpleados.jsx
│   ├── FormularioEmpleado.jsx
│   └── SelectorEmpleados.jsx
└── vehiculos/
    ├── TablaVehiculos.jsx
    ├── FormularioVehiculo.jsx
    └── SelectorVehiculos.jsx
```

---

## Fase 8: Frontend - Módulo Operaciones

### 8.1 Páginas a Crear

```
inventario-frontend/src/pages/
├── OperacionesDashboard.jsx     - Vista general
├── OrdenesTrabajoPage.jsx       - Lista de órdenes
├── OrdenDetallePage.jsx         - Detalle con checklist
└── CalendarioOperativoPage.jsx  - Calendario enriquecido
```

### 8.2 Componentes de Operaciones

```
inventario-frontend/src/components/operaciones/
├── TablaOrdenes.jsx
├── TarjetaOrden.jsx
├── TimelineOrden.jsx            - Estados de la orden
├── ChecklistElementos.jsx       - Verificación de elementos
├── FormularioIncidencia.jsx
├── ModalCambioFecha.jsx
├── ModalConflicto.jsx
├── BannerAlertas.jsx
└── TarjetaEventoEnriquecida.jsx - Para calendario
```

---

## Fase 9: Protección de Rutas

### 9.1 Actualizar App.jsx

```jsx
<Routes>
  {/* Públicas */}
  <Route path="/login" element={<LoginPage />} />

  {/* Protegidas */}
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Dashboard />} />

    {/* Solo admin/gerente */}
    <Route element={<ProtectedRoute roles={['admin', 'gerente']} />}>
      <Route path="/empleados" element={<EmpleadosPage />} />
      <Route path="/vehiculos" element={<VehiculosPage />} />
    </Route>

    {/* Operaciones */}
    <Route element={<ProtectedRoute roles={['admin', 'gerente', 'operaciones']} />}>
      <Route path="/operaciones" element={<OperacionesDashboard />} />
      <Route path="/operaciones/ordenes" element={<OrdenesTrabajoPage />} />
      <Route path="/operaciones/ordenes/:id" element={<OrdenDetallePage />} />
    </Route>
  </Route>
</Routes>
```

### 9.2 Actualizar Navegación

Mostrar/ocultar menús según rol del usuario.

---

## Orden de Implementación Recomendado

```
Semana 1: Auth + Empleados
├── Fase 1: Backend Auth (JWT)
├── Fase 2: Backend Empleados
└── Frontend: Login + Contexto

Semana 2: Vehículos + Base Operaciones
├── Fase 3: Backend Vehículos
├── Fase 4.1-4.3: Modelos Operaciones
└── Frontend: Empleados + Vehículos

Semana 3: Operaciones Completo
├── Fase 4.4-4.6: Endpoints Operaciones
├── Fase 5: Integración auto-crear
└── Fase 6: Frontend APIs/Hooks

Semana 4: Frontend Operaciones
├── Fase 7: Páginas configuración
├── Fase 8: Módulo operaciones UI
└── Fase 9: Protección rutas
```

---

## Checklist de Verificación

### Backend
- [ ] Login/logout funcionando
- [ ] Tokens JWT generándose correctamente
- [ ] Middleware protegiendo rutas
- [ ] CRUD empleados completo
- [ ] CRUD vehículos completo
- [ ] Órdenes de trabajo CRUD
- [ ] Auto-creación de órdenes al aprobar
- [ ] Validador de fechas detectando conflictos
- [ ] Sistema de alertas funcionando

### Frontend
- [ ] Login page funcional
- [ ] Contexto de auth guardando estado
- [ ] Rutas protegidas por rol
- [ ] Página empleados CRUD
- [ ] Página vehículos CRUD
- [ ] Dashboard operaciones
- [ ] Lista de órdenes con filtros
- [ ] Detalle de orden con checklist
- [ ] Calendario enriquecido
- [ ] Sistema de alertas visible

### Integración
- [ ] Al aprobar cotización se crean órdenes
- [ ] Cambio de fecha valida conflictos
- [ ] Conflictos críticos generan alertas
- [ ] Gerencia puede aprobar/rechazar
- [ ] Estados de elementos se actualizan

---

## Notas Importantes

1. **Seguridad**: El JWT_SECRET debe ser único y seguro en producción
2. **Passwords**: Siempre usar bcrypt con salt rounds >= 10
3. **Tokens**: Limpiar refresh_tokens expirados periódicamente
4. **Auditoría**: Registrar acciones importantes en audit_log
5. **Permisos**: Validar en backend, nunca confiar solo en frontend

---

## Próximo Paso

**Iniciar con Fase 1: Backend - Autenticación JWT**

Esto es la base para todo lo demás, ya que las rutas protegidas dependen del middleware de auth.
