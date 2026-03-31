# Bitácora de Trabajo de Grado - N° 12

## Información General

| Campo | Detalle |
|-------|---------|
| **Fecha** | 15 de marzo de 2026 |
| **Periodo** | 15 de marzo – 30 de marzo de 2026 |
| **Proyecto** | Sistema de Gestión de Inventario para Alquiler de Carpas |
| **Estudiante** | Anderson |
| **Horas dedicadas** | 38 horas |

---

## Objetivo del Periodo

Dockerizar el proyecto, desplegarlo en un servidor en la nube para revisión del cliente, e implementar funcionalidades de marcado de daños y mantenimiento de equipos.

---

## Actividades Realizadas

1. **Marcado de daños y órdenes de mantenimiento**:
   - Implementación de marcado de daños en el checklist de retorno con generación automática de órdenes de mantenimiento.
   - Flujo de mantenimiento en 4 pasos con formulario de resultados por elemento.
   - Sincronización automática de `estado_retorno` al verificar elementos en bodega.
   - Visualización de encargados separados para montaje y desmontaje.

2. **Asignación de responsables en órdenes de trabajo**:
   - Sistema de asignación con flujo de aceptar/rechazar para empleados de campo.
   - Middleware `verificarAccesoOrden` aplicado a todas las rutas de órdenes.
   - Script para crear empleados de operaciones de campo.

3. **Mejoras al wizard de cotizaciones**:
   - Nuevo paso de descuentos integrado al wizard.
   - Pantalla de éxito con mini-resumen completo de la cotización creada.
   - Historial de órdenes de trabajo con cards expandibles y modal de detalle.

4. **Dockerización completa del proyecto**:
   - Creación de 3 contenedores: MySQL 8.0, Node.js 20 (backend) y Nginx (frontend con reverse proxy).
   - Dockerfile multi-stage para el frontend (build con Node → serve con Nginx).
   - Dockerfile del backend con script `wait-for-db.sh` para esperar la base de datos.
   - Nginx configurado como reverse proxy: sirve archivos estáticos y proxea `/api/` al backend internamente.
   - Separación de configuración dev/prod con `docker-compose.yml` (producción) y `docker-compose.override.yml` (desarrollo).
   - El backend no expone puertos directamente — solo Nginx en el puerto 80.

5. **Despliegue en servidor de producción (DigitalOcean)**:
   - Contratación de Droplet Ubuntu 24.04 con 1GB RAM ($6/mes).
   - Instalación de Docker Engine y Docker Compose en el servidor.
   - Configuración de swap de 2GB para compensar la memoria limitada (el build de Vite con 2638 módulos requería más de 1GB).
   - Límite de memoria de Node.js en el build del frontend (`--max-old-space-size=512`) para evitar OOM.
   - Script de despliegue (`scripts/deploy.sh`) para automatizar el proceso.
   - Aplicación accesible públicamente en `http://159.89.42.74`.

6. **Corrección de errores de producción**:
   - **CORS**: El reverse proxy causaba que las peticiones llegaran desde la IP pública, bloqueadas por CORS. Se modificó el callback de CORS para comparar hostnames en lugar de URLs completas.
   - **500 en todos los endpoints**: El schema SQL de Docker solo creaba 5 tablas, pero la aplicación requiere 46. Se reemplazó por un dump completo de la base de datos local con todas las tablas y datos.
   - **Rate limiting**: El límite de 100 peticiones cada 15 minutos era insuficiente para la SPA (múltiples llamadas API por navegación). Se aumentó a 1000.
   - **Bloqueo de cuenta**: Múltiples intentos fallidos durante la configuración bloquearon la cuenta admin. Se desbloqueó desde la consola del contenedor.

7. **Compatibilidad mobile y correcciones generales**:
   - Corrección de scroll en mobile/tablet para módulos con sidebar y páginas standalone.
   - Migración de 18 modales custom al componente Modal compartido para soporte responsive.
   - Botón de volver en top bar de mobile/tablet.
   - Corrección de `invalidateQueries` para compatibilidad con React Query v5 en todos los módulos.

---

## Resultados y Avances

- Proyecto completamente dockerizado y desplegado en producción.
- Aplicación accesible públicamente en `http://159.89.42.74` para revisión del cliente.
- Sistema de marcado de daños con generación automática de órdenes de mantenimiento.
- Asignación de responsables con flujo de aceptar/rechazar.
- 18 modales migrados a componente compartido para mejor soporte mobile.
- 5 PRs mergeados (#101–#105).

---

## Dificultades Encontradas

- El servidor de 1GB de RAM no era suficiente para compilar el frontend de React (2638 módulos). Se resolvió agregando 2GB de swap y limitando la memoria del proceso de Node.js durante el build.
- El schema SQL inicial (`00_SCHEMA_COMPLETO.sql`) solo contenía las primeras 5 tablas del proyecto (de cuando se creó el repositorio), pero la aplicación había crecido a 46 tablas. Esto causaba error 500 en todos los endpoints. Se resolvió exportando un dump completo desde la base de datos local.
- La configuración de CORS en producción con reverse proxy fue compleja: las peticiones llegaban sin header `Origin` (same-origin) o con la IP pública, lo cual no coincidía con los orígenes permitidos.
- El rate limiter por defecto (100 req/15min) era inadecuado para una SPA que realiza múltiples llamadas API concurrentes por cada vista.

---

## Resumen del Estado del Proyecto

Al cierre de esta bitácora, el sistema cuenta con:

| Métrica | Valor |
|---------|-------|
| **Archivos JS/JSX** | 330+ |
| **Endpoints API** | 261 |
| **Componentes React** | 110+ |
| **Hooks personalizados** | 38 |
| **Tablas de base de datos** | 46 |
| **Tests unitarios** | 812+ |
| **Contenedores Docker** | 3 |
| **Commits totales** | 540+ |
| **Pull Requests** | 105 |

---

## Conclusiones Generales

Con el despliegue en producción, el proyecto ha completado su ciclo de desarrollo desde la investigación inicial hasta la puesta en marcha. El cliente puede ahora acceder al sistema desde cualquier dispositivo a través de la URL pública para realizar sus pruebas y validaciones.

La arquitectura Docker con 3 contenedores (MySQL, Backend, Nginx) permite un despliegue reproducible y facilita futuras actualizaciones mediante `git pull` y reconstrucción de contenedores. Los contenedores se reinician automáticamente si el servidor se reinicia.

---

## Plan Futuro

- Adquisición de dominio y configuración de HTTPS con Let's Encrypt.
- Configuración de CI/CD con GitHub Actions para despliegue automático.
- Capacitación al usuario final.
- Documentación técnica final para el trabajo de grado.
