# Análisis Arquitectónico: Inventario de Carpas

## Resumen Ejecutivo

| Aspecto | Estado | Veredicto |
|---------|--------|-----------|
| **¿Es un monolito bien organizado?** | ✅ | **SÍ** - Estructura modular clara con MVC consistente |
| **¿Listo para microservicios?** | ⚠️ | **NO AÚN** - Faltan requisitos previos |
| **¿Listo para SaaS?** | ❌ | **NO** - Requiere multi-tenancy y autenticación |

---

## 1. Evaluación del Monolito Actual

### Lo que está BIEN hecho

```
✅ Arquitectura MVC clara y consistente
✅ 4 módulos de negocio bien definidos:
   - Inventario (stock físico)
   - Productos (plantillas de alquiler)
   - Alquileres (operaciones comerciales)
   - Configuración (datos maestros)
✅ Separación frontend/backend limpia
✅ Validación centralizada
✅ Manejo de errores consistente
✅ Transacciones en operaciones críticas
✅ SQL parameterizado (prevención SQL injection)
✅ Rate limiting y CORS configurados
```

### Lo que FALTA para producción/SaaS

```
❌ Autenticación/Autorización (JWT + RBAC)
❌ Multi-tenancy (aislamiento por cliente/empresa)
❌ Auditoría de cambios (quién hizo qué)
❌ Observabilidad (métricas, logs estructurados)
❌ Caching distribuido
❌ Tests de integración robustos
```

---

## 2. Mapa de Dependencias entre Módulos

```
┌─────────────────────────────────────────────┐
│           INVENTARIO (Core)                 │
│  Categorías, Elementos, Series, Lotes       │
│  Ubicaciones, Materiales, Unidades          │
└─────────────────────────────────────────────┘
         ↑                        ↑
         │ FK                     │
┌────────┴────────┐    ┌─────────┴──────────┐
│    PRODUCTOS    │    │   CONFIGURACIÓN    │
│   Plantillas    │    │     Ciudades       │
│   de alquiler   │    │                    │
└─────────────────┘    └────────────────────┘
         ↑                        ↑
         │                        │
         └──────────┬─────────────┘
                    │
            ┌───────┴───────┐
            │  ALQUILERES   │
            │  Cotizaciones │
            │  Clientes     │
            └───────────────┘
```

**Análisis de Acoplamiento:**
- **Alto acoplamiento:** Alquileres ↔ Inventario (verificación de disponibilidad)
- **Medio acoplamiento:** Productos → Inventario (componentes)
- **Bajo acoplamiento:** Configuración (independiente)

---

## 3. Recomendación: Microservicios o Monolito?

### Mi veredicto: **MANTENER MONOLITO MODULAR** (por ahora)

**Razones:**

| Factor | Análisis |
|--------|----------|
| **Tamaño del equipo** | Aparentemente 1 desarrollador → microservicios agrega complejidad innecesaria |
| **Complejidad del dominio** | El dominio es cohesivo (alquiler de carpas) → no justifica separación |
| **Carga esperada** | Una empresa de alquiler típica: <1000 req/min → monolito sobra |
| **Velocidad de desarrollo** | Monolito permite iterar más rápido |
| **Costo operacional** | 1 servidor vs N servicios + orquestador + message broker |

### Cuándo SÍ considerar microservicios

Solo si se cumple ALGUNA de estas condiciones:
- [ ] +5 desarrolladores trabajando en paralelo
- [ ] +10,000 requests/minuto sostenidos
- [ ] Módulos que necesitan escalar independientemente
- [ ] Diferentes tecnologías por módulo (Python ML, Go realtime, etc.)
- [ ] Requisitos de disponibilidad diferentes (inventario 99.9%, reportes 99%)

---

## 4. Roadmap hacia SaaS

### Fase 1: Fundamentos (Prioridad ALTA)

#### 1.1 Multi-Tenancy
El cambio MÁS importante para SaaS es soportar múltiples empresas/clientes.

**Estrategia recomendada: Tenant ID en cada tabla**

```sql
-- Antes
CREATE TABLE elementos (
  id INT PRIMARY KEY,
  nombre VARCHAR(100),
  ...
);

-- Después
CREATE TABLE elementos (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,  -- ← NUEVO
  nombre VARCHAR(100),
  ...
  INDEX idx_tenant (tenant_id)
);
```

**Middleware de tenant:**
```javascript
// middleware/tenant.js
const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant requerido' });
  }
  req.tenantId = tenantId;
  next();
};

// En cada query
const elementos = await db.query(
  'SELECT * FROM elementos WHERE tenant_id = ?',
  [req.tenantId]
);
```

#### 1.2 Autenticación y Autorización

```
┌─────────────────────────────────────────────┐
│              AUTH SERVICE                   │
├─────────────────────────────────────────────┤
│  • JWT con refresh tokens                   │
│  • Roles: admin, gerente, operador          │
│  • Permisos por módulo                      │
│  • Session management                       │
└─────────────────────────────────────────────┘
```

**Modelo de permisos sugerido:**

```javascript
const ROLES = {
  admin: ['*'], // Todo
  gerente: [
    'inventario:read', 'inventario:write',
    'productos:read', 'productos:write',
    'alquileres:*',
    'reportes:read'
  ],
  operador: [
    'inventario:read',
    'alquileres:read', 'alquileres:update_status'
  ],
  cliente: [
    'cotizaciones:read:own',
    'alquileres:read:own'
  ]
};
```

#### 1.3 Auditoría

