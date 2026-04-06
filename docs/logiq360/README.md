# Logiq360

Plataforma SaaS de gestion de inventario, cotizaciones, alquileres y logistica para negocios de alquiler de equipos.

## Que es Logiq360?

Logiq360 es un sistema multi-tenant donde cada empresa cliente accede a su propia instancia a traves de un subdominio:

```
empresa.logiq360.com    -> App de la empresa
admin.logiq360.com      -> Panel de administracion de la plataforma
logiq360.com            -> Pagina de marketing
```

## Caracteristicas

- **Inventario**: Gestion de categorias, elementos, series (individual) y lotes (batch), materiales, ubicaciones
- **Cotizaciones**: Creacion, seguimiento y aprobacion de cotizaciones
- **Alquileres**: Gestion completa del ciclo de alquiler
- **Productos compuestos**: Bundles de elementos para alquilar como paquetes
- **Ordenes de trabajo**: Gestion de logistica y operaciones de campo
- **Calendario**: Vista calendario de eventos y alquileres
- **Multi-tenant**: Cada empresa tiene su espacio aislado con datos independientes

## Stack Tecnologico

| Componente | Tecnologia |
|-----------|------------|
| Backend | Node.js + Express 5.x |
| Base de datos | MySQL 8.0 |
| Frontend (Tenant) | React 19 + Vite + TailwindCSS |
| Frontend (Admin) | React 19 + Vite + TailwindCSS |
| State Management | React Query + Zustand |
| Auth | JWT (access + refresh tokens) |
| Deploy | Docker Compose + Nginx |

## Estructura del Repositorio

```
logiq360/
  backend/              - API Express (multi-tenant)
  tenant-app/           - App React para empresas clientes
  platform-admin/       - App React para admin de la plataforma
  landing/              - Pagina de marketing
  sql/                  - Schema SQL
  nginx/                - Configuracion Nginx
  docs/                 - Documentacion de arquitectura
  scripts/              - Scripts de deploy
```

## Inicio Rapido

### Prerrequisitos
- Node.js 18+
- MySQL 8.0+
- Docker y Docker Compose (opcional)

### Desarrollo Local

```bash
# Backend
cd backend
cp .env.example .env    # Configurar variables
npm install
npm run dev             # http://localhost:3000

# Tenant App
cd tenant-app
npm install
npm run dev             # http://localhost:5173

# Platform Admin
cd platform-admin
npm install
npm run dev             # http://localhost:5174
```

### Docker

```bash
docker compose up -d
# App disponible en http://localhost
```

## Documentacion

- [Arquitectura SaaS](docs/arquitectura-saas.md) - Decisiones de arquitectura, esquema multi-tenant, flujos

## Licencia

Privado - Todos los derechos reservados.
