# 📋 PLAN DE IMPLEMENTACIÓN: Elementos Compuestos (Productos de Alquiler)

## Sistema de Inventario - VENTO SAS

**Fecha de creación:** Diciembre 2024
**Basado en:** Documento de Análisis y Diseño v1.1
**Estado del proyecto:** 85% funcional (falta completar tablas SQL)

---

## 📊 RESUMEN EJECUTIVO

### Estado Actual del Proyecto

| Componente | Estado | Observaciones |
|------------|--------|---------------|
| Backend (Node.js/Express) | ✅ 95% | 63 endpoints funcionando |
| Frontend (React/Vite) | ✅ 90% | 32 componentes, 5 páginas |
| Base de Datos | ⚠️ 80% | Falta tabla `lotes`, verificar `ubicaciones` |
| Elementos Compuestos | ❌ 0% | **Por implementar** |

### Alcance de la Implementación

Se implementará el sistema completo de **Elementos Compuestos** (Productos de Alquiler) que permitirá:

1. Crear productos finales armados (carpas, salas lounge, parasoles)
2. Asignar componentes individuales (series y lotes) a cada producto
3. Alquilar/devolver productos como unidad
4. Sincronizar automáticamente el estado de todos los componentes
5. Validar disponibilidad antes de alquilar

---

## 🗂️ FASE 0: PREPARACIÓN (Pre-requisitos)

### 0.1 Verificar y Corregir Tablas Existentes

Antes de comenzar, debemos asegurar que las tablas base existan correctamente.

#### Tarea 0.1.1: Verificar tabla `lotes`
```sql
-- Verificar si existe
SHOW TABLES LIKE 'lotes';

-- Si NO existe, crear:
CREATE TABLE IF NOT EXISTS lotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    elemento_id INT NOT NULL,
    lote_numero VARCHAR(100),
    cantidad INT NOT NULL DEFAULT 0,
    estado ENUM('nuevo', 'bueno', 'mantenimiento', 'alquilado', 'dañado') DEFAULT 'bueno',
    ubicacion VARCHAR(200),
    ubicacion_id INT,
    fecha_creacion DATE DEFAULT (CURRENT_DATE),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE CASCADE,
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE SET NULL,

    INDEX idx_elemento (elemento_id),
    INDEX idx_estado (estado),
    INDEX idx_ubicacion (ubicacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tarea 0.1.2: Verificar tabla `ubicaciones`
```sql
-- Verificar si existe
SHOW TABLES LIKE 'ubicaciones';

