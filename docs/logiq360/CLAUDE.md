# CLAUDE.md

## Project Overview

**Logiq360** — SaaS multi-tenant platform for inventory and rental management. Built for any rental business (equipment, vehicles, tools, event gear). Each client company accesses their instance via a unique subdomain (`empresa.logiq360.com`).

- **Backend**: Node.js + Express 5.x + MySQL (raw SQL via mysql2/promise)
- **Frontend (Tenant App)**: React 19 + Vite + TailwindCSS + React Query + Zustand
- **Frontend (Platform Admin)**: React 19 + Vite + TailwindCSS (separate app)
- **Landing**: Marketing page at logiq360.com
- **Test Frameworks**: Jest (backend), Vitest (frontend)
- **Architecture**: Modular MVC (backend), Feature-module (frontend), Multi-tenant with shared DB

## Quick Reference

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon server.js (port 3000)
npm test             # jest --verbose
npm run test:watch   # jest --watch

# Tenant App (frontend for client companies)
cd tenant-app
npm install
npm run dev          # vite dev server (port 5173)
npm run build        # production build
npm test             # vitest (watch mode)
npm run test:run     # vitest run (single pass)

# Platform Admin (frontend for SaaS admin)
cd platform-admin
npm install
npm run dev          # vite dev server (port 5174)
npm run build        # production build

# Landing Page
cd landing
npm install
npm run dev          # vite dev server (port 5175)
npm run build        # production build
```

## Repository Structure

```
/
├── backend/                    # Express API server (multi-tenant)
│   ├── config/                 # database.js, constants.js
│   ├── middleware/             # errorHandler, validator, upload, httpLogger, resolverTenant
│   ├── modules/               # 8 feature modules (MVC each)
│   │   ├── auth/              # Login, JWT, roles, permissions
│   │   ├── inventario/        # Categories, elements, series, lotes, materials, units, locations
│   │   ├── alquileres/        # Quotations, rentals, transport, discounts, events
│   │   ├── productos/         # Composite products (bundles of elements)
│   │   ├── clientes/          # Clients, cities, departments
│   │   ├── operaciones/       # Work orders, employees, vehicles, alerts
│   │   ├── configuracion/     # System settings, rental alerts
│   │   └── platform/          # Platform admin: tenants, dashboard, platform auth
│   ├── utils/                 # AppError, logger, pagination, validators
│   ├── migrations/            # SQL migration scripts
│   ├── scripts/               # Admin setup, data migration scripts
│   ├── uploads/               # File storage (logos, images)
│   ├── server.js              # App entry point
│   └── jest.config.js
│
├── tenant-app/                # React SPA for tenant companies
│   ├── src/
│   │   ├── modules/           # 8 feature modules
│   │   ├── shared/            # Cross-module resources
│   │   ├── pages/             # Top-level pages
│   │   ├── App.jsx            # Router setup
│   │   └── main.jsx           # Entry point
│   ├── vite.config.js
│   └── vitest.config.js
│
├── platform-admin/            # React SPA for platform administration
│   └── src/
│       ├── modules/           # auth, dashboard, tenants
│       └── shared/            # API config, stores
│
├── landing/                   # Marketing landing page
│
├── sql/                       # Full schema
├── nginx/                     # Nginx configuration
├── docs/                      # Architecture documentation
│   └── arquitectura-saas.md   # SaaS architecture decisions
├── scripts/                   # Deploy scripts
└── docker-compose.yml         # Docker orchestration
```

## Multi-Tenant Architecture

See `docs/arquitectura-saas.md` for full details.

### URL Structure
```
logiq360.com                    → Landing/marketing
admin.logiq360.com              → Platform admin panel
{empresa}.logiq360.com          → Tenant app instance
```

### Three Auth Levels
1. **Platform Admin** — Manages all tenants (separate `platform_users` table)
2. **Tenant Admin** — Manages their company's employees and config
3. **Tenant User** — Regular employees within a company

### Tenant Resolution Flow
```
Request → Nginx extracts subdomain → X-Tenant-Slug header →
resolverTenant middleware → req.tenant injected →
verificarToken validates tenant_id match → Controller → Model (scoped by tenant_id)
```

## Environment Setup

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
DB_HOST=127.0.0.1
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=logiq360
JWT_SECRET=<64-char-hex-string>
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Tenant App `.env` (in `tenant-app/`):
```bash
VITE_API_URL=http://localhost:3000/api
```

## Backend Conventions

### Module Structure
Each backend module follows:
```
modules/<name>/
├── controllers/       # Request handlers
│   └── __tests__/     # Jest tests per controller
├── models/            # Static class with SQL queries
├── routes/            # Express routers
├── services/          # Business logic (optional)
└── index.js           # Mounts all subroutes
```

### Model Pattern (Static classes, raw SQL, parameterized queries)
```javascript
class CategoriaModel {
  static async obtenerTodas(tenantId) {
    const [rows] = await pool.query(
      'SELECT * FROM categorias WHERE tenant_id = ? ORDER BY nombre', [tenantId]
    );
    return rows;
  }
}
```

- Always use `?` placeholders — never interpolate values into SQL
- All queries MUST include `WHERE tenant_id = ?` for tenant isolation
- Models are stateless static classes

### Controller Pattern
```javascript
exports.obtenerTodas = async (req, res, next) => {
  try {
    const data = await Model.obtenerTodas(req.tenant.id);
    res.json({ success: true, data, total: data.length });
  } catch (error) {
    next(error);
  }
};
```

### Response Format
```json
{ "success": true, "data": {...}, "message": "Operacion exitosa" }
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
{ "success": false, "status": "fail", "message": "Descriptive error message" }
```

### Naming Conventions (Backend)

| Type | Convention | Example |
|------|-----------|---------|
| Model | PascalCase + `Model.js` | `CategoriaModel.js` |
| Controller | camelCase + `Controller.js` | `categoriaController.js` |
| Route | camelCase `.js` | `categorias.js` |
| Service | PascalCase + `Service.js` | `TokenService.js` |
| Test | `__tests__/<name>.test.js` | `categoriaController.test.js` |
| DB tables | snake_case plural | `cotizacion_productos` |
| DB columns | snake_case | `fecha_creacion`, `tenant_id` |

### Method Naming (Spanish)

| Prefix | Purpose | Example |
|--------|---------|---------|
| `obtener*` | Read/GET | `obtenerTodas()`, `obtenerPorId()` |
| `crear*` | Create/POST | `crear()`, `crearMultiple()` |
| `actualizar*` | Update/PUT | `actualizar()`, `actualizarEstado()` |
| `eliminar*` | Delete | `eliminar()` |
| `verificar*` | Auth/validate | `verificarToken()`, `verificarPermiso()` |

### Auth System
- JWT access tokens (15min) + refresh tokens (7d)
- Middleware: `resolverTenant` → `verificarToken` → `verificarRol` → `verificarPermiso`
- Platform admin uses separate JWT with `tipo: 'platform'`
- Tenant tokens include `tenant_id` and `tenant_slug`

### Test Pattern (Jest, mock-based)
```javascript
jest.mock('../../../../config/database', () => ({ pool: { query: jest.fn() } }));
jest.mock('../../models/CategoriaModel');

