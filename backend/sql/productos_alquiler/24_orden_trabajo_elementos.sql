-- =====================================================
-- Migración 24: Elementos en Órdenes de Trabajo
-- =====================================================
-- Propósito: Tracking detallado de cada elemento en la orden
-- Permite marcar estado individual durante montaje/desmontaje
-- Registro de incidencias y daños
-- =====================================================

CREATE TABLE IF NOT EXISTS orden_trabajo_elementos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencias
    orden_id INT NOT NULL,
    alquiler_elemento_id INT NOT NULL,

    -- Estado del elemento en esta orden
    -- Los estados varían según tipo de orden (montaje/desmontaje)
    estado ENUM(
        -- Estados para MONTAJE
        'pendiente',          -- No se ha procesado
        'cargado',            -- Subido al vehículo
        'en_transito',        -- En camino
        'descargado',         -- Bajado en sitio
        'montado',            -- Instalado correctamente
        'montado_parcial',    -- Instalado con observaciones

        -- Estados para DESMONTAJE
        'desmontado',         -- Retirado del sitio
        'cargado_retorno',    -- En vehículo de regreso
        'recibido',           -- Llegó a bodega
        'verificado',         -- Revisado y OK

        -- Estados de problema
        'con_incidencia',     -- Tiene algún problema
        'danado',             -- Daño detectado
        'faltante',           -- No se encontró
        'mantenimiento'       -- Requiere mantenimiento
    ) DEFAULT 'pendiente',

    -- Verificación de cantidad (para lotes)
    cantidad_esperada INT DEFAULT 1,
    cantidad_procesada INT DEFAULT 0,
    cantidad_con_problema INT DEFAULT 0,

    -- Ubicación específica en el evento (para montaje)
    ubicacion_en_evento VARCHAR(200),        -- "Zona principal", "Terraza", etc.

    -- Verificación física
    verificado_carga BOOLEAN DEFAULT FALSE,
    verificado_carga_por INT,
    verificado_carga_at DATETIME,

    verificado_sitio BOOLEAN DEFAULT FALSE,
    verificado_sitio_por INT,
    verificado_sitio_at DATETIME,

    verificado_retorno BOOLEAN DEFAULT FALSE,
    verificado_retorno_por INT,
    verificado_retorno_at DATETIME,

    -- Notas y observaciones
    notas TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (alquiler_elemento_id) REFERENCES alquiler_elementos(id),
    FOREIGN KEY (verificado_carga_por) REFERENCES empleados(id),
    FOREIGN KEY (verificado_sitio_por) REFERENCES empleados(id),
    FOREIGN KEY (verificado_retorno_por) REFERENCES empleados(id),

    -- Un elemento solo puede estar una vez por orden
    UNIQUE KEY uk_orden_elemento (orden_id, alquiler_elemento_id)
);

-- Tabla para incidencias/problemas con elementos
CREATE TABLE IF NOT EXISTS elemento_incidencias (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al elemento en la orden
    orden_elemento_id INT NOT NULL,

    -- Tipo de incidencia
    tipo ENUM(
        'dano_leve',          -- Rayón, manchita
        'dano_moderado',      -- Requiere reparación
        'dano_grave',         -- Posiblemente irreparable
        'faltante',           -- No aparece
        'error_cantidad',     -- Cantidad incorrecta
        'problema_montaje',   -- No se pudo montar correctamente
        'problema_cliente',   -- Cliente reportó problema
        'otro'
    ) NOT NULL,

    -- Descripción
    descripcion TEXT NOT NULL,

    -- Evidencia fotográfica
    fotos JSON,                              -- Array de URLs: ["url1", "url2"]

    -- Responsabilidad
    responsable ENUM('empresa', 'cliente', 'transporte', 'desconocido') DEFAULT 'desconocido',

    -- Resolución
    estado ENUM('abierta', 'en_revision', 'resuelta', 'cerrada') DEFAULT 'abierta',
    resolucion TEXT,
    resuelto_por INT,
    resuelto_at DATETIME,

    -- Costo asociado (si aplica)
    costo_reparacion DECIMAL(10,2),
    cobrar_cliente BOOLEAN DEFAULT FALSE,

    -- Reportado por
    reportado_por INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_elemento_id) REFERENCES orden_trabajo_elementos(id) ON DELETE CASCADE,
    FOREIGN KEY (reportado_por) REFERENCES empleados(id),
    FOREIGN KEY (resuelto_por) REFERENCES empleados(id)
);

-- Tabla para fotos de verificación (checklist visual)
CREATE TABLE IF NOT EXISTS orden_elemento_fotos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    orden_elemento_id INT NOT NULL,

    -- Momento de la foto
    momento ENUM('carga', 'montaje', 'desmontaje', 'retorno', 'incidencia') NOT NULL,

    -- Archivo
    url VARCHAR(500) NOT NULL,
    descripcion VARCHAR(200),

    -- Quien tomó la foto
    tomada_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (orden_elemento_id) REFERENCES orden_trabajo_elementos(id) ON DELETE CASCADE,
    FOREIGN KEY (tomada_por) REFERENCES empleados(id)
);

-- Índices principales
CREATE INDEX idx_orden_elementos_orden ON orden_trabajo_elementos(orden_id);
CREATE INDEX idx_orden_elementos_alquiler ON orden_trabajo_elementos(alquiler_elemento_id);
CREATE INDEX idx_orden_elementos_estado ON orden_trabajo_elementos(estado);

-- Índices para incidencias
CREATE INDEX idx_incidencias_orden_elem ON elemento_incidencias(orden_elemento_id);
CREATE INDEX idx_incidencias_tipo ON elemento_incidencias(tipo);
CREATE INDEX idx_incidencias_estado ON elemento_incidencias(estado);

-- Índices para fotos
CREATE INDEX idx_elem_fotos_orden ON orden_elemento_fotos(orden_elemento_id);
CREATE INDEX idx_elem_fotos_momento ON orden_elemento_fotos(momento);

-- =====================================================
-- Flujo típico de estados:
-- =====================================================
-- MONTAJE:
-- pendiente → cargado → en_transito → descargado → montado
--
-- DESMONTAJE:
-- pendiente → desmontado → cargado_retorno → recibido → verificado
--
-- Si hay problema en cualquier punto:
-- [estado actual] → con_incidencia/danado/faltante
-- =====================================================
