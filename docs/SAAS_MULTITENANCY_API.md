# Diseño SaaS: Multi-Tenancy y API Pública

## 1. Modelo de Datos Multi-Tenant

### Tabla de Tenants (Empresas)

```sql
CREATE TABLE tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- Identificación
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,        -- empresa.tuapp.com
  nit VARCHAR(20),

  -- Contacto
  email_admin VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  ciudad_id INT,

  -- Plan y facturación
  plan ENUM('free', 'starter', 'pro', 'enterprise') DEFAULT 'free',
  fecha_inicio DATE NOT NULL,
  fecha_fin_trial DATE,
  stripe_customer_id VARCHAR(100),

  -- Límites según plan
  max_usuarios INT DEFAULT 3,
  max_elementos INT DEFAULT 100,
  max_alquileres_mes INT DEFAULT 50,

  -- Estado
  estado ENUM('activo', 'trial', 'suspendido', 'cancelado') DEFAULT 'trial',
  suspendido_razon TEXT,

  -- Configuración
  config JSON,                              -- Logo, colores, etc.
  timezone VARCHAR(50) DEFAULT 'America/Bogota',
  moneda VARCHAR(3) DEFAULT 'COP',

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_estado (estado)
);
```

### Tabla de Usuarios (Multi-Tenant)

```sql
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,

  -- Autenticación
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Perfil
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  avatar_url VARCHAR(255),

  -- Rol y permisos
  rol ENUM('admin', 'gerente', 'operador', 'vendedor') DEFAULT 'operador',
  permisos JSON,                            -- Permisos personalizados

  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  ultimo_login TIMESTAMP,
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta TIMESTAMP,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,

  UNIQUE KEY uk_tenant_email (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id)
);
```

### Tabla de Super Admins (Tu equipo)

```sql
CREATE TABLE super_admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('owner', 'support', 'billing') DEFAULT 'support',
  activo BOOLEAN DEFAULT TRUE,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modificar tablas existentes (agregar tenant_id)

```sql
-- Ejemplo con elementos
ALTER TABLE elementos
  ADD COLUMN tenant_id INT NOT NULL AFTER id,
  ADD INDEX idx_tenant (tenant_id),
  ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Repetir para todas las tablas:
-- categorias, series, lotes, ubicaciones, materiales, unidades
-- elementos_compuestos, compuesto_componentes, categorias_productos
-- clientes, cotizaciones, cotizacion_productos, cotizacion_transportes
-- alquileres, alquiler_elementos, ciudades, tarifas_transporte
```

---

## 2. Super Admin Panel

### Estructura de Carpetas

```
superadmin-frontend/              # App separada o rutas protegidas
├── src/
│   ├── pages/
│   │   ├── DashboardPage.jsx     # Métricas globales
│   │   ├── TenantsPage.jsx       # Lista de empresas
│   │   ├── TenantDetailPage.jsx  # Detalle de empresa
│   │   ├── PlansPage.jsx         # Gestión de planes
│   │   ├── BillingPage.jsx       # Facturación
│   │   ├── SupportPage.jsx       # Tickets de soporte
│   │   └── SystemPage.jsx        # Config del sistema
│   └── ...
```

### Endpoints del Super Admin

```javascript
// routes/superadmin.js
router.use(superAdminAuthMiddleware);  // Solo super admins

// Tenants
router.get('/tenants', tenantController.listar);
router.get('/tenants/:id', tenantController.detalle);
router.post('/tenants', tenantController.crear);
router.put('/tenants/:id', tenantController.actualizar);
router.post('/tenants/:id/suspender', tenantController.suspender);
router.post('/tenants/:id/reactivar', tenantController.reactivar);
router.delete('/tenants/:id', tenantController.eliminar);

// Métricas
router.get('/metrics/overview', metricsController.overview);
router.get('/metrics/revenue', metricsController.revenue);
router.get('/metrics/usage', metricsController.usage);
router.get('/metrics/tenant/:id', metricsController.tenantUsage);

// Impersonación (para soporte)
router.post('/impersonate/:tenantId/:userId', authController.impersonate);

// Planes y facturación
router.get('/plans', planController.listar);
router.put('/plans/:id', planController.actualizar);
router.get('/invoices', billingController.invoices);