-- Si NO existe, crear:
CREATE TABLE IF NOT EXISTS ubicaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('bodega', 'taller', 'evento', 'oficina', 'otro') DEFAULT 'bodega',
    direccion TEXT,
    ciudad VARCHAR(100),
    responsable VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    capacidad_estimada VARCHAR(100),
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_activo (activo),
    INDEX idx_tipo (tipo),
    INDEX idx_principal (es_principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### Tarea 0.1.3: Verificar tabla `lotes_movimientos` (historial)
```sql
CREATE TABLE IF NOT EXISTS lotes_movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lote_origen_id INT,
    lote_destino_id INT,
    elemento_id INT NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(100),
    descripcion TEXT,
    estado_origen VARCHAR(50),
    estado_destino VARCHAR(50),
    ubicacion_origen VARCHAR(200),
    ubicacion_destino VARCHAR(200),
    costo_reparacion DECIMAL(12,2),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE CASCADE,

    INDEX idx_elemento (elemento_id),
    INDEX idx_fecha (fecha_movimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 0.2 Archivos a Crear

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `sql/05_ELEMENTOS_COMPUESTOS.sql` | `/backend/sql/` | Script SQL para nuevas tablas |
| `ElementoCompuestoModel.js` | `/backend/models/` | Modelo de datos |
| `CompuestoComponenteModel.js` | `/backend/models/` | Modelo relación componentes |
| `compuestoController.js` | `/backend/controllers/` | Lógica de negocio |
| `compuestos.js` | `/backend/routes/` | Rutas API |
| `apiCompuestos.js` | `/frontend/src/api/` | Cliente API |
| `UseCompuestos.js` | `/frontend/src/hooks/` | Custom hooks |
| `ProductosAlquilerPage.jsx` | `/frontend/src/pages/` | Página principal |
| Componentes UI | `/frontend/src/components/compuestos/` | Componentes React |

---

## 🗄️ FASE 1: BASE DE DATOS

### 1.1 Crear Script SQL Principal

**Archivo:** `/backend/sql/05_ELEMENTOS_COMPUESTOS.sql`

```sql
-- ============================================
-- SISTEMA DE ELEMENTOS COMPUESTOS
-- Productos de Alquiler (Carpas, Salas, etc.)
-- ============================================

-- 1. Tabla principal: elementos_compuestos
CREATE TABLE elementos_compuestos (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Identificación
    nombre VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    descripcion TEXT,

    -- Estado del compuesto
    estado ENUM(
        'disponible',
        'alquilado',
        'mantenimiento',
        'incompleto',
        'retirado'
    ) DEFAULT 'disponible',

    -- Ubicación actual
    ubicacion_id INT,

    -- Información comercial
    precio_alquiler DECIMAL(12,2),
    deposito DECIMAL(12,2),

    -- Categorización
    categoria_id INT,

    -- Metadatos
    imagen_url VARCHAR(500),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE SET NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,

    -- Índices
    INDEX idx_estado (estado),
    INDEX idx_ubicacion (ubicacion_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_codigo (codigo)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. Tabla de componentes: compuesto_componentes
CREATE TABLE compuesto_componentes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al compuesto padre
    compuesto_id INT NOT NULL,

    -- Tipo de componente
    tipo_componente ENUM('serie', 'lote') NOT NULL,

    -- Para componentes CON SERIE (tracking individual)
    serie_id INT,

    -- Para componentes POR LOTE (tracking por cantidad)
    elemento_id INT,
    cantidad INT DEFAULT 1,

    -- Configuración
    es_obligatorio BOOLEAN DEFAULT TRUE,

    -- Notas
    notas VARCHAR(255),

    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (serie_id) REFERENCES series(id) ON DELETE SET NULL,
    FOREIGN KEY (elemento_id) REFERENCES elementos(id) ON DELETE SET NULL,

    -- Índices
    INDEX idx_compuesto (compuesto_id),
    INDEX idx_serie (serie_id),
    INDEX idx_elemento (elemento_id),
    INDEX idx_tipo (tipo_componente)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. Modificar tabla series: agregar referencia a compuesto
ALTER TABLE series
ADD COLUMN compuesto_id INT DEFAULT NULL,
ADD FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE SET NULL,
ADD INDEX idx_compuesto (compuesto_id);


-- 4. Tabla de historial de alquileres
CREATE TABLE compuesto_alquileres (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al compuesto
    compuesto_id INT NOT NULL,

    -- Información del cliente
    cliente_nombre VARCHAR(200) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_email VARCHAR(100),
    cliente_documento VARCHAR(50),

    -- Información del evento
    evento_nombre VARCHAR(200),
    evento_direccion TEXT,
    evento_ciudad VARCHAR(100),

    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    fecha_devolucion DATE,

    -- Estado del alquiler
    estado ENUM('activo', 'devuelto', 'vencido', 'cancelado') DEFAULT 'activo',

    -- Información financiera
    precio_acordado DECIMAL(12,2),
    deposito_cobrado DECIMAL(12,2),
    deposito_devuelto DECIMAL(12,2),

    -- Notas
    notas_alquiler TEXT,
    notas_devolucion TEXT,

    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (compuesto_id) REFERENCES elementos_compuestos(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_compuesto (compuesto_id),
    INDEX idx_estado (estado),
    INDEX idx_fechas (fecha_inicio, fecha_fin_estimada),
    INDEX idx_cliente (cliente_nombre)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 5. Tabla de verificación de devolución (detalle por componente)
CREATE TABLE compuesto_devolucion_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Referencia al alquiler
    alquiler_id INT NOT NULL,

    -- Componente verificado
    componente_id INT NOT NULL,

    -- Estado reportado
    estado_devuelto ENUM('bueno', 'dañado', 'perdido') NOT NULL,

    -- Detalles
    notas TEXT,
    costo_reparacion DECIMAL(12,2),

    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (alquiler_id) REFERENCES compuesto_alquileres(id) ON DELETE CASCADE,
    FOREIGN KEY (componente_id) REFERENCES compuesto_componentes(id) ON DELETE CASCADE,

    -- Índices
    INDEX idx_alquiler (alquiler_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6. Datos de ejemplo (opcional)
INSERT INTO elementos_compuestos (nombre, codigo, descripcion, estado, precio_alquiler) VALUES
('Carpa 10x10 Premium #001', 'CARPA-10X10-001', 'Carpa blanca premium con tela náutica resistente al agua', 'disponible', 500000),
('Carpa 10x10 Premium #002', 'CARPA-10X10-002', 'Carpa blanca premium con tela náutica resistente al agua', 'disponible', 500000),
('Sala Lounge Elegance #001', 'SALA-ELEG-001', 'Sala lounge completa con sofás blancos y mesa de centro', 'disponible', 350000);
```

### 1.2 Ejecutar Migraciones

```bash
# Desde la carpeta backend
cd /home/user/aprendizaje-inventario-carpas/backend

# Ejecutar script SQL
mysql -u root -p inventario_carpas < sql/05_ELEMENTOS_COMPUESTOS.sql

# Verificar tablas creadas
mysql -u root -p -e "SHOW TABLES FROM inventario_carpas LIKE '%compuesto%';"
```

### 1.3 Verificación de Integridad

```sql
-- Verificar que las foreign keys están correctas
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'inventario_carpas'
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME LIKE '%compuesto%';
```

---

## ⚙️ FASE 2: BACKEND - MODELOS

### 2.1 Modelo ElementoCompuestoModel.js

**Archivo:** `/backend/models/ElementoCompuestoModel.js`

```javascript
const db = require('../config/database');

class ElementoCompuestoModel {

    // ============================================
    // CONSULTAS BÁSICAS (CRUD)
    // ============================================

    /**
     * Obtener todos los elementos compuestos
     */
    static async obtenerTodos(filtros = {}) {
        const { estado, categoria_id, limit = 50, offset = 0 } = filtros;

        let query = `
            SELECT
                ec.*,
                c.nombre as categoria_nombre,
                u.nombre as ubicacion_nombre,
                COUNT(cc.id) as total_componentes,
                (SELECT COUNT(*) FROM compuesto_componentes
                 WHERE compuesto_id = ec.id AND es_obligatorio = TRUE) as componentes_obligatorios
            FROM elementos_compuestos ec
            LEFT JOIN categorias c ON ec.categoria_id = c.id
            LEFT JOIN ubicaciones u ON ec.ubicacion_id = u.id
            LEFT JOIN compuesto_componentes cc ON ec.id = cc.compuesto_id
            WHERE 1=1
        `;

        const params = [];

        if (estado) {
            query += ` AND ec.estado = ?`;
            params.push(estado);
        }

        if (categoria_id) {
            query += ` AND ec.categoria_id = ?`;
            params.push(categoria_id);
        }

        query += ` GROUP BY ec.id ORDER BY ec.nombre LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows] = await db.execute(query, params);
        return rows;
    }

    /**
     * Obtener compuesto por ID con todos sus componentes
     */
    static async obtenerPorId(id) {
        // Obtener datos básicos del compuesto
        const [compuesto] = await db.execute(`
            SELECT
                ec.*,
                c.nombre as categoria_nombre,
                u.nombre as ubicacion_nombre
            FROM elementos_compuestos ec
            LEFT JOIN categorias c ON ec.categoria_id = c.id
            LEFT JOIN ubicaciones u ON ec.ubicacion_id = u.id
            WHERE ec.id = ?
        `, [id]);

        if (compuesto.length === 0) return null;

        // Obtener componentes
        const [componentes] = await db.execute(`
            SELECT
                cc.*,
                -- Datos de serie (si aplica)
                s.numero_serie,
                s.estado as serie_estado,
                s.ubicacion as serie_ubicacion,
                -- Datos de elemento
                e.nombre as elemento_nombre,
                e.requiere_series
            FROM compuesto_componentes cc
            LEFT JOIN series s ON cc.serie_id = s.id
            LEFT JOIN elementos e ON (cc.elemento_id = e.id OR s.id_elemento = e.id)
            WHERE cc.compuesto_id = ?
            ORDER BY cc.es_obligatorio DESC, e.nombre
        `, [id]);

        return {
            ...compuesto[0],
            componentes
        };
    }

    /**
     * Obtener compuestos disponibles para alquilar
     */
    static async obtenerDisponibles() {
        const [rows] = await db.execute(`
            SELECT
                ec.*,
                c.nombre as categoria_nombre,
                u.nombre as ubicacion_nombre,
                COUNT(cc.id) as total_componentes
            FROM elementos_compuestos ec
            LEFT JOIN categorias c ON ec.categoria_id = c.id
            LEFT JOIN ubicaciones u ON ec.ubicacion_id = u.id
            LEFT JOIN compuesto_componentes cc ON ec.id = cc.compuesto_id
            WHERE ec.estado = 'disponible'
            GROUP BY ec.id
            ORDER BY ec.nombre
        `);
        return rows;
    }

    /**
     * Crear nuevo elemento compuesto
     */
    static async crear(datos) {
        const {
            nombre,
            codigo,
            descripcion,
            ubicacion_id,
            precio_alquiler,
            deposito,
            categoria_id,
            imagen_url,
            notas
        } = datos;

        const [result] = await db.execute(`
            INSERT INTO elementos_compuestos
            (nombre, codigo, descripcion, ubicacion_id, precio_alquiler,
             deposito, categoria_id, imagen_url, notas, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible')
        `, [nombre, codigo, descripcion, ubicacion_id, precio_alquiler,
            deposito, categoria_id, imagen_url, notas]);

        return { id: result.insertId, ...datos };
    }

    /**
     * Actualizar elemento compuesto
     */
    static async actualizar(id, datos) {
        const campos = [];
        const valores = [];

        const camposPermitidos = [
            'nombre', 'codigo', 'descripcion', 'ubicacion_id',
            'precio_alquiler', 'deposito', 'categoria_id',
            'imagen_url', 'notas', 'estado'
        ];

        for (const campo of camposPermitidos) {
            if (datos[campo] !== undefined) {
                campos.push(`${campo} = ?`);
                valores.push(datos[campo]);
            }
        }

        if (campos.length === 0) return null;

        valores.push(id);

        await db.execute(
            `UPDATE elementos_compuestos SET ${campos.join(', ')} WHERE id = ?`,
            valores
        );

        return this.obtenerPorId(id);
    }

    /**
     * Eliminar elemento compuesto
     */
    static async eliminar(id) {
        // Primero liberar las series asignadas
        await db.execute(
            `UPDATE series SET compuesto_id = NULL WHERE compuesto_id = ?`,
            [id]
        );

        // Luego eliminar el compuesto (CASCADE eliminará componentes)
        const [result] = await db.execute(
            `DELETE FROM elementos_compuestos WHERE id = ?`,
            [id]
        );

        return result.affectedRows > 0;
    }

    // ============================================
    // VALIDACIÓN DE DISPONIBILIDAD (CRÍTICO)
    // ============================================

    /**
     * Validar que todos los componentes estén disponibles para alquilar
     * Esta es la función más importante del sistema
     */
    static async validarDisponibilidad(compuestoId) {
        const ESTADOS_DISPONIBLES = ['nuevo', 'bueno'];

        // Obtener todos los componentes
        const [componentes] = await db.execute(`
            SELECT
                cc.*,
                s.numero_serie,
                s.estado as serie_estado,
                e.nombre as elemento_nombre,
                e.id as elem_id
            FROM compuesto_componentes cc
            LEFT JOIN series s ON cc.serie_id = s.id
            LEFT JOIN elementos e ON (cc.elemento_id = e.id OR s.id_elemento = e.id)
            WHERE cc.compuesto_id = ?
        `, [compuestoId]);

        const problemas = [];
        const componentesOk = [];

        for (const comp of componentes) {
            if (comp.tipo_componente === 'serie') {
                // Validar serie individual
                if (!ESTADOS_DISPONIBLES.includes(comp.serie_estado)) {
                    problemas.push({
                        tipo: 'serie',
                        componente_id: comp.id,
                        numero_serie: comp.numero_serie,
                        elemento_nombre: comp.elemento_nombre,
                        problema: `Estado actual: ${comp.serie_estado}`,
                        estado_actual: comp.serie_estado,
                        es_obligatorio: comp.es_obligatorio
                    });
                } else {
                    componentesOk.push({
                        tipo: 'serie',
                        id: comp.serie_id,
                        numero_serie: comp.numero_serie,
                        elemento_nombre: comp.elemento_nombre,
                        estado: 'disponible'
                    });
                }
            } else if (comp.tipo_componente === 'lote') {
                // Validar stock disponible en lotes
                const [stockResult] = await db.execute(`
                    SELECT
                        COALESCE(SUM(CASE WHEN estado IN ('nuevo', 'bueno')
                                     THEN cantidad ELSE 0 END), 0) as disponible
                    FROM lotes
                    WHERE elemento_id = ?
                `, [comp.elemento_id]);

                const stockDisponible = stockResult[0].disponible;

                if (stockDisponible < comp.cantidad) {
                    problemas.push({
                        tipo: 'lote',
                        componente_id: comp.id,
                        elemento_nombre: comp.elemento_nombre,
                        problema: 'Stock insuficiente',
                        cantidad_requerida: comp.cantidad,
                        cantidad_disponible: stockDisponible,
                        cantidad_faltante: comp.cantidad - stockDisponible,
                        es_obligatorio: comp.es_obligatorio
                    });
                } else {
                    componentesOk.push({
                        tipo: 'lote',
                        id: comp.elemento_id,
                        elemento_nombre: comp.elemento_nombre,
                        cantidad_requerida: comp.cantidad,
                        cantidad_disponible: stockDisponible,
                        estado: 'disponible'
                    });
                }
            }
        }

        return {
            puede_alquilar: problemas.length === 0,
            problemas,
            componentes_ok: componentesOk,
            resumen: {
                total_componentes: componentes.length,
                componentes_disponibles: componentesOk.length,
                componentes_con_problema: problemas.length
            }
        };
    }

    // ============================================
    // OPERACIONES DE ALQUILER
    // ============================================

    /**
     * Alquilar elemento compuesto (con transacción)
     */
    static async alquilar(compuestoId, datosAlquiler) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Validar disponibilidad
            const validacion = await this.validarDisponibilidad(compuestoId);
            if (!validacion.puede_alquilar) {
                throw new Error('Componentes no disponibles');
            }

            // 2. Cambiar estado del compuesto
            await connection.execute(
                `UPDATE elementos_compuestos SET estado = 'alquilado', ubicacion_id = NULL WHERE id = ?`,
                [compuestoId]
            );

            // 3. Cambiar estado de series asignadas
            await connection.execute(
                `UPDATE series SET estado = 'alquilado', ubicacion = NULL WHERE compuesto_id = ?`,
                [compuestoId]
            );

            // 4. Obtener componentes por lote y mover cantidades
            const [componentesLote] = await connection.execute(
                `SELECT elemento_id, cantidad FROM compuesto_componentes
                 WHERE compuesto_id = ? AND tipo_componente = 'lote'`,
                [compuestoId]
            );

            for (const comp of componentesLote) {
                // Buscar lote disponible y mover cantidad
                const [lotes] = await connection.execute(
                    `SELECT id, cantidad FROM lotes
                     WHERE elemento_id = ? AND estado IN ('nuevo', 'bueno') AND cantidad >= ?
                     ORDER BY cantidad DESC LIMIT 1`,
                    [comp.elemento_id, comp.cantidad]
                );

                if (lotes.length > 0) {
                    const loteOrigen = lotes[0];

                    // Reducir cantidad del lote origen
                    await connection.execute(
                        `UPDATE lotes SET cantidad = cantidad - ? WHERE id = ?`,
                        [comp.cantidad, loteOrigen.id]
                    );

                    // Crear o actualizar lote "alquilado"
                    const [loteAlquilado] = await connection.execute(
                        `SELECT id FROM lotes WHERE elemento_id = ? AND estado = 'alquilado'`,
                        [comp.elemento_id]
                    );

                    if (loteAlquilado.length > 0) {
                        await connection.execute(
                            `UPDATE lotes SET cantidad = cantidad + ? WHERE id = ?`,
                            [comp.cantidad, loteAlquilado[0].id]
                        );
                    } else {
                        await connection.execute(
                            `INSERT INTO lotes (elemento_id, cantidad, estado, ubicacion)
                             VALUES (?, ?, 'alquilado', NULL)`,
                            [comp.elemento_id, comp.cantidad]
                        );
                    }
                }
            }

            // 5. Registrar alquiler
            const [alquilerResult] = await connection.execute(`
                INSERT INTO compuesto_alquileres
                (compuesto_id, cliente_nombre, cliente_telefono, cliente_email,
                 evento_nombre, evento_direccion, fecha_inicio, fecha_fin_estimada,
                 precio_acordado, deposito_cobrado, notas_alquiler)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                compuestoId,
                datosAlquiler.cliente_nombre,
                datosAlquiler.cliente_telefono,
                datosAlquiler.cliente_email,
                datosAlquiler.evento_nombre,
                datosAlquiler.evento_direccion,
                datosAlquiler.fecha_inicio,
                datosAlquiler.fecha_fin_estimada,
                datosAlquiler.precio_acordado,
                datosAlquiler.deposito_cobrado,
                datosAlquiler.notas
            ]);

            await connection.commit();

            return {
                success: true,
                alquiler_id: alquilerResult.insertId,
                compuesto_id: compuestoId
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Devolver elemento compuesto
     */
    static async devolver(compuestoId, datosDevolucion) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const { alquiler_id, componentes_verificados, ubicacion_destino_id } = datosDevolucion;

            let hayProblemas = false;

            // Procesar cada componente verificado
            for (const comp of componentes_verificados) {
                // Registrar detalle de devolución
                await connection.execute(`
                    INSERT INTO compuesto_devolucion_detalle
                    (alquiler_id, componente_id, estado_devuelto, notas, costo_reparacion)
                    VALUES (?, ?, ?, ?, ?)
                `, [alquiler_id, comp.componente_id, comp.estado, comp.notas, comp.costo_reparacion]);

                if (comp.estado !== 'bueno') {
                    hayProblemas = true;
                }
            }

            // Determinar nuevo estado del compuesto
            const nuevoEstado = hayProblemas ? 'mantenimiento' : 'disponible';

            // Actualizar compuesto
            await connection.execute(
                `UPDATE elementos_compuestos SET estado = ?, ubicacion_id = ? WHERE id = ?`,
                [nuevoEstado, ubicacion_destino_id, compuestoId]
            );

            // Actualizar series
            const estadoSeries = hayProblemas ? 'mantenimiento' : 'bueno';
            await connection.execute(
                `UPDATE series SET estado = ?, ubicacion_id = ? WHERE compuesto_id = ?`,
                [estadoSeries, ubicacion_destino_id, compuestoId]
            );

            // Devolver cantidades de lotes
            const [componentesLote] = await connection.execute(
                `SELECT elemento_id, cantidad FROM compuesto_componentes
                 WHERE compuesto_id = ? AND tipo_componente = 'lote'`,
                [compuestoId]
            );

            for (const comp of componentesLote) {
                // Reducir de lote "alquilado"
                await connection.execute(
                    `UPDATE lotes SET cantidad = cantidad - ?
                     WHERE elemento_id = ? AND estado = 'alquilado'`,
                    [comp.cantidad, comp.elemento_id]
                );

                // Agregar a lote disponible
                const estadoLote = hayProblemas ? 'mantenimiento' : 'bueno';
                const [loteDestino] = await connection.execute(
                    `SELECT id FROM lotes WHERE elemento_id = ? AND estado = ?`,
                    [comp.elemento_id, estadoLote]
                );

                if (loteDestino.length > 0) {
                    await connection.execute(
                        `UPDATE lotes SET cantidad = cantidad + ? WHERE id = ?`,
                        [comp.cantidad, loteDestino[0].id]
                    );
                } else {
                    await connection.execute(
                        `INSERT INTO lotes (elemento_id, cantidad, estado) VALUES (?, ?, ?)`,
                        [comp.elemento_id, comp.cantidad, estadoLote]
                    );
                }
            }

            // Actualizar alquiler
            await connection.execute(
                `UPDATE compuesto_alquileres
                 SET estado = 'devuelto', fecha_devolucion = CURDATE(), notas_devolucion = ?
                 WHERE id = ?`,
                [datosDevolucion.notas_devolucion, alquiler_id]
            );

            await connection.commit();

            return { success: true, nuevo_estado: nuevoEstado };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ============================================
    // GESTIÓN DE COMPONENTES
    // ============================================

    /**
     * Agregar componente a un compuesto
     */
    static async agregarComponente(compuestoId, datosComponente) {
        const { tipo_componente, serie_id, elemento_id, cantidad, es_obligatorio, notas } = datosComponente;

        // Si es serie, verificar que no esté asignada a otro compuesto
        if (tipo_componente === 'serie' && serie_id) {
            const [serie] = await db.execute(
                `SELECT compuesto_id FROM series WHERE id = ?`,
                [serie_id]
            );

            if (serie[0]?.compuesto_id) {
                throw new Error('Esta serie ya está asignada a otro elemento compuesto');
            }

            // Marcar serie como asignada
            await db.execute(
                `UPDATE series SET compuesto_id = ? WHERE id = ?`,
                [compuestoId, serie_id]
            );
        }

        // Insertar componente
        const [result] = await db.execute(`
            INSERT INTO compuesto_componentes
            (compuesto_id, tipo_componente, serie_id, elemento_id, cantidad, es_obligatorio, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [compuestoId, tipo_componente, serie_id, elemento_id, cantidad || 1, es_obligatorio ?? true, notas]);

        return { id: result.insertId, ...datosComponente };
    }

    /**
     * Remover componente de un compuesto
     */
    static async removerComponente(componenteId) {
        // Obtener datos del componente
        const [comp] = await db.execute(
            `SELECT * FROM compuesto_componentes WHERE id = ?`,
            [componenteId]
        );

        if (comp.length === 0) return false;

        // Si es serie, liberarla
        if (comp[0].serie_id) {
            await db.execute(
                `UPDATE series SET compuesto_id = NULL WHERE id = ?`,
                [comp[0].serie_id]
            );
        }

        // Eliminar componente
        const [result] = await db.execute(
            `DELETE FROM compuesto_componentes WHERE id = ?`,
            [componenteId]
        );

        return result.affectedRows > 0;
    }

    /**
     * Obtener series disponibles para asignar
     */
    static async obtenerSeriesDisponibles(elementoId = null) {
        let query = `
            SELECT
                s.id,
                s.numero_serie,
                s.estado,
                s.ubicacion,
                e.nombre as elemento_nombre,
                e.id as elemento_id
            FROM series s
            INNER JOIN elementos e ON s.id_elemento = e.id
            WHERE s.compuesto_id IS NULL
            AND s.estado IN ('nuevo', 'bueno')
        `;

        const params = [];

        if (elementoId) {
            query += ` AND s.id_elemento = ?`;
            params.push(elementoId);
        }

        query += ` ORDER BY e.nombre, s.numero_serie`;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    /**
     * Obtener historial de alquileres de un compuesto
     */
    static async obtenerHistorialAlquileres(compuestoId) {
        const [rows] = await db.execute(`
            SELECT *
            FROM compuesto_alquileres
            WHERE compuesto_id = ?
            ORDER BY created_at DESC
        `, [compuestoId]);
        return rows;
    }
}

module.exports = ElementoCompuestoModel;
```

### 2.2 Controlador compuestoController.js

**Archivo:** `/backend/controllers/compuestoController.js`

```javascript
const ElementoCompuestoModel = require('../models/ElementoCompuestoModel');
const { AppError } = require('../utils/errorHandler');

const compuestoController = {

    // ============================================
    // CRUD BÁSICO
    // ============================================

    async obtenerTodos(req, res) {
        try {
            const filtros = {
                estado: req.query.estado,
                categoria_id: req.query.categoria_id,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0
            };

            const compuestos = await ElementoCompuestoModel.obtenerTodos(filtros);

            res.json({
                success: true,
                data: compuestos,
                total: compuestos.length
            });
        } catch (error) {
            console.error('Error al obtener compuestos:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener elementos compuestos',
                error: error.message
            });
        }
    },

    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const compuesto = await ElementoCompuestoModel.obtenerPorId(id);

            if (!compuesto) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Elemento compuesto no encontrado'
                });
            }

            res.json({
                success: true,
                data: compuesto
            });
        } catch (error) {
            console.error('Error al obtener compuesto:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener elemento compuesto',
                error: error.message
            });
        }
    },

    async obtenerDisponibles(req, res) {
        try {
            const compuestos = await ElementoCompuestoModel.obtenerDisponibles();

            res.json({
                success: true,
                data: compuestos,
                total: compuestos.length
            });
        } catch (error) {
            console.error('Error al obtener disponibles:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener compuestos disponibles',
                error: error.message
            });
        }
    },

    async crear(req, res) {
        try {
            const datos = req.body;

            // Validaciones básicas
            if (!datos.nombre) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El nombre es requerido'
                });
            }

            const nuevoCompuesto = await ElementoCompuestoModel.crear(datos);

            res.status(201).json({
                success: true,
                mensaje: 'Elemento compuesto creado exitosamente',
                data: nuevoCompuesto
            });
        } catch (error) {
            console.error('Error al crear compuesto:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al crear elemento compuesto',
                error: error.message
            });
        }
    },

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datos = req.body;

            const compuestoActualizado = await ElementoCompuestoModel.actualizar(id, datos);

            if (!compuestoActualizado) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Elemento compuesto no encontrado'
                });
            }

            res.json({
                success: true,
                mensaje: 'Elemento compuesto actualizado',
                data: compuestoActualizado
            });
        } catch (error) {
            console.error('Error al actualizar compuesto:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al actualizar elemento compuesto',
                error: error.message
            });
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar que no esté alquilado
            const compuesto = await ElementoCompuestoModel.obtenerPorId(id);
            if (compuesto?.estado === 'alquilado') {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se puede eliminar un elemento que está alquilado'
                });
            }

            const eliminado = await ElementoCompuestoModel.eliminar(id);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Elemento compuesto no encontrado'
                });
            }

            res.json({
                success: true,
                mensaje: 'Elemento compuesto eliminado'
            });
        } catch (error) {
            console.error('Error al eliminar compuesto:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al eliminar elemento compuesto',
                error: error.message
            });
        }
    },

    // ============================================
    // VALIDACIÓN Y ALQUILER
    // ============================================

    async validarDisponibilidad(req, res) {
        try {
            const { id } = req.params;

            const validacion = await ElementoCompuestoModel.validarDisponibilidad(id);

            res.json({
                success: true,
                data: validacion
            });
        } catch (error) {
            console.error('Error al validar disponibilidad:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al validar disponibilidad',
                error: error.message
            });
        }
    },

    async alquilar(req, res) {
        try {
            const { id } = req.params;
            const datosAlquiler = req.body;

            // Validaciones
            if (!datosAlquiler.cliente_nombre) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El nombre del cliente es requerido'
                });
            }

            if (!datosAlquiler.fecha_inicio || !datosAlquiler.fecha_fin_estimada) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Las fechas de inicio y fin son requeridas'
                });
            }

            // Verificar estado del compuesto
            const compuesto = await ElementoCompuestoModel.obtenerPorId(id);
            if (!compuesto) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Elemento compuesto no encontrado'
                });
            }

            if (compuesto.estado !== 'disponible') {
                return res.status(400).json({
                    success: false,
                    mensaje: `No se puede alquilar: estado actual es "${compuesto.estado}"`
                });
            }

            // Validar disponibilidad de componentes
            const validacion = await ElementoCompuestoModel.validarDisponibilidad(id);

            if (!validacion.puede_alquilar) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se puede alquilar: hay componentes no disponibles',
                    validacion
                });
            }

            // Proceder con el alquiler
            const resultado = await ElementoCompuestoModel.alquilar(id, datosAlquiler);

            res.json({
                success: true,
                mensaje: 'Alquiler realizado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error al alquilar:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al procesar el alquiler',
                error: error.message
            });
        }
    },

    async devolver(req, res) {
        try {
            const { id } = req.params;
            const datosDevolucion = req.body;

            if (!datosDevolucion.alquiler_id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El ID del alquiler es requerido'
                });
            }

            const resultado = await ElementoCompuestoModel.devolver(id, datosDevolucion);

            res.json({
                success: true,
                mensaje: 'Devolución registrada exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error al devolver:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al procesar la devolución',
                error: error.message
            });
        }
    },

    // ============================================
    // GESTIÓN DE COMPONENTES
    // ============================================

    async agregarComponente(req, res) {
        try {
            const { id } = req.params;
            const datosComponente = req.body;

            // Validar tipo de componente
            if (!['serie', 'lote'].includes(datosComponente.tipo_componente)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Tipo de componente inválido. Debe ser "serie" o "lote"'
                });
            }

            const componente = await ElementoCompuestoModel.agregarComponente(id, datosComponente);

            res.status(201).json({
                success: true,
                mensaje: 'Componente agregado exitosamente',
                data: componente
            });
        } catch (error) {
            console.error('Error al agregar componente:', error);
            res.status(400).json({
                success: false,
                mensaje: error.message
            });
        }
    },

    async removerComponente(req, res) {
        try {
            const { componenteId } = req.params;

            const eliminado = await ElementoCompuestoModel.removerComponente(componenteId);

            if (!eliminado) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Componente no encontrado'
                });
            }

            res.json({
                success: true,
                mensaje: 'Componente removido exitosamente'
            });
        } catch (error) {
            console.error('Error al remover componente:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al remover componente',
                error: error.message
            });
        }
    },

    async obtenerSeriesDisponibles(req, res) {
        try {
            const { elementoId } = req.query;

            const series = await ElementoCompuestoModel.obtenerSeriesDisponibles(elementoId);

            res.json({
                success: true,
                data: series,
                total: series.length
            });
        } catch (error) {
            console.error('Error al obtener series disponibles:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener series disponibles',
                error: error.message
            });
        }
    },

    async obtenerHistorialAlquileres(req, res) {
        try {
            const { id } = req.params;

            const historial = await ElementoCompuestoModel.obtenerHistorialAlquileres(id);

            res.json({
                success: true,
                data: historial,
                total: historial.length
            });
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener historial de alquileres',
                error: error.message
            });
        }
    }
};

module.exports = compuestoController;
```

---

## 🛤️ FASE 3: BACKEND - RUTAS

### 3.1 Archivo de Rutas

**Archivo:** `/backend/routes/compuestos.js`

```javascript
const express = require('express');
const router = express.Router();
const compuestoController = require('../controllers/compuestoController');

// ============================================
// RUTAS CRUD BÁSICO
// ============================================

// GET /api/compuestos - Obtener todos
router.get('/', compuestoController.obtenerTodos);

// GET /api/compuestos/disponibles - Obtener disponibles para alquilar
router.get('/disponibles', compuestoController.obtenerDisponibles);

// GET /api/compuestos/series-disponibles - Series sin asignar
router.get('/series-disponibles', compuestoController.obtenerSeriesDisponibles);

// GET /api/compuestos/:id - Obtener por ID con componentes
router.get('/:id', compuestoController.obtenerPorId);

// GET /api/compuestos/:id/validar - Validar disponibilidad de componentes
router.get('/:id/validar', compuestoController.validarDisponibilidad);

// GET /api/compuestos/:id/historial - Historial de alquileres
router.get('/:id/historial', compuestoController.obtenerHistorialAlquileres);

// POST /api/compuestos - Crear nuevo
router.post('/', compuestoController.crear);

// PUT /api/compuestos/:id - Actualizar
router.put('/:id', compuestoController.actualizar);

// DELETE /api/compuestos/:id - Eliminar
router.delete('/:id', compuestoController.eliminar);

// ============================================
// RUTAS DE ALQUILER
// ============================================

// POST /api/compuestos/:id/alquilar - Alquilar compuesto
router.post('/:id/alquilar', compuestoController.alquilar);

// POST /api/compuestos/:id/devolver - Devolver compuesto
router.post('/:id/devolver', compuestoController.devolver);

// ============================================
// RUTAS DE COMPONENTES
// ============================================

// POST /api/compuestos/:id/componentes - Agregar componente
router.post('/:id/componentes', compuestoController.agregarComponente);

// DELETE /api/compuestos/componentes/:componenteId - Remover componente
router.delete('/componentes/:componenteId', compuestoController.removerComponente);

module.exports = router;
```

### 3.2 Registrar Rutas en server.js

Agregar en `/backend/server.js`:

```javascript
// ... imports existentes ...
const compuestosRouter = require('./routes/compuestos');

// ... configuración existente ...

// Rutas
app.use('/api/compuestos', compuestosRouter);
```

---

## 🖥️ FASE 4: FRONTEND - API Y HOOKS

### 4.1 Cliente API

**Archivo:** `/inventario-frontend/src/api/apiCompuestos.js`

```javascript
import axiosInstance from './Axios.config';

const API_URL = '/compuestos';

export const compuestosAPI = {

    // CRUD Básico
    obtenerTodos: async (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
        if (filtros.limit) params.append('limit', filtros.limit);
        if (filtros.offset) params.append('offset', filtros.offset);

        const response = await axiosInstance.get(`${API_URL}?${params}`);
        return response.data;
    },

    obtenerPorId: async (id) => {
        const response = await axiosInstance.get(`${API_URL}/${id}`);
        return response.data;
    },

    obtenerDisponibles: async () => {
        const response = await axiosInstance.get(`${API_URL}/disponibles`);
        return response.data;
    },

    crear: async (datos) => {
        const response = await axiosInstance.post(API_URL, datos);
        return response.data;
    },

    actualizar: async (id, datos) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, datos);
        return response.data;
    },

    eliminar: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Validación y Alquiler
    validarDisponibilidad: async (id) => {
        const response = await axiosInstance.get(`${API_URL}/${id}/validar`);
        return response.data;
    },

    alquilar: async (id, datosAlquiler) => {
        const response = await axiosInstance.post(`${API_URL}/${id}/alquilar`, datosAlquiler);
        return response.data;
    },

    devolver: async (id, datosDevolucion) => {
        const response = await axiosInstance.post(`${API_URL}/${id}/devolver`, datosDevolucion);
        return response.data;
    },

    // Componentes
    agregarComponente: async (compuestoId, datosComponente) => {
        const response = await axiosInstance.post(
            `${API_URL}/${compuestoId}/componentes`,
            datosComponente
        );
        return response.data;
    },

    removerComponente: async (componenteId) => {
        const response = await axiosInstance.delete(`${API_URL}/componentes/${componenteId}`);
        return response.data;
    },

    obtenerSeriesDisponibles: async (elementoId = null) => {
        const params = elementoId ? `?elementoId=${elementoId}` : '';
        const response = await axiosInstance.get(`${API_URL}/series-disponibles${params}`);
        return response.data;
    },

    obtenerHistorialAlquileres: async (compuestoId) => {
        const response = await axiosInstance.get(`${API_URL}/${compuestoId}/historial`);
        return response.data;
    }
};

export default compuestosAPI;
```

### 4.2 Custom Hook

**Archivo:** `/inventario-frontend/src/hooks/UseCompuestos.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compuestosAPI } from '../api/apiCompuestos';

// ============================================
// QUERIES (Lectura)
// ============================================

export const useGetCompuestos = (filtros = {}) => {
    return useQuery({
        queryKey: ['compuestos', filtros],
        queryFn: () => compuestosAPI.obtenerTodos(filtros),
        staleTime: 1000 * 60 * 2, // 2 minutos
    });
};

export const useGetCompuesto = (id) => {
    return useQuery({
        queryKey: ['compuesto', id],
        queryFn: () => compuestosAPI.obtenerPorId(id),
        enabled: !!id,
    });
};

export const useGetCompuestosDisponibles = () => {
    return useQuery({
        queryKey: ['compuestos', 'disponibles'],
        queryFn: () => compuestosAPI.obtenerDisponibles(),
        staleTime: 1000 * 60, // 1 minuto
    });
};

export const useValidarDisponibilidad = (id) => {
    return useQuery({
        queryKey: ['compuesto', 'validar', id],
        queryFn: () => compuestosAPI.validarDisponibilidad(id),
        enabled: !!id,
        refetchOnWindowFocus: true,
    });
};

export const useGetSeriesDisponibles = (elementoId = null) => {
    return useQuery({
        queryKey: ['series', 'disponibles', elementoId],
        queryFn: () => compuestosAPI.obtenerSeriesDisponibles(elementoId),
        staleTime: 1000 * 30, // 30 segundos
    });
};

export const useGetHistorialAlquileres = (compuestoId) => {
    return useQuery({
        queryKey: ['compuesto', 'historial', compuestoId],
        queryFn: () => compuestosAPI.obtenerHistorialAlquileres(compuestoId),
        enabled: !!compuestoId,
    });
};

// ============================================
// MUTATIONS (Escritura)
// ============================================

export const useCreateCompuesto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (datos) => compuestosAPI.crear(datos),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
        },
    });
};

export const useUpdateCompuesto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, datos }) => compuestosAPI.actualizar(id, datos),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
            queryClient.invalidateQueries({ queryKey: ['compuesto', variables.id] });
        },
    });
};

export const useDeleteCompuesto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => compuestosAPI.eliminar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
        },
    });
};

export const useAlquilarCompuesto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, datosAlquiler }) => compuestosAPI.alquilar(id, datosAlquiler),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
            queryClient.invalidateQueries({ queryKey: ['compuesto', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['series'] });
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
        },
    });
};

export const useDevolverCompuesto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, datosDevolucion }) => compuestosAPI.devolver(id, datosDevolucion),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
            queryClient.invalidateQueries({ queryKey: ['compuesto', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['series'] });
            queryClient.invalidateQueries({ queryKey: ['lotes'] });
        },
    });
};

export const useAgregarComponente = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ compuestoId, datosComponente }) =>
            compuestosAPI.agregarComponente(compuestoId, datosComponente),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['compuesto', variables.compuestoId] });
            queryClient.invalidateQueries({ queryKey: ['series', 'disponibles'] });
        },
    });
};

export const useRemoverComponente = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (componenteId) => compuestosAPI.removerComponente(componenteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['compuestos'] });
            queryClient.invalidateQueries({ queryKey: ['compuesto'] });
            queryClient.invalidateQueries({ queryKey: ['series', 'disponibles'] });
        },
    });
};
```

---

## 🎨 FASE 5: FRONTEND - COMPONENTES UI

### 5.1 Estructura de Componentes

```
/inventario-frontend/src/
├── pages/
│   └── ProductosAlquilerPage.jsx    (página principal)
│
├── components/
│   └── compuestos/
│       ├── CompuestoCard.jsx         (tarjeta de producto)
│       ├── CompuestoFormModal.jsx    (crear/editar)
│       ├── SelectorComponentes.jsx   (agregar componentes)
│       ├── AlquilarModal.jsx         (formulario alquiler)
│       ├── DevolverModal.jsx         (verificar devolución)
│       ├── ComponenteItem.jsx        (item de componente)
│       ├── ValidacionBanner.jsx      (mostrar problemas)
│       └── HistorialAlquileres.jsx   (historial)
```

### 5.2 Página Principal (ProductosAlquilerPage.jsx)

```jsx
import { useState } from 'react';
import { Plus, Package, Filter } from 'lucide-react';
import { useGetCompuestos } from '../hooks/UseCompuestos';
import CompuestoCard from '../components/compuestos/CompuestoCard';
import CompuestoFormModal from '../components/compuestos/CompuestoFormModal';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

export default function ProductosAlquilerPage() {
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalCrear, setModalCrear] = useState(false);

    const { data, isLoading, error } = useGetCompuestos({ estado: filtroEstado });

    const compuestos = data?.data || [];

    if (isLoading) return <Spinner />;
    if (error) return <div className="text-red-500">Error: {error.message}</div>;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-7 h-7" />
                        Productos de Alquiler
                    </h1>
                    <p className="text-gray-600">
                        Gestiona carpas, salas y otros productos compuestos
                    </p>
                </div>

                <Button onClick={() => setModalCrear(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Producto
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-6">
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="">Todos los estados</option>
                    <option value="disponible">Disponibles</option>
                    <option value="alquilado">Alquilados</option>
                    <option value="mantenimiento">En Mantenimiento</option>
                    <option value="incompleto">Incompletos</option>
                </select>
            </div>

            {/* Grid de Productos */}
            {compuestos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay productos registrados</p>
                    <Button onClick={() => setModalCrear(true)} className="mt-4">
                        Crear primer producto
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {compuestos.map((compuesto) => (
                        <CompuestoCard
                            key={compuesto.id}
                            compuesto={compuesto}
                        />
                    ))}
                </div>
            )}

            {/* Modal Crear */}
            {modalCrear && (
                <CompuestoFormModal
                    onClose={() => setModalCrear(false)}
                />
            )}
        </div>
    );
}
```

### 5.3 Tarjeta de Producto (CompuestoCard.jsx)

```jsx
import { useState } from 'react';
import { Package, MapPin, DollarSign, Edit, Trash2, ShoppingCart, RotateCcw, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import AlquilarModal from './AlquilarModal';
import DevolverModal from './DevolverModal';
import { useDeleteCompuesto, useValidarDisponibilidad } from '../../hooks/UseCompuestos';

const estadoConfig = {
    disponible: { color: 'green', label: 'Disponible' },
    alquilado: { color: 'blue', label: 'Alquilado' },
    mantenimiento: { color: 'yellow', label: 'Mantenimiento' },
    incompleto: { color: 'red', label: 'Incompleto' },
    retirado: { color: 'gray', label: 'Retirado' }
};

export default function CompuestoCard({ compuesto }) {
    const [modalAlquilar, setModalAlquilar] = useState(false);
    const [modalDevolver, setModalDevolver] = useState(false);

    const deleteMutation = useDeleteCompuesto();
    const { data: validacion } = useValidarDisponibilidad(
        compuesto.estado === 'disponible' ? compuesto.id : null
    );

    const estadoInfo = estadoConfig[compuesto.estado] || estadoConfig.disponible;
    const tieneProblemas = validacion?.data?.problemas?.length > 0;

    const handleEliminar = async () => {
        if (confirm('¿Está seguro de eliminar este producto?')) {
            await deleteMutation.mutateAsync(compuesto.id);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border p-4 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg">{compuesto.nombre}</h3>
                    <p className="text-sm text-gray-500">{compuesto.codigo}</p>
                </div>
                <Badge color={estadoInfo.color}>{estadoInfo.label}</Badge>
            </div>

            {/* Alerta de problemas */}
            {tieneProblemas && compuesto.estado === 'disponible' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 flex items-center gap-2 text-sm text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Algunos componentes no están disponibles</span>
                </div>
            )}

            {/* Info */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
                {compuesto.ubicacion_nombre && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {compuesto.ubicacion_nombre}
                    </div>
                )}

                {compuesto.precio_alquiler && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        ${Number(compuesto.precio_alquiler).toLocaleString()}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {compuesto.total_componentes || 0} componentes
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-3 border-t">
                {compuesto.estado === 'disponible' && (
                    <Button
                        size="sm"
                        onClick={() => setModalAlquilar(true)}
                        disabled={tieneProblemas}
                    >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Alquilar
                    </Button>
                )}

                {compuesto.estado === 'alquilado' && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setModalDevolver(true)}
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Devolver
                    </Button>
                )}

                <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEliminar}
                    disabled={compuesto.estado === 'alquilado'}
                >
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
            </div>

            {/* Modales */}
            {modalAlquilar && (
                <AlquilarModal
                    compuesto={compuesto}
                    onClose={() => setModalAlquilar(false)}
                />
            )}

            {modalDevolver && (
                <DevolverModal
                    compuesto={compuesto}
                    onClose={() => setModalDevolver(false)}
                />
            )}
        </div>
    );
}
```

### 5.4 Actualizar Navegación

Agregar en el componente de navegación principal:

```jsx
// En el header o sidebar
<NavLink to="/productos-alquiler">
    <Package className="w-5 h-5" />
    Productos de Alquiler
</NavLink>
```

Agregar ruta en `App.jsx` o router:

```jsx
import ProductosAlquilerPage from './pages/ProductosAlquilerPage';

// En las rutas:
<Route path="/productos-alquiler" element={<ProductosAlquilerPage />} />
```

---

## ✅ FASE 6: TESTING Y VERIFICACIÓN

### 6.1 Tests de Backend (Manual/Postman)

```bash
# 1. Crear compuesto
POST /api/compuestos
{
    "nombre": "Carpa 10x10 Test #001",
    "codigo": "CARPA-TEST-001",
    "precio_alquiler": 500000
}

# 2. Agregar componente (serie)
POST /api/compuestos/1/componentes
{
    "tipo_componente": "serie",
    "serie_id": 1,
    "es_obligatorio": true
}

# 3. Agregar componente (lote)
POST /api/compuestos/1/componentes
{
    "tipo_componente": "lote",
    "elemento_id": 5,
    "cantidad": 8,
    "es_obligatorio": true
}

# 4. Validar disponibilidad
GET /api/compuestos/1/validar

# 5. Alquilar
POST /api/compuestos/1/alquilar
{
    "cliente_nombre": "Juan Pérez",
    "cliente_telefono": "3001234567",
    "fecha_inicio": "2024-12-20",
    "fecha_fin_estimada": "2024-12-22",
    "evento_nombre": "Boda"
}

# 6. Verificar cambio de estados
GET /api/compuestos/1
GET /api/series/1
GET /api/lotes/elemento/5
```

### 6.2 Checklist de Verificación

- [ ] Tablas SQL creadas correctamente
- [ ] Foreign keys funcionando
- [ ] Endpoint CRUD compuestos funciona
- [ ] Agregar/remover componentes funciona
- [ ] Validación de disponibilidad funciona
- [ ] Alquiler sincroniza todos los componentes
- [ ] Devolución restaura estados
- [ ] Frontend muestra lista de productos
- [ ] Formulario de creación funciona
- [ ] Modal de alquiler funciona
- [ ] Modal de devolución funciona
- [ ] Navegación entre módulos funciona

---

## 📅 CRONOGRAMA SUGERIDO

| Fase | Tareas | Estimación |
|------|--------|------------|
| **Fase 0** | Verificar tablas existentes | 1-2 horas |
| **Fase 1** | Base de datos | 2-3 horas |
| **Fase 2** | Modelos backend | 4-5 horas |
| **Fase 3** | Controlador y rutas | 3-4 horas |
| **Fase 4** | API y hooks frontend | 2-3 horas |
| **Fase 5** | Componentes UI | 6-8 horas |
| **Fase 6** | Testing y refinamiento | 3-4 horas |
| **TOTAL** | | **21-29 horas** |

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Confirmar** que este plan se ajusta a las expectativas
2. **Decidir** si comenzamos con la Fase 0 (verificación de tablas)
3. **Revisar** si hay ajustes necesarios al modelo de datos
4. **Iniciar** implementación secuencial o por módulos

---

**¿Deseas que comencemos con la implementación de alguna fase específica?**