```sql
CREATE TABLE audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(50),      -- CREATE, UPDATE, DELETE
  entity_type VARCHAR(50), -- elemento, cotizacion, etc
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_entity (tenant_id, entity_type, created_at)
);
```

### Fase 2: Preparación para Escala

#### 2.1 Caché Distribuido (Redis)

```javascript
// Cachear disponibilidad (cálculo costoso)
const disponibilidad = await cache.getOrSet(
  `disponibilidad:${tenantId}:${elementoId}:${fecha}`,
  async () => await DisponibilidadModel.calcular(elementoId, fecha),
  { ttl: 300 } // 5 minutos
);
```

#### 2.2 Queue para Operaciones Asíncronas

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │───▶│   QUEUE     │───▶│  WORKERS    │
│   Request   │    │  (Bull/MQ)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                            │
      ┌────────────────────────────────────┬┴───────────────┐
      │                                    │                │
      ▼                                    ▼                ▼
┌──────────┐                        ┌──────────┐    ┌──────────┐
│  EMAIL   │                        │ REPORTES │    │  BACKUP  │
│ Notifica │                        │  PDF     │    │  Nightly │
└──────────┘                        └──────────┘    └──────────┘
```

**Casos de uso:**
- Envío de emails (cotización aprobada, recordatorio de retorno)
- Generación de reportes PDF
- Sincronización con sistemas externos
- Backups programados

#### 2.3 Separación de Lectura/Escritura (CQRS Lite)

```javascript
// Para reportes y dashboards (lectura pesada)
const readPool = mysql.createPool({
  host: process.env.DB_READ_HOST,  // Réplica de lectura
  connectionLimit: 20
});

// Para operaciones transaccionales
const writePool = mysql.createPool({
  host: process.env.DB_WRITE_HOST, // Master
  connectionLimit: 10
});
```

### Fase 3: Módulo Candidato a Microservicio

Si en el futuro necesitas extraer UN módulo, el candidato es:

### **DISPONIBILIDAD SERVICE**

**¿Por qué este módulo?**

1. **Cálculo intensivo:** Requiere verificar múltiples tablas
2. **Alta frecuencia:** Se consulta en cada cotización
3. **Cacheable:** Resultados pueden cachearse
4. **Bajo acoplamiento de escritura:** Solo lee datos

```
┌─────────────────────────────────────────────┐
│         DISPONIBILIDAD SERVICE              │
├─────────────────────────────────────────────┤
│  GET /api/disponibilidad                    │
│    ?elemento_id=X                           │
│    &fecha_inicio=YYYY-MM-DD                 │
│    &fecha_fin=YYYY-MM-DD                    │
├─────────────────────────────────────────────┤
│  • Caché Redis con TTL                      │
│  • Réplica de lectura dedicada              │
│  • Escala horizontal independiente          │
│  • Circuit breaker si monolito falla        │
└─────────────────────────────────────────────┘
```

---

## 5. Arquitectura SaaS Propuesta (Visión Final)

```
                    ┌─────────────────────┐
                    │   LOAD BALANCER     │
                    │   (nginx/ALB)       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Instance │    │ Instance │    │ Instance │
        │    1     │    │    2     │    │    N     │
        └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │               │
             └───────────────┼───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌──────────┐        ┌──────────┐        ┌──────────┐
  │  MySQL   │        │  Redis   │        │  Queue   │
  │  Master  │───────▶│  Cache   │        │  (Bull)  │
  │    +     │        │          │        │          │
  │ Replicas │        └──────────┘        └──────────┘
  └──────────┘
```

**Por tenant:**
- Datos aislados por `tenant_id`
- Subdominio: `empresa.tuapp.com`
- Configuración personalizable
- Facturación por uso

---

## 6. Checklist de Implementación

### Prioridad CRÍTICA (antes de lanzar)
- [ ] Implementar autenticación JWT
- [ ] Agregar `tenant_id` a todas las tablas
- [ ] Middleware de aislamiento de tenant
- [ ] HTTPS obligatorio
- [ ] Validación de datos en todas las entradas

### Prioridad ALTA (primeros 3 meses)
- [ ] Sistema de roles y permisos
- [ ] Audit log de operaciones
- [ ] Backups automáticos
- [ ] Monitoreo básico (uptime, errores)
- [ ] Rate limiting por tenant

### Prioridad MEDIA (3-6 meses)
- [ ] Redis para caché
- [ ] Queue para emails/notificaciones
- [ ] Dashboard de métricas
- [ ] Exportación de datos (GDPR compliance)
- [ ] API pública documentada

### Prioridad BAJA (6+ meses)
- [ ] Réplicas de lectura
- [ ] Service de disponibilidad separado
- [ ] Integración con pasarelas de pago
- [ ] Mobile app / PWA

---

## 7. Conclusión

Tu aplicación está **bien estructurada como monolito modular**. La arquitectura MVC es consistente y los módulos están razonablemente separados.

**Para convertirla en SaaS, el orden de prioridades es:**

1. **Multi-tenancy** → Es el cambio fundamental
2. **Autenticación** → Sin esto no hay producto
3. **Observabilidad** → Para operar en producción
4. **Caché/Queue** → Para escalar

**NO recomiendo microservicios** en este momento porque:
- Agregaría complejidad operacional significativa
- El dominio es cohesivo (alquiler de carpas)
- El volumen esperado no lo justifica
- Un solo desarrollador no puede mantener N servicios eficientemente

Cuando tengas +1000 clientes activos y +5 desarrolladores, reevalúa. Mientras tanto, un monolito bien diseñado es la mejor opción.

---

*Documento generado el 12 de enero de 2026*