// Sistema
router.get('/system/health', systemController.health);
router.get('/system/logs', systemController.logs);
router.post('/system/maintenance', systemController.maintenance);
```

### Dashboard del Super Admin

```jsx
// SuperAdminDashboard.jsx
function SuperAdminDashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* KPIs principales */}
      <StatCard title="Empresas Activas" value={stats.tenantsActivos} />
      <StatCard title="Usuarios Totales" value={stats.usuariosTotales} />
      <StatCard title="MRR" value={formatCurrency(stats.mrr)} />
      <StatCard title="Alquileres Hoy" value={stats.alquileresHoy} />

      {/* Gráficos */}
      <div className="col-span-2">
        <RevenueChart data={revenueData} />
      </div>
      <div className="col-span-2">
        <SignupsChart data={signupsData} />
      </div>

      {/* Tablas */}
      <div className="col-span-2">
        <h3>Empresas Recientes</h3>
        <TenantsTable tenants={recentTenants} />
      </div>
      <div className="col-span-2">
        <h3>Alertas</h3>
        <AlertsList alerts={alerts} />
      </div>
    </div>
  );
}
```

### Gestión de Tenants

```jsx
// TenantsPage.jsx
function TenantsPage() {
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    plan: 'todos',
    busqueda: ''
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>Empresas</h1>
        <Button onClick={() => setShowCrearModal(true)}>
          + Nueva Empresa
        </Button>
      </div>

      <Filtros value={filtros} onChange={setFiltros} />

      <Table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Plan</th>
            <th>Usuarios</th>
            <th>Elementos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(tenant => (
            <tr key={tenant.id}>
              <td>
                <div>{tenant.nombre}</div>
                <div className="text-sm text-gray-500">{tenant.slug}.tuapp.com</div>
              </td>
              <td><PlanBadge plan={tenant.plan} /></td>
              <td>{tenant.usuarios_count} / {tenant.max_usuarios}</td>
              <td>{tenant.elementos_count} / {tenant.max_elementos}</td>
              <td><EstadoBadge estado={tenant.estado} /></td>
              <td>
                <DropdownMenu>
                  <MenuItem onClick={() => verDetalle(tenant.id)}>Ver</MenuItem>
                  <MenuItem onClick={() => impersonar(tenant.id)}>Impersonar</MenuItem>
                  <MenuItem onClick={() => suspender(tenant.id)}>Suspender</MenuItem>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
```

---

## 3. API Pública para Aplicaciones Externas

### Modelo de API Keys

```sql
CREATE TABLE api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,

  -- Identificación
  nombre VARCHAR(100) NOT NULL,           -- "App de Eventos", "Integración CRM"
  key_hash VARCHAR(255) NOT NULL,          -- SHA256 del key
  key_prefix VARCHAR(10) NOT NULL,         -- Primeros caracteres para identificar

  -- Permisos
  scopes JSON NOT NULL,                    -- ["eventos:read", "disponibilidad:read"]

  -- Límites
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT DEFAULT 10000,

  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  ultimo_uso TIMESTAMP,
  requests_hoy INT DEFAULT 0,

  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  expires_at TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_prefix (key_prefix)
);

-- Log de uso de API
CREATE TABLE api_requests_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  api_key_id INT NOT NULL,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time_ms INT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_api_key_date (api_key_id, created_at)
);
```

### Estructura de la API Pública

```
/api/v1/public/
├── eventos                    # Calendario de eventos/alquileres
├── disponibilidad             # Consultar disponibilidad
├── productos                  # Catálogo de productos
├── cotizaciones               # Crear/consultar cotizaciones
└── webhooks                   # Configurar webhooks
```

### Middleware de Autenticación por API Key

```javascript
// middleware/apiKeyAuth.js
const crypto = require('crypto');

const apiKeyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'API key requerida',
      code: 'MISSING_API_KEY'
    });
  }

  const apiKey = authHeader.substring(7);
  const keyPrefix = apiKey.substring(0, 8);
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Buscar API key
  const [rows] = await db.query(`
    SELECT ak.*, t.estado as tenant_estado, t.slug
    FROM api_keys ak
    JOIN tenants t ON ak.tenant_id = t.id
    WHERE ak.key_prefix = ? AND ak.key_hash = ?
  `, [keyPrefix, keyHash]);

  if (!rows.length) {
    return res.status(401).json({
      error: 'API key inválida',
      code: 'INVALID_API_KEY'
    });
  }

  const apiKeyRecord = rows[0];

  // Validaciones
  if (!apiKeyRecord.activo) {
    return res.status(401).json({ error: 'API key desactivada' });
  }

  if (apiKeyRecord.tenant_estado !== 'activo') {
    return res.status(403).json({ error: 'Cuenta suspendida' });
  }

  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return res.status(401).json({ error: 'API key expirada' });
  }

  // Rate limiting
  if (apiKeyRecord.requests_hoy >= apiKeyRecord.rate_limit_per_day) {
    return res.status(429).json({
      error: 'Límite diario excedido',
      limit: apiKeyRecord.rate_limit_per_day
    });
  }

  // Adjuntar info al request
  req.apiKey = apiKeyRecord;
  req.tenantId = apiKeyRecord.tenant_id;
  req.scopes = JSON.parse(apiKeyRecord.scopes);

  // Actualizar uso
  db.query('UPDATE api_keys SET ultimo_uso = NOW(), requests_hoy = requests_hoy + 1 WHERE id = ?',
    [apiKeyRecord.id]);

  next();
};

