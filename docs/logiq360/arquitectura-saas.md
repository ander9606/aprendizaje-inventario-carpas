# Logiq360 - Arquitectura SaaS Multi-Tenant

## Vision General

Logiq360 es una plataforma SaaS de gestion de inventario y alquileres para cualquier negocio de alquiler de equipos. Cada empresa cliente accede a su instancia a traves de un subdominio unico.

## Decisiones de Arquitectura

| Decision | Valor |
|----------|-------|
| Nombre | Logiq360 |
| Patron URL | Subdominios (`empresa.logiq360.com`) |
| Base de datos | Shared DB + Shared Schema + `tenant_id` en todas las tablas |
| Auth | JWT con `tenant_id` claim, 3 niveles de acceso |
| Panel admin plataforma | Separado en `admin.logiq360.com` |
| Onboarding | Self-service con aprobacion del platform admin |
| Facturacion | Manual al inicio, integracion de pagos diferida |
| Mercado | Global/bilingue, alquileres en general |

## Arquitectura de URLs

```
logiq360.com                    -> Landing page / marketing
admin.logiq360.com              -> Panel de administracion de la plataforma
{empresa}.logiq360.com          -> App del tenant
api.logiq360.com                -> API (opcional)
```

### Subdominios reservados

`www`, `app`, `api`, `admin`, `docs`, `status`, `mail`, `cdn`, `blog`, `help`, `support`, `billing`, `login`, `signup`, `demo`

## Organizacion de 3 Niveles

```
NIVEL 1: Plataforma (admin.logiq360.com)
  - Dueno del SaaS y equipo de soporte
  - Tabla: platform_users
  - Roles: superadmin, soporte, ventas
  - Gestiona: tenants, aprobaciones, metricas

NIVEL 2: Admin del Tenant (empresa.logiq360.com)
  - El admin de cada empresa cliente
  - Tabla: empleados (con tenant_id + rol=admin)
  - Gestiona: empleados, roles, configuracion

NIVEL 3: Usuario del Tenant (empresa.logiq360.com)
  - Empleados regulares de cada empresa
  - Tabla: empleados (con tenant_id)
  - Roles: gerente, ventas, operaciones, bodega
  - Usa: inventario, cotizaciones, alquileres, etc.
```

## Esquema de Base de Datos (Nuevas Tablas)

### `tenants`
```sql
CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    slug VARCHAR(63) NOT NULL UNIQUE,
    email_contacto VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    nit VARCHAR(50) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    plan ENUM('basico','profesional','empresarial') DEFAULT 'basico',
    estado ENUM('pendiente','activo','suspendido','cancelado') DEFAULT 'pendiente',
    max_empleados INT DEFAULT 5,
    max_elementos INT DEFAULT 500,
    max_almacenamiento_mb INT DEFAULT 1024,
    fecha_aprobacion TIMESTAMP NULL,
    aprobado_por INT DEFAULT NULL,
    motivo_rechazo TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenants_slug (slug),
    INDEX idx_tenants_estado (estado)
);
```

### `platform_users`
```sql
CREATE TABLE platform_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('superadmin','soporte','ventas') DEFAULT 'soporte',
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `platform_audit_log`
```sql
CREATE TABLE platform_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    platform_user_id INT DEFAULT NULL,
    tenant_id INT DEFAULT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_user_id) REFERENCES platform_users(id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);
```

### `tenant_invitaciones`
```sql
CREATE TABLE tenant_invitaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    rol_id INT DEFAULT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    estado ENUM('pendiente','aceptada','expirada') DEFAULT 'pendiente',
    invitado_por INT NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

## Migracion: tenant_id en tablas existentes

Todas las tablas existentes (~47) reciben una columna `tenant_id` con FK a `tenants.id`. Patron:

```sql
ALTER TABLE <tabla> ADD COLUMN tenant_id INT DEFAULT NULL AFTER id;
UPDATE <tabla> SET tenant_id = 1;
ALTER TABLE <tabla> MODIFY COLUMN tenant_id INT NOT NULL,
    ADD CONSTRAINT fk_<tabla>_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    ADD INDEX idx_<tabla>_tenant (tenant_id);
```

Constraints UNIQUE existentes cambian a compuestos `(tenant_id, columna_original)`.

## JWT Tokens

### Token de plataforma
```json
{ "id": 1, "email": "...", "rol": "superadmin", "tipo": "platform" }
```

### Token de tenant
```json
{ "id": 5, "email": "...", "tenant_id": 3, "tenant_slug": "acme", "rol_id": 1, "permisos": {...}, "tipo": "tenant" }
```

## Middleware de Resolucion de Tenant

```
Request: empresa.logiq360.com/api/elementos

1. Nginx extrae subdominio -> header X-Tenant-Slug: empresa
2. resolverTenant middleware:
   - Lee X-Tenant-Slug (o extrae de req.hostname)
   - Busca en tabla tenants (cache LRU 5 min)
   - Valida estado='activo'
   - Inyecta req.tenant = { id, slug, nombre, plan }
3. verificarToken: valida JWT + verifica token.tenant_id === req.tenant.id
4. Controller -> Model: pasa req.tenant.id a todos los queries
```

## Flujo de Registro de Empresa

1. Empresa visita `logiq360.com` -> clic "Registrarse"
2. Formulario: nombre empresa, slug (subdominio), NIT, datos admin
3. Sistema crea tenant (estado='pendiente') + empleado admin + roles por defecto
4. Platform admin ve solicitud en `admin.logiq360.com` -> aprueba
5. Tenant activado -> email al cliente -> login en `{slug}.logiq360.com`
6. Admin del tenant invita empleados desde su panel

## Endpoints Platform Admin

```
POST   /api/platform/auth/login
GET    /api/platform/auth/me
GET    /api/platform/dashboard
GET    /api/platform/tenants
GET    /api/platform/tenants/:id
POST   /api/platform/tenants/:id/aprobar
POST   /api/platform/tenants/:id/rechazar
POST   /api/platform/tenants/:id/suspender
POST   /api/platform/tenants/:id/reactivar
POST   /api/platform/tenants/:id/impersonar
```

## Estructura del Monorepo

```
logiq360/
  backend/              - API Express (multi-tenant)
  tenant-app/           - React SPA para tenants
  platform-admin/       - React SPA para admin de plataforma
  landing/              - Pagina de marketing
  sql/                  - Schema SQL
  nginx/                - Configuracion Nginx
  docs/                 - Documentacion
  scripts/              - Scripts de deploy
  docker-compose.yml    - Orquestacion Docker
```

## Fases de Implementacion

1. **Fase 0**: Inicializar repo + comprar dominio
2. **Fase 1**: Preparar monorepo (scaffolds landing + platform-admin)
3. **Fase 2**: BD multi-tenant (nuevas tablas + tenant_id)
4. **Fase 3**: Backend tenant-aware (middleware + modelos + JWT)
5. **Fase 4**: Backend plataforma (modulo platform/)
6. **Fase 5**: Frontend platform-admin
7. **Fase 6**: Frontend tenant-aware
8. **Fase 7**: Infraestructura (Nginx wildcard, SSL, Docker)

## DNS y SSL

```
logiq360.com          A     <ip-servidor>
*.logiq360.com        A     <ip-servidor>    (wildcard)
```

Usar Cloudflare (tier gratuito) para SSL wildcard automatico + DDoS protection.