const mockReq = (overrides = {}) => ({
  body: {}, params: {}, query: {},
  tenant: { id: 1, slug: 'test' },
  ...overrides
});
```

## Frontend Conventions

### State Management
- **Server state**: React Query (`staleTime: 5min`, `cacheTime: 10min`)
- **Client state**: Zustand for auth (persisted to localStorage)

### Import Aliases (vite.config.js)
```javascript
'@shared'        -> 'src/shared'
'@auth'          -> 'src/modules/auth'
'@inventario'    -> 'src/modules/inventario'
'@productos'     -> 'src/modules/productos'
'@alquileres'    -> 'src/modules/alquileres'
'@clientes'      -> 'src/modules/clientes'
'@operaciones'   -> 'src/modules/operaciones'
'@calendario'    -> 'src/modules/calendario'
'@configuracion' -> 'src/modules/configuracion'
```

### Styling
- **TailwindCSS 4.x** — utility-first
- Mobile/tablet-first with `lg:` breakpoint for desktop
- Toast notifications via Sonner
- Forms via React Hook Form
- Icons via Lucide React

## Database

- **MySQL** with shared schema, `tenant_id` on all tables
- Full schema in `sql/00_SCHEMA_COMPLETO.sql`
- Architecture docs in `docs/arquitectura-saas.md`

## Key Technical Decisions

- **No ORM** — raw SQL with `mysql2/promise` parameterized queries
- **Multi-tenant shared DB** — `tenant_id` column on every table for data isolation
- **Spanish naming** — all domain code uses Spanish (obtener, crear, actualizar, eliminar)
- **Monorepo** — backend + tenant-app + platform-admin + landing in one repo
- **Subdomain routing** — Nginx wildcard + `resolverTenant` middleware