// Verificador de scopes
const requireScope = (scope) => (req, res, next) => {
  if (!req.scopes.includes(scope) && !req.scopes.includes('*')) {
    return res.status(403).json({
      error: `Scope '${scope}' requerido`,
      code: 'INSUFFICIENT_SCOPE'
    });
  }
  next();
};

module.exports = { apiKeyAuth, requireScope };
```

### Endpoints de la API Pública

```javascript
// routes/public.js
const router = express.Router();
const { apiKeyAuth, requireScope } = require('../middleware/apiKeyAuth');

// Todas las rutas requieren API key
router.use(apiKeyAuth);

// ============================================
// EVENTOS (Calendario de alquileres)
// ============================================

// GET /api/v1/public/eventos
// Obtener eventos en un rango de fechas
router.get('/eventos',
  requireScope('eventos:read'),
  async (req, res) => {
    const { fecha_inicio, fecha_fin, estado } = req.query;

    const eventos = await AlquilerModel.obtenerEventos(
      req.tenantId,
      fecha_inicio,
      fecha_fin,
      estado
    );

    res.json({
      data: eventos.map(e => ({
        id: e.id,
        titulo: e.cliente_nombre,
        fecha_evento: e.fecha_evento,
        fecha_fin: e.fecha_fin,
        ubicacion: e.ubicacion_nombre,
        estado: e.estado,
        productos: e.productos,
        total: e.total
      })),
      meta: {
        total: eventos.length,
        fecha_inicio,
        fecha_fin
      }
    });
  }
);

// GET /api/v1/public/eventos/:id
router.get('/eventos/:id',
  requireScope('eventos:read'),
  async (req, res) => {
    const evento = await AlquilerModel.obtenerCompleto(
      req.tenantId,
      req.params.id
    );

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json({ data: evento });
  }
);

// ============================================
// DISPONIBILIDAD
// ============================================

// GET /api/v1/public/disponibilidad
router.get('/disponibilidad',
  requireScope('disponibilidad:read'),
  async (req, res) => {
    const { elemento_id, producto_id, fecha_inicio, fecha_fin } = req.query;

    const disponibilidad = await DisponibilidadModel.verificar(
      req.tenantId,
      { elemento_id, producto_id, fecha_inicio, fecha_fin }
    );

    res.json({
      data: {
        disponible: disponibilidad.disponible,
        cantidad_disponible: disponibilidad.cantidad,
        conflictos: disponibilidad.conflictos
      }
    });
  }
);

// ============================================
// PRODUCTOS (Catálogo)
// ============================================

// GET /api/v1/public/productos
router.get('/productos',
  requireScope('productos:read'),
  async (req, res) => {
    const { categoria, activo = true } = req.query;

    const productos = await ElementoCompuestoModel.obtenerCatalogo(
      req.tenantId,
      { categoria, activo }
    );

    res.json({
      data: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria: p.categoria_nombre,
        precio_base: p.precio_base,
        deposito: p.deposito,
        imagen_url: p.imagen_url,
        incluye: p.componentes
      }))
    });
  }
);

// ============================================
// COTIZACIONES
// ============================================

// POST /api/v1/public/cotizaciones
router.post('/cotizaciones',
  requireScope('cotizaciones:write'),
  async (req, res) => {
    const { cliente, productos, fecha_evento, notas } = req.body;

    // Validar disponibilidad
    for (const prod of productos) {
      const disp = await DisponibilidadModel.verificar(
        req.tenantId,
        { producto_id: prod.id, fecha_inicio: fecha_evento }
      );

      if (!disp.disponible) {
        return res.status(409).json({
          error: 'Producto no disponible',
          producto: prod.id,
          conflictos: disp.conflictos
        });
      }
    }

    const cotizacion = await CotizacionModel.crearDesdeAPI(
      req.tenantId,
      { cliente, productos, fecha_evento, notas }
    );

    res.status(201).json({
      data: cotizacion,
      message: 'Cotización creada exitosamente'
    });
  }
);

// GET /api/v1/public/cotizaciones/:id
router.get('/cotizaciones/:id',
  requireScope('cotizaciones:read'),
  async (req, res) => {
    const cotizacion = await CotizacionModel.obtenerCompleta(
      req.tenantId,
      req.params.id
    );

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    res.json({ data: cotizacion });
  }
);

module.exports = router;
```

### Ejemplo de Uso desde App Externa

```javascript
// En tu otra aplicación (App de Eventos)
const API_KEY = 'sk_live_abc123...';
const API_URL = 'https://api.inventariocarpas.com/api/v1/public';

// Obtener eventos del mes
async function obtenerEventos(mes, año) {
  const response = await fetch(
    `${API_URL}/eventos?fecha_inicio=${año}-${mes}-01&fecha_fin=${año}-${mes}-31`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Verificar disponibilidad antes de mostrar producto
async function verificarDisponibilidad(productoId, fecha) {
  const response = await fetch(
    `${API_URL}/disponibilidad?producto_id=${productoId}&fecha_inicio=${fecha}`,
    {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }
  );

  const { data } = await response.json();
  return data.disponible;
}

// Crear cotización desde formulario web externo
async function crearCotizacion(datos) {
  const response = await fetch(`${API_URL}/cotizaciones`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cliente: {
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono
      },
      productos: datos.productosSeleccionados,
      fecha_evento: datos.fecha,
      notas: datos.comentarios
    })
  });

  return response.json();
}
```

---

## 4. Sistema de Webhooks

### Tabla de Webhooks

```sql
CREATE TABLE webhooks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,

  -- Configuración
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(100) NOT NULL,           -- Para validar firma
  eventos JSON NOT NULL,                   -- ["cotizacion.creada", "alquiler.confirmado"]

  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  ultimo_envio TIMESTAMP,
  fallos_consecutivos INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE webhook_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  webhook_id INT NOT NULL,
  evento VARCHAR(50),
  payload JSON,
  response_status INT,
  response_body TEXT,
  intentos INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Eventos Disponibles

```javascript
const WEBHOOK_EVENTS = {
  // Cotizaciones
  'cotizacion.creada': 'Cuando se crea una nueva cotización',
  'cotizacion.actualizada': 'Cuando se modifica una cotización',
  'cotizacion.aprobada': 'Cuando se aprueba una cotización',
  'cotizacion.rechazada': 'Cuando se rechaza una cotización',

  // Alquileres
  'alquiler.creado': 'Cuando se crea un alquiler',
  'alquiler.salida': 'Cuando sale el material',
  'alquiler.retorno': 'Cuando regresa el material',
  'alquiler.completado': 'Cuando se completa el alquiler',

  // Inventario
  'inventario.bajo_stock': 'Cuando un elemento baja del mínimo',
  'inventario.movimiento': 'Cuando hay movimiento de lotes'
};
```

### Servicio de Webhooks

```javascript
// services/webhookService.js
const crypto = require('crypto');
const axios = require('axios');

class WebhookService {

  async disparar(tenantId, evento, payload) {
    // Obtener webhooks activos para este evento
    const [webhooks] = await db.query(`
      SELECT * FROM webhooks
      WHERE tenant_id = ?
        AND activo = TRUE
        AND JSON_CONTAINS(eventos, ?)
    `, [tenantId, JSON.stringify(evento)]);

    for (const webhook of webhooks) {
      this.enviar(webhook, evento, payload);
    }
  }

  async enviar(webhook, evento, payload, intento = 1) {
    const timestamp = Date.now();
    const body = JSON.stringify({
      evento,
      timestamp,
      data: payload
    });

    // Crear firma HMAC
    const firma = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    try {
      const response = await axios.post(webhook.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': firma,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Event': evento
        },
        timeout: 10000
      });

      // Log exitoso
      await this.log(webhook.id, evento, payload, response.status, 'OK', intento);

      // Resetear fallos
      await db.query(
        'UPDATE webhooks SET ultimo_envio = NOW(), fallos_consecutivos = 0 WHERE id = ?',
        [webhook.id]
      );

    } catch (error) {
      // Log error
      await this.log(
        webhook.id, evento, payload,
        error.response?.status || 0,
        error.message,
        intento
      );

      // Reintentar con backoff exponencial
      if (intento < 5) {
        const delay = Math.pow(2, intento) * 1000; // 2s, 4s, 8s, 16s, 32s
        setTimeout(() => this.enviar(webhook, evento, payload, intento + 1), delay);
      } else {
        // Desactivar webhook después de 5 fallos
        await db.query(`
          UPDATE webhooks
          SET fallos_consecutivos = fallos_consecutivos + 1,
              activo = CASE WHEN fallos_consecutivos >= 10 THEN FALSE ELSE activo END
          WHERE id = ?
        `, [webhook.id]);
      }
    }
  }

  async log(webhookId, evento, payload, status, response, intentos) {
    await db.query(`
      INSERT INTO webhook_logs (webhook_id, evento, payload, response_status, response_body, intentos)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [webhookId, evento, JSON.stringify(payload), status, response, intentos]);
  }
}

module.exports = new WebhookService();
```

### Uso en los Controllers

```javascript
// controllers/cotizacionController.js
const webhookService = require('../services/webhookService');

const crear = async (req, res, next) => {
  try {
    // ... crear cotización ...

    // Disparar webhook
    await webhookService.disparar(req.tenantId, 'cotizacion.creada', {
      cotizacion_id: cotizacion.id,
      cliente: cotizacion.cliente_nombre,
      total: cotizacion.total,
      fecha_evento: cotizacion.fecha_evento
    });

    res.status(201).json(cotizacion);
  } catch (error) {
    next(error);
  }
};
```

### Verificar Webhook en App Externa

```javascript
// En tu app que recibe webhooks
const crypto = require('crypto');

app.post('/webhooks/inventario', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const body = JSON.stringify(req.body);

  // Verificar firma
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Firma inválida');
  }

  // Verificar que no sea muy viejo (prevenir replay attacks)
  if (Date.now() - parseInt(timestamp) > 300000) { // 5 minutos
    return res.status(401).send('Timestamp expirado');
  }

  // Procesar evento
  const { evento, data } = req.body;

  switch (evento) {
    case 'alquiler.creado':
      console.log('Nuevo alquiler:', data);
      // Actualizar tu calendario de eventos
      break;
    case 'cotizacion.aprobada':
      console.log('Cotización aprobada:', data);
      // Enviar notificación
      break;
  }

  res.status(200).send('OK');
});
```

---

## 5. UI para Gestión de API Keys

```jsx
// pages/ConfiguracionAPI.jsx
function ConfiguracionAPIPage() {
  const { data: apiKeys } = useApiKeys();
  const [showCrear, setShowCrear] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API y Integraciones</h1>
          <p className="text-gray-600">
            Conecta aplicaciones externas con tu inventario
          </p>
        </div>
        <Button onClick={() => setShowCrear(true)}>
          + Nueva API Key
        </Button>
      </div>

      {/* API Keys existentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold">API Keys</h2>
        </div>
        <div className="divide-y">
          {apiKeys?.map(key => (
            <div key={key.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{key.nombre}</div>
                <div className="text-sm text-gray-500">
                  {key.key_prefix}...xxxx • Creada {formatDate(key.created_at)}
                </div>
                <div className="flex gap-1 mt-1">
                  {JSON.parse(key.scopes).map(scope => (
                    <span key={scope} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {key.requests_hoy} req hoy
                </div>
                <Switch
                  checked={key.activo}
                  onChange={() => toggleApiKey(key.id)}
                />
                <Button variant="ghost" onClick={() => eliminarApiKey(key.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-semibold">Webhooks</h2>
          <Button variant="outline" size="sm" onClick={() => setShowWebhook(true)}>
            + Agregar
          </Button>
        </div>
        {/* Lista de webhooks */}
      </div>

      {/* Documentación */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Documentación de la API</h3>
        <p className="text-gray-600 mb-4">
          Consulta la documentación completa para integrar tu aplicación.
        </p>
        <Button variant="outline" asChild>
          <a href="/docs/api" target="_blank">Ver documentación</a>
        </Button>
      </div>

      {showCrear && <CrearApiKeyModal onClose={() => setShowCrear(false)} />}
    </div>
  );
}
```

---

## Resumen de Arquitectura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN PANEL                           │
│                 superadmin.tuapp.com                            │
│  • Gestión de tenants  • Métricas globales  • Facturación      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│              api.tuapp.com / {tenant}.tuapp.com                │
├─────────────────────────────────────────────────────────────────┤
│  • Autenticación (JWT / API Key)                               │
│  • Rate limiting por tenant                                     │
│  • Routing a servicios                                          │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   APP INTERNA    │  │   API PÚBLICA    │  │   WEBHOOKS       │
│  (React SPA)     │  │   /api/v1/public │  │   Service        │
│                  │  │                  │  │                  │
│  Usuarios del    │  │  Apps externas   │  │  Notificaciones  │
│  tenant          │  │  con API Key     │  │  push a apps     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                                │
│              (Multi-tenant con tenant_id)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

*Documento generado el 12 de enero de 2026*
