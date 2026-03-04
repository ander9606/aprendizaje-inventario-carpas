"""
Genera 10 archivos Excel individuales con el formato oficial SENA GFPI-F-147
(Bitácora de seguimiento Etapa productiva), usando el contenido de las
bitácoras markdown del proyecto.
"""
import os
import re
from datetime import datetime
from copy import copy

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

BITACORAS_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Datos generales del aprendiz y empresa ───────────────────────────────────
DATOS = {
    "empresa": "CARPAS VENTO SAS",
    "nit": 900672365,
    "jefe_nombre": "Camila Gomez",
    "jefe_telefono": 3112513220,
    "jefe_correo": "camila@ventotents.com",
    "modalidad": "VÍNCULO LABORAL O CONTRACTUAL",
    "aprendiz_nombre": "Jhon Anderson Moreno Rodriguez",
    "aprendiz_doc": 1078371141,
    "aprendiz_tel": 3204143661,
    "aprendiz_correo": "anderson960616@gmail.com",
    "ficha": 2879689,
    "programa": "ANALISIS Y DESARROLLO DE SOFTWARE",
    "regional": "REGIONAL DISTRITO CAPITAL",
    "centro": "Centro de servicios financieros",
}

# ─── Períodos y contenido de cada bitácora ────────────────────────────────────
# Cada entrada: (numero, fecha_inicio, fecha_fin, fecha_entrega, actividades)
# actividades: lista de dicts con descripcion, fecha_inicio, fecha_fin, evidencia, observaciones

BITACORAS_DATA = [
    {
        "numero": 1,
        "periodo": "04/10/2025 - 17/10/2025",
        "fecha_entrega": datetime(2025, 10, 17),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 1-2: INVESTIGACIÓN INICIAL Y ANÁLISIS DEL DOMINIO\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Investigación de antecedentes: Se revisaron sistemas de gestión de inventario "
                    "existentes en el mercado, incluyendo soluciones SaaS como Sortly, inFlow Inventory "
                    "y Zoho Inventory, identificando fortalezas y limitaciones para el contexto de "
                    "alquiler de carpas y eventos.\n\n"
                    "2. Análisis del dominio del negocio: Se realizaron reuniones con el negocio de "
                    "alquiler de carpas para comprender el flujo operativo completo: recepción de "
                    "pedidos, cotización, despacho, montaje, desmontaje y retorno al inventario.\n\n"
                    "3. Identificación del problema: Se documentó que el negocio actualmente maneja "
                    "el inventario de manera manual (hojas de cálculo y registros en papel), lo que "
                    "genera errores en la disponibilidad de productos, pérdida de elementos y "
                    "dificultad para cotizar eventos.\n\n"
                    "4. Revisión de literatura: Se consultaron artículos académicos sobre sistemas de "
                    "gestión de inventario, metodologías ágiles de desarrollo de software y "
                    "arquitecturas de aplicaciones web modernas."
                ),
                "fecha_inicio": datetime(2025, 10, 4),
                "fecha_fin": datetime(2025, 10, 17),
                "evidencia": (
                    "- Documento de antecedentes con 5 sistemas analizados y sus "
                    "características principales\n"
                    "- Mapa del flujo operativo del negocio de alquiler de carpas\n"
                    "- Identificación clara de los problemas que el sistema debe resolver: "
                    "control de stock, trazabilidad por series/lotes, cotizaciones y "
                    "seguimiento de operaciones"
                ),
                "observaciones": (
                    "DIFICULTAD PRINCIPAL: La información sobre sistemas especializados "
                    "en alquiler de carpas/eventos es limitada, ya que la mayoría de los "
                    "sistemas de inventario están orientados a retail o manufactura.\n\n"
                    "SOLUCIÓN: Se amplió la investigación a sistemas ERP genéricos y se "
                    "extrajeron patrones aplicables al negocio de alquiler.\n\n"
                    "APRENDIZAJE: El flujo operativo del negocio tiene variaciones según "
                    "el tipo de evento, lo que añade complejidad al modelado."
                ),
            }
        ],
    },
    {
        "numero": 2,
        "periodo": "18/10/2025 - 31/10/2025",
        "fecha_entrega": datetime(2025, 10, 31),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 3-4: LEVANTAMIENTO DE REQUISITOS Y CASOS DE USO\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Levantamiento de requisitos funcionales: Se definieron los módulos "
                    "principales del sistema:\n"
                    "   - Módulo de Inventario: gestión de elementos individuales, series y lotes\n"
                    "   - Módulo de Productos: categorías jerárquicas y elementos compuestos (plantillas)\n"
                    "   - Módulo de Alquileres: cotizaciones, eventos y control de disponibilidad\n"
                    "   - Módulo de Operaciones: flujos de montaje, desmontaje y checklist\n"
                    "   - Módulo de Configuración: ubicaciones, ciudades y tarifas de transporte\n\n"
                    "2. Definición de requisitos no funcionales: Se establecieron requisitos de "
                    "rendimiento (respuesta < 2s), usabilidad (diseño responsive), seguridad "
                    "y escalabilidad.\n\n"
                    "3. Elaboración de casos de uso: Se diseñaron los diagramas de casos de uso "
                    "para cada módulo, identificando actores principales (administrador, operario) "
                    "y flujos alternativos.\n\n"
                    "4. Selección de metodología: Se decidió utilizar una metodología ágil basada "
                    "en iteraciones cortas, priorizando la entrega incremental de funcionalidades."
                ),
                "fecha_inicio": datetime(2025, 10, 18),
                "fecha_fin": datetime(2025, 10, 31),
                "evidencia": (
                    "- Documento de especificación de requisitos con 25 requisitos "
                    "funcionales y 8 no funcionales\n"
                    "- 5 diagramas de casos de uso (uno por módulo)\n"
                    "- Priorización de módulos: primero Inventario, luego Productos, "
                    "Alquileres, Operaciones y Configuración"
                ),
                "observaciones": (
                    "DIFICULTAD PRINCIPAL: Definir el nivel de granularidad del seguimiento "
                    "de inventario (por unidad individual vs. por lote) fue complejo, ya que "
                    "algunos elementos como sillas se manejan por lote y otros como carpas "
                    "necesitan seguimiento individual por serie.\n\n"
                    "SOLUCIÓN: Investigué sobre sistemas ERP y de inventario. Decidí crear un "
                    "campo \"tipo_gestion\" que puede ser \"serie\" o \"lote\", permitiendo "
                    "gestionar ambos tipos en un mismo sistema.\n\n"
                    "APRENDIZAJE: La relación entre elementos compuestos (una carpa \"completa\" "
                    "incluye estructura + lona + amarres) requirió un modelado más detallado."
                ),
            }
        ],
    },
    {
        "numero": 3,
        "periodo": "01/11/2025 - 14/11/2025",
        "fecha_entrega": datetime(2025, 11, 14),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 5-6: DISEÑO DE ARQUITECTURA Y BASE DE DATOS\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Diseño de la arquitectura: Se definió una arquitectura cliente-servidor con:\n"
                    "   - Frontend: Aplicación de página única (SPA) con React.js\n"
                    "   - Backend: API REST con Node.js y Express\n"
                    "   - Base de datos: MySQL para almacenamiento relacional\n"
                    "   - Comunicación: API RESTful con JSON\n\n"
                    "2. Selección del stack tecnológico:\n"
                    "   - Frontend: React 18, Vite, TailwindCSS, React Query (TanStack Query), React Router\n"
                    "   - Backend: Node.js, Express, MySQL2 (driver nativo)\n"
                    "   - Herramientas: Git/GitHub para control de versiones, ESLint para calidad de código\n\n"
                    "3. Diseño del modelo de base de datos: Se diseñaron las tablas principales:\n"
                    "   - categorias: Categorías jerárquicas de productos con soporte de iconos\n"
                    "   - elementos: Elementos individuales del inventario con cantidad y estado\n"
                    "   - series: Seguimiento individual de unidades con número de serie y ubicación\n"
                    "   - lotes: Agrupación de elementos por cantidad y ubicación\n"
                    "   - ubicaciones: Ubicaciones físicas (bodega principal, eventos, etc.)\n"
                    "   - elementos_compuestos: Plantillas de productos compuestos con componentes\n\n"
                    "4. Evaluación de alternativas: Se comparó React vs. Vue.js y MySQL vs. PostgreSQL, "
                    "justificando la elección con base en la curva de aprendizaje, comunidad y "
                    "requisitos del proyecto."
                ),
                "fecha_inicio": datetime(2025, 11, 1),
                "fecha_fin": datetime(2025, 11, 14),
                "evidencia": (
                    "- Diagrama de arquitectura del sistema (cliente-servidor con API REST)\n"
                    "- Diagrama entidad-relación con 12 tablas principales\n"
                    "- Documento de justificación tecnológica\n"
                    "- Estructura inicial del repositorio en GitHub"
                ),
                "observaciones": (
                    "DIFICULTAD 1: La decisión entre usar un ORM (Sequelize/Prisma) o "
                    "consultas SQL directas requirió análisis. Se optó por SQL directo con "
                    "MySQL2 para tener mayor control sobre las consultas y evitar la "
                    "abstracción innecesaria de un ORM.\n\n"
                    "DIFICULTAD 2: El modelado de elementos compuestos con alternativas "
                    "intercambiables (ej: una carpa puede usar lona tipo A o tipo B) "
                    "requirió un diseño flexible con tablas de relación.\n\n"
                    "APRENDIZAJE: Un buen análisis de alternativas tecnológicas antes de "
                    "comenzar a codificar evita rehacer trabajo después."
                ),
            }
        ],
    },
    {
        "numero": 4,
        "periodo": "15/11/2025 - 28/11/2025",
        "fecha_entrega": datetime(2025, 11, 28),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 7-8: CONFIGURACIÓN DEL ENTORNO Y MIGRACIONES\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Configuración del entorno de desarrollo:\n"
                    "   - Inicialización del proyecto frontend con Vite + React + TailwindCSS\n"
                    "   - Configuración del backend con Express y estructura de carpetas por módulos "
                    "(controllers, models, routes)\n"
                    "   - Configuración de ESLint y reglas de estilo de código\n"
                    "   - Configuración de variables de entorno para conexión a base de datos\n\n"
                    "2. Creación del sistema de migraciones: Se implementó un sistema de migraciones "
                    "SQL secuenciales para gestionar la evolución del esquema de base de datos de "
                    "forma controlada y reproducible.\n\n"
                    "3. Implementación de migraciones base:\n"
                    "   - Migración de tablas de categorías con soporte de jerarquía (categoría padre)\n"
                    "   - Migración de elementos, series y lotes\n"
                    "   - Migración de ubicaciones con tipos predefinidos (bodega, finca, salón, etc.)\n"
                    "   - Migración de elementos compuestos y sus componentes\n\n"
                    "4. Estructura del frontend: Se creó la estructura base de la aplicación React con:\n"
                    "   - Sistema de enrutamiento con React Router\n"
                    "   - Layout principal con navegación lateral\n"
                    "   - Configuración de React Query para manejo de estado del servidor"
                ),
                "fecha_inicio": datetime(2025, 11, 15),
                "fecha_fin": datetime(2025, 11, 28),
                "evidencia": (
                    "- Proyecto frontend funcional con navegación básica y layout responsivo\n"
                    "- Backend con API base y conexión a MySQL configurada\n"
                    "- 10 archivos de migración SQL creados y ejecutados correctamente\n"
                    "- Repositorio Git configurado con ramas de desarrollo"
                ),
                "observaciones": (
                    "DIFICULTAD 1: La configuración de CORS entre frontend (puerto 5173) y "
                    "backend (puerto 3000) requirió ajustes para permitir las peticiones "
                    "cross-origin durante el desarrollo.\n\n"
                    "DIFICULTAD 2: Las migraciones debieron ser diseñadas como idempotentes "
                    "(usando IF NOT EXISTS) para poder re-ejecutarse sin errores en "
                    "diferentes entornos.\n\n"
                    "APRENDIZAJE: Aprendí la importancia de diseñar migraciones que sean "
                    "seguras de ejecutar múltiples veces."
                ),
            }
        ],
    },
    {
        "numero": 5,
        "periodo": "29/11/2025 - 12/12/2025",
        "fecha_entrega": datetime(2025, 12, 12),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 9-10: MÓDULO DE INVENTARIO COMPLETO\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Módulo de Inventario - Backend:\n"
                    "   - Implementación de controladores CRUD para elementos, series y lotes\n"
                    "   - Creación de modelos con consultas SQL para cada entidad\n"
                    "   - Endpoints para obtener elementos con sus series/lotes asociados\n"
                    "   - Validación de datos de entrada en las rutas\n\n"
                    "2. Módulo de Inventario - Frontend:\n"
                    "   - Página principal de inventario con listado de elementos en tarjetas\n"
                    "   - Formularios modales para crear y editar elementos\n"
                    "   - Vista de detalle de elemento con tabs para series y lotes\n"
                    "   - Formularios para agregar series (con número de serie único) y lotes "
                    "(con cantidad y ubicación)\n\n"
                    "3. Sistema de categorías:\n"
                    "   - CRUD completo de categorías de productos\n"
                    "   - Selector de iconos (emojis y Lucide icons) para identificación visual\n"
                    "   - Tarjetas de categoría con opciones de editar y eliminar\n\n"
                    "4. Gestión de ubicaciones:\n"
                    "   - Módulo de ubicaciones accesible desde el dashboard\n"
                    "   - Funcionalidad de ubicación principal (bodega base)\n"
                    "   - Tipos de ubicación predefinidos: bodega, finca, salón, hotel, hacienda, club, etc."
                ),
                "fecha_inicio": datetime(2025, 11, 29),
                "fecha_fin": datetime(2025, 12, 12),
                "evidencia": (
                    "- Módulo de inventario completamente funcional con CRUD de elementos, "
                    "series y lotes\n"
                    "- 4 vistas principales implementadas: dashboard, lista de elementos, "
                    "detalle de elemento, gestión de ubicaciones\n"
                    "- Sistema de categorías con soporte visual de iconos\n"
                    "- Buscador global integrado en el módulo de inventario"
                ),
                "observaciones": (
                    "DIFICULTAD 1: El renderizado de tarjetas con valor 0 (cero) en React "
                    "mostraba el número en pantalla en lugar de estar oculto. Se debió a "
                    "la evaluación de expresiones condicionales con && que tratan el 0 "
                    "como falsy pero lo renderizan.\n\n"
                    "DIFICULTAD 2: La invalidación de queries de React Query al eliminar "
                    "categorías no funcionaba correctamente, requiriendo ajustes en las "
                    "keys de caché.\n\n"
                    "DIFICULTAD 3: La integración del selector de ubicaciones en los "
                    "formularios de series tuvo problemas con valores null/undefined.\n\n"
                    "APRENDIZAJE: En React, usar {count > 0 && ...} en lugar de "
                    "{count && ...} para evitar renderizar el número 0."
                ),
            }
        ],
    },
    {
        "numero": 6,
        "periodo": "13/12/2025 - 26/12/2025",
        "fecha_entrega": datetime(2025, 12, 26),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 11-12: ELEMENTOS COMPUESTOS Y REORGANIZACIÓN BACKEND\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Elementos compuestos - Backend:\n"
                    "   - Implementación del modelo de datos para elementos compuestos: una plantilla "
                    "puede contener múltiples componentes del inventario\n"
                    "   - Soporte para grupos de componentes alternativos: por ejemplo, una carpa puede "
                    "usar lona tipo A o tipo B como alternativa intercambiable\n"
                    "   - Endpoints CRUD para crear, listar, editar y eliminar plantillas compuestas\n"
                    "   - Consultas optimizadas para obtener plantillas con sus componentes y conteos\n\n"
                    "2. Elementos compuestos - Frontend:\n"
                    "   - Formulario multi-paso para crear elementos compuestos: paso 1 (datos generales), "
                    "paso 2 (selección de componentes), paso 3 (resumen)\n"
                    "   - Vista de listado con tarjetas que muestran el conteo de componentes por plantilla\n"
                    "   - Modal de edición con las mismas funcionalidades del formulario de creación\n\n"
                    "3. Reorganización del backend:\n"
                    "   - Reestructuración completa del backend en módulos separados: Inventario, "
                    "Productos y Alquileres\n"
                    "   - Cada módulo contiene sus propios controllers, models y routes\n"
                    "   - Simplificación del archivo server.js de ~40 importaciones a una importación "
                    "por módulo\n\n"
                    "4. Mejoras al módulo de inventario:\n"
                    "   - Corrección del renderizado de 0 en tarjetas de ubicación\n"
                    "   - Nuevos tipos de ubicación para eventos (hotel, hacienda, club campestre)\n"
                    "   - Corrección de la integración del selector de ubicaciones"
                ),
                "fecha_inicio": datetime(2025, 12, 13),
                "fecha_fin": datetime(2025, 12, 26),
                "evidencia": (
                    "- Módulo de elementos compuestos funcional con soporte de alternativas\n"
                    "- Backend reorganizado en 3 módulos principales con arquitectura limpia\n"
                    "- 12 PRs mergeados durante este periodo (#30 a #42)\n"
                    "- Correcciones de bugs críticos en el módulo de inventario"
                ),
                "observaciones": (
                    "DIFICULTAD 1: La simplificación del modelo de datos para elementos "
                    "compuestos requirió múltiples iteraciones. El diseño original era "
                    "demasiado complejo y se simplificó para mantener la usabilidad.\n\n"
                    "DIFICULTAD 2: La reorganización del backend en módulos causó conflictos "
                    "en las rutas de importación que debieron resolverse cuidadosamente.\n\n"
                    "DIFICULTAD 3: Se detectó un bug donde console.log de depuración "
                    "quedaba en el código de producción del CategoriaModel.\n\n"
                    "APRENDIZAJE: Reorganizar la arquitectura temprano facilita el "
                    "mantenimiento a largo plazo."
                ),
            }
        ],
    },
    {
        "numero": 7,
        "periodo": "27/12/2025 - 09/01/2026",
        "fecha_entrega": datetime(2026, 1, 9),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 13-14: COTIZACIONES, CALENDARIO Y DISPONIBILIDAD\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Módulo de cotizaciones:\n"
                    "   - Implementación completa del flujo de cotizaciones: creación, edición, "
                    "vista previa y generación PDF\n"
                    "   - Vista previa estilo PDF integrada en la interfaz web\n"
                    "   - Menú kebab (3 puntos) para acciones rápidas en cada cotización\n"
                    "   - Separación de hooks de cotizaciones en archivos individuales\n\n"
                    "2. Tarifas de transporte:\n"
                    "   - Tabla maestra de ciudades como entidad independiente\n"
                    "   - Integración de tarifas de transporte en el formulario de ciudades\n"
                    "   - Migración completa a ciudad_id como clave foránea\n"
                    "   - Eliminación del módulo redundante de tarifas que estaba duplicado\n\n"
                    "3. Sistema de calendario:\n"
                    "   - Integración de FullCalendar con vistas de día, semana, mes y lista\n"
                    "   - Arquitectura modular del calendario para reutilización\n"
                    "   - Modal resumen con productos al hacer clic en un evento del calendario\n\n"
                    "4. Disponibilidad en tiempo real:\n"
                    "   - Sistema de verificación de disponibilidad de productos por rango de fechas\n"
                    "   - Debounce en llamadas API para evitar múltiples peticiones simultáneas\n"
                    "   - Uso de cantidad de tabla elementos como fallback cuando no hay series\n\n"
                    "5. Mejoras generales:\n"
                    "   - Navegación jerárquica por niveles en productos\n"
                    "   - Categorías jerárquicas con padre/hijo\n"
                    "   - Selector de productos con búsqueda y filtrado por categorías"
                ),
                "fecha_inicio": datetime(2025, 12, 27),
                "fecha_fin": datetime(2026, 1, 9),
                "evidencia": (
                    "- Módulo de cotizaciones completo con generación de PDF\n"
                    "- Sistema de calendario integrado con FullCalendar\n"
                    "- Verificación de disponibilidad funcionando en tiempo real\n"
                    "- 12 PRs mergeados (#47 a #59)\n"
                    "- Refactorización de la navegación con categorías jerárquicas"
                ),
                "observaciones": (
                    "DIFICULTAD 1: Las múltiples llamadas a la API de disponibilidad "
                    "causaban problemas de rendimiento. Se implementó debounce y se "
                    "deshabilitaron retries en mutaciones.\n\n"
                    "DIFICULTAD 2: La migración a ciudad_id requirió un script de migración "
                    "cuidadoso para no perder datos existentes.\n\n"
                    "DIFICULTAD 3: La corrección del nombre de columna id_elemento en "
                    "consultas de series generó errores que se detectaron tardíamente.\n\n"
                    "APRENDIZAJE: El debounce es esencial en llamadas API frecuentes "
                    "para evitar sobrecarga del servidor."
                ),
            }
        ],
    },
    {
        "numero": 8,
        "periodo": "10/01/2026 - 23/01/2026",
        "fecha_entrega": datetime(2026, 1, 23),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 15-16: MÓDULO DE OPERACIONES E IMÁGENES\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Módulo de operaciones:\n"
                    "   - Implementación del flujo completo de operaciones: cargue → montaje → "
                    "desmontaje → retorno → descargue\n"
                    "   - Órdenes de trabajo con asignación de empleados y vehículos\n"
                    "   - Historial de estados por orden de trabajo\n"
                    "   - Checklists de cargue y descargue para verificación de equipos\n\n"
                    "2. Soporte de imágenes:\n"
                    "   - Upload de imágenes para elementos y productos de alquiler usando Multer\n"
                    "   - Visualización de fotos en modal durante el proceso de cargue para "
                    "verificación visual\n"
                    "   - Almacenamiento de imágenes en el servidor con rutas relativas\n\n"
                    "3. Mejoras en cotizaciones:\n"
                    "   - Fechas de montaje y desmontaje como campos independientes en la cotización\n"
                    "   - Contexto de alquiler visible en series y lotes (saber qué está alquilado "
                    "y para qué evento)\n"
                    "   - Corrección de módulos de edición de series y lotes\n\n"
                    "4. Auto-generación de lotes:\n"
                    "   - Número de lote generado automáticamente basado en la fecha de creación\n"
                    "   - Rediseño de la página de detalle de elemento con stat cards como "
                    "filtros interactivos\n"
                    "   - Unificación del estado 'nuevo' dentro de 'bueno' para simplificar el flujo\n\n"
                    "5. Limpieza y mantenimiento:\n"
                    "   - Script SQL para limpiar datos de prueba de la base de datos\n"
                    "   - Corrección de subtotal de cotización que no incluía recargos\n"
                    "   - Migración 27 hecha idempotente para compatibilidad"
                ),
                "fecha_inicio": datetime(2026, 1, 10),
                "fecha_fin": datetime(2026, 1, 23),
                "evidencia": (
                    "- Módulo de operaciones funcional con flujo completo de 5 etapas\n"
                    "- Soporte de imágenes implementado para elementos y productos\n"
                    "- Auto-generación de números de lote\n"
                    "- Rediseño de la vista de detalle de elemento\n"
                    "- 8 PRs mergeados (#60 a #67)"
                ),
                "observaciones": (
                    "DIFICULTAD 1: El envío del campo cantidad al crear elementos no se "
                    "estaba realizando correctamente, causando que los elementos se "
                    "crearan sin stock inicial.\n\n"
                    "DIFICULTAD 2: Los iconos SVG no se renderizaban correctamente en "
                    "algunos componentes; se debió crear un componente IconoCategoria "
                    "reutilizable.\n\n"
                    "DIFICULTAD 3: Las tablas inexistentes en el script de limpieza "
                    "generaban errores que debieron manejarse con IF EXISTS.\n\n"
                    "APRENDIZAJE: Crear componentes reutilizables para lógica repetida "
                    "reduce errores y facilita el mantenimiento."
                ),
            }
        ],
    },
    {
        "numero": 9,
        "periodo": "24/01/2026 - 06/02/2026",
        "fecha_entrega": datetime(2026, 2, 6),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 17-18: FUNCIONALIDADES AVANZADAS\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Cronómetros en tiempo real:\n"
                    "   - Implementación de temporizadores en vivo para operaciones de montaje "
                    "y desmontaje\n"
                    "   - Los cronómetros inician cuando se cambia el estado de la orden de "
                    "trabajo y se detienen al finalizar\n"
                    "   - Modales de confirmación estilizados para cambios de estado\n"
                    "   - Auto-creación de la tabla orden_trabajo_historial_estados\n\n"
                    "2. Gestión de depósitos:\n"
                    "   - Campo de valor de depósito agregado a las cotizaciones\n"
                    "   - Toggle de cobro de depósito (cobrar o no cobrar)\n"
                    "   - Uso de valores del backend (resumen) en vez de recalcular subtotales\n"
                    "   - Botón \"Ver PDF\" integrado en la cotización\n\n"
                    "3. Historial de eventos por cliente:\n"
                    "   - Nueva página de eventos completados con historial de productos alquilados\n"
                    "   - Filtro para mostrar solo eventos activos en la lista de cotizaciones\n"
                    "   - Visualización de productos alquilados y cantidades en el historial\n\n"
                    "4. Funcionalidad de repetir evento:\n"
                    "   - Botón \"Repetir evento\" que crea una nueva cotización con los mismos productos\n"
                    "   - Modal de formulario con campos de fecha resaltados\n"
                    "   - Conversión de valores DECIMAL de MySQL a números en JavaScript\n\n"
                    "5. Mejoras en operaciones:\n"
                    "   - Etapas en_retorno y descargue agregadas al flujo de desmontaje\n"
                    "   - Renombre de \"Checklist de Descargue\" a \"Recogida\" y nuevo "
                    "\"Checklist en Bodega\"\n"
                    "   - Mejora de temporizadores para montaje y desmontaje"
                ),
                "fecha_inicio": datetime(2026, 1, 24),
                "fecha_fin": datetime(2026, 2, 6),
                "evidencia": (
                    "- Cronómetros en tiempo real funcionando para montaje y desmontaje\n"
                    "- Sistema de depósitos integrado en cotizaciones\n"
                    "- Historial completo de eventos por cliente con opción de repetir\n"
                    "- Flujo de desmontaje ampliado con 2 nuevas etapas\n"
                    "- 6 PRs mergeados (#77 a #82)"
                ),
                "observaciones": (
                    "DIFICULTAD 1: Los hooks de contexto nunca se ejecutaban debido a una "
                    "comparación estricta (===) con booleanos de MySQL, que devuelve 0 y 1 "
                    "en lugar de true y false. Se solucionó convirtiendo explícitamente a booleano.\n\n"
                    "DIFICULTAD 2: El valor requiere_series sin convertir a booleano provocaba "
                    "que se renderizara un 0 en pantalla.\n\n"
                    "DIFICULTAD 3: La consulta de checklist hacía referencia a una columna "
                    "el.compuesto_id que no existía en la tabla, causando errores SQL.\n\n"
                    "APRENDIZAJE: MySQL devuelve 0/1 para booleanos, no true/false. "
                    "Siempre convertir explícitamente en JavaScript."
                ),
            }
        ],
    },
    {
        "numero": 10,
        "periodo": "07/02/2026 - 20/02/2026",
        "fecha_entrega": datetime(2026, 2, 20),
        "actividades": [
            {
                "descripcion": (
                    "SEMANA 19-20: CORRECCIÓN DE BUGS Y REORGANIZACIÓN FINAL\n\n"
                    "Actividades realizadas:\n\n"
                    "1. Corrección del bug de stock cero:\n"
                    "   - Se identificó que las cotizaciones descontaban el stock al crearlas y "
                    "nuevamente al confirmar el alquiler, provocando un doble descuento\n"
                    "   - Se corrigió el mapeo de disponibilidad por producto en el selector\n"
                    "   - Pruebas exhaustivas del flujo completo: crear cotización → confirmar "
                    "alquiler → verificar stock → devolver → verificar restauración de stock\n\n"
                    "2. Rediseño de la interfaz de inventario:\n"
                    "   - Nueva interfaz del módulo de inventario con diseño más limpio y moderno\n"
                    "   - Tarjetas de productos con mejor visualización de stock y estados\n"
                    "   - Mejoras en la experiencia de usuario para navegación entre módulos\n\n"
                    "3. Reorganización completa del proyecto:\n"
                    "   - Backend: Creación de 7 módulos independientes (auth, inventario, productos, "
                    "alquileres, clientes, operaciones, configuracion)\n"
                    "   - Frontend: Reorganización de 247 archivos en 9 módulos + shared\n"
                    "   - Simplificación del servidor: server.js pasó de ~40 líneas de importación "
                    "a una línea por módulo\n"
                    "   - Actualización de todas las rutas de importación\n\n"
                    "4. Resolución de conflictos post-reorganización:\n"
                    "   - Corrección de rutas de importación de ClienteModel y ConfiguracionModel\n"
                    "   - Merge de conflictos entre la rama de reorganización y main"
                ),
                "fecha_inicio": datetime(2026, 2, 7),
                "fecha_fin": datetime(2026, 2, 20),
                "evidencia": (
                    "- Bug crítico de doble descuento de stock corregido\n"
                    "- Interfaz de inventario rediseñada con mejor UX\n"
                    "- Proyecto completamente reorganizado en arquitectura modular:\n"
                    "  • 7 módulos backend con separación clara de responsabilidades\n"
                    "  • 9 módulos frontend + shared con componentes reutilizables\n"
                    "  • 261 endpoints API organizados por dominio\n"
                    "- 3 PRs mergeados (#83, #84, #85)\n\n"
                    "ESTADO FINAL DEL PROYECTO:\n"
                    "  • 319 archivos JS/JSX\n"
                    "  • 261 endpoints API\n"
                    "  • 106 componentes React\n"
                    "  • 36 hooks personalizados\n"
                    "  • 31 tablas de base de datos\n"
                    "  • 29 migraciones SQL\n"
                    "  • 383+ commits totales\n"
                    "  • 85 Pull Requests"
                ),
                "observaciones": (
                    "DIFICULTAD PRINCIPAL: La reorganización de 247 archivos fue la tarea más "
                    "compleja del proyecto. Cada archivo movido requería actualizar todas sus "
                    "importaciones y las importaciones de los archivos que lo referenciaban.\n\n"
                    "DIFICULTAD 2: Algunos controladores seguían importando modelos con rutas "
                    "relativas antiguas (../../models/) en lugar de las nuevas rutas modulares, "
                    "causando errores en tiempo de ejecución.\n\n"
                    "DIFICULTAD 3: La resolución de conflictos de merge entre la rama de "
                    "reorganización y main requirió cuidado para mantener los alias de "
                    "importación consistentes.\n\n"
                    "APRENDIZAJE: Una buena organización modular desde el inicio del proyecto "
                    "habría evitado esta reorganización masiva. Lección para futuros proyectos."
                ),
            }
        ],
    },
]


# ─── Estilos ──────────────────────────────────────────────────────────────────

THIN = Side(style="thin")
THIN_BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

FONT_TITLE = Font(name="Arial", bold=True, size=12)
FONT_HEADER = Font(name="Arial", bold=True, size=10)
FONT_NORMAL = Font(name="Arial", size=10)
FONT_SMALL = Font(name="Arial", size=9)
FONT_VERSION = Font(name="Arial", size=8, color="808080")

FILL_HEADER = PatternFill(start_color="D9E2F3", end_color="D9E2F3", fill_type="solid")
FILL_LIGHT = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")

ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
ALIGN_LEFT = Alignment(horizontal="left", vertical="top", wrap_text=True)
ALIGN_LEFT_CENTER = Alignment(horizontal="left", vertical="center", wrap_text=True)


def apply_border(ws, min_row, max_row, min_col, max_col):
    """Apply thin border to a range of cells."""
    for r in range(min_row, max_row + 1):
        for c in range(min_col, max_col + 1):
            ws.cell(row=r, column=c).border = THIN_BORDER


def merge_and_write(ws, row, col_start, col_end, value, font=FONT_NORMAL,
                    alignment=ALIGN_LEFT, fill=None, border=True):
    """Merge cells and write a value with formatting."""
    if col_start != col_end:
        ws.merge_cells(
            start_row=row, start_column=col_start,
            end_row=row, end_column=col_end
        )
    cell = ws.cell(row=row, column=col_start, value=value)
    cell.font = font
    cell.alignment = alignment
    if fill:
        cell.fill = fill
    if border:
        for c in range(col_start, col_end + 1):
            ws.cell(row=row, column=c).border = THIN_BORDER


def merge_range_and_write(ws, min_row, max_row, min_col, max_col, value,
                          font=FONT_NORMAL, alignment=ALIGN_LEFT, fill=None):
    """Merge a rectangular range and write a value."""
    ws.merge_cells(
        start_row=min_row, start_column=min_col,
        end_row=max_row, end_column=max_col
    )
    cell = ws.cell(row=min_row, column=min_col, value=value)
    cell.font = font
    cell.alignment = alignment
    if fill:
        for r in range(min_row, max_row + 1):
            for c in range(min_col, max_col + 1):
                ws.cell(row=r, column=c).fill = fill
    apply_border(ws, min_row, max_row, min_col, max_col)


def create_bitacora_sheet(wb, data):
    """Create a single bitácora sheet in SENA GFPI-F-147 format."""
    num = data["numero"]
    ws = wb.create_sheet(title=f"Bitácora {num:02d}")

    # Column widths (25 columns: A-Y)
    col_widths = {
        1: 4, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 6, 10: 6,
        11: 6, 12: 4, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 4,
        20: 6, 21: 6, 22: 6, 23: 4, 24: 6, 25: 6
    }
    for col, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width

    # ── Row 1-2: Version/Code (top right) ──
    merge_and_write(ws, 1, 23, 25, "Versión: 03", FONT_VERSION, ALIGN_CENTER)
    merge_and_write(ws, 2, 23, 25, "Código:\nGFPI-F-147", FONT_VERSION, ALIGN_CENTER)

    # ── Row 3-4: Title ──
    merge_and_write(ws, 3, 2, 22, "Proceso Gestión de Formación Profesional Integral",
                    FONT_TITLE, ALIGN_CENTER)
    merge_and_write(ws, 4, 2, 22, "Formato Bitácora seguimiento Etapa productiva",
                    FONT_HEADER, ALIGN_CENTER)

    # ── Row 5-6: Regional and Center ──
    merge_and_write(ws, 5, 2, 25, DATOS["regional"], FONT_HEADER, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 6, 2, 25, DATOS["centro"], FONT_NORMAL, ALIGN_CENTER, FILL_HEADER)

    # ── Row 7: Title bar ──
    merge_and_write(ws, 7, 2, 25, "BITÁCORA DE SEGUIMIENTO ETAPA PRODUCTIVA",
                    FONT_HEADER, ALIGN_CENTER, FILL_HEADER)

    # ── Row 8: blank ──

    # ── Row 9-10: Company info ──
    merge_and_write(ws, 9, 2, 12, "Nombre de la empresa donde está realizando la etapa productiva",
                    FONT_SMALL, ALIGN_LEFT_CENTER, FILL_LIGHT)
    merge_and_write(ws, 9, 13, 15, "NIT", FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, 9, 16, 19, "BITACORA  N°", FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, 9, 20, 25, "Período", FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    merge_and_write(ws, 10, 2, 12, DATOS["empresa"], FONT_NORMAL, ALIGN_LEFT_CENTER)
    merge_and_write(ws, 10, 13, 15, DATOS["nit"], FONT_NORMAL, ALIGN_CENTER)
    merge_and_write(ws, 10, 16, 19, num, FONT_NORMAL, ALIGN_CENTER)
    merge_and_write(ws, 10, 20, 25, data["periodo"], FONT_NORMAL, ALIGN_CENTER)

    # ── Row 11: blank ──

    # ── Row 12-13: Supervisor info ──
    merge_and_write(ws, 12, 2, 10, "Nombre del jefe inmediato/Responsable",
                    FONT_SMALL, ALIGN_LEFT_CENTER, FILL_LIGHT)
    merge_and_write(ws, 12, 11, 16, "Teléfono de contacto",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, 12, 17, 25, "Correo electrónico",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    merge_and_write(ws, 13, 2, 10, DATOS["jefe_nombre"], FONT_NORMAL, ALIGN_LEFT_CENTER)
    merge_and_write(ws, 13, 11, 16, DATOS["jefe_telefono"], FONT_NORMAL, ALIGN_CENTER)
    merge_and_write(ws, 13, 17, 25, DATOS["jefe_correo"], FONT_NORMAL, ALIGN_CENTER)

    # ── Row 14: blank ──

    # ── Row 15-16: Modality ──
    merge_and_write(ws, 15, 2, 25,
                    'Seleccione con una "X" el tipo de modalidad de etapa productiva',
                    FONT_SMALL, ALIGN_LEFT_CENTER, FILL_LIGHT)

    modalidades = [
        (2, 4, "CONTRATO DE APRENDIZAJE"),
        (5, 6, "VÍNCULO LABORAL O CONTRACTUAL"),
        (7, 7, ""),   # X mark column
        (8, 10, "PROYECTO PRODUCTIVO"),
        (11, 14, "APOYO A UNA UNIDAD PRODUCTIVA FAMILIAR"),
        (15, 18, "APOYO A INSTITUCIÓN ESTATAL NACIONAL, TERRITORIAL, O A UNA ONG"),
        (19, 21, "MONITORIA"),
        (22, 25, "PASANTIA"),
    ]
    for start, end, label in modalidades:
        merge_and_write(ws, 16, start, end, label, FONT_SMALL, ALIGN_CENTER)

    # Mark the X for the selected modality
    ws.cell(row=16, column=7, value="x")
    ws.cell(row=16, column=7).font = FONT_HEADER
    ws.cell(row=16, column=7).alignment = ALIGN_CENTER

    # ── Row 17-18: blank ──

    # ── Row 19-20: Student info ──
    merge_and_write(ws, 19, 2, 9, "Nombre del aprendiz",
                    FONT_SMALL, ALIGN_LEFT_CENTER, FILL_LIGHT)
    merge_and_write(ws, 19, 10, 14, "Documento Id.",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, 19, 15, 19, "Teléfono de contacto",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, 19, 20, 25, "Correo electrónico institucional",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    merge_and_write(ws, 20, 2, 9, DATOS["aprendiz_nombre"], FONT_NORMAL, ALIGN_LEFT_CENTER)
    merge_and_write(ws, 20, 10, 14, DATOS["aprendiz_doc"], FONT_NORMAL, ALIGN_CENTER)
    merge_and_write(ws, 20, 15, 19, DATOS["aprendiz_tel"], FONT_NORMAL, ALIGN_CENTER)
    merge_and_write(ws, 20, 20, 25, DATOS["aprendiz_correo"], FONT_NORMAL, ALIGN_CENTER)

    # ── Row 21: blank ──

    # ── Row 22-23: Program info ──
    merge_and_write(ws, 22, 2, 10, "Número de ficha",
                    FONT_SMALL, ALIGN_LEFT_CENTER, FILL_LIGHT)
    merge_and_write(ws, 22, 11, 25, "Programa de formación",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    merge_and_write(ws, 23, 2, 10, DATOS["ficha"], FONT_NORMAL, ALIGN_LEFT_CENTER)
    merge_and_write(ws, 23, 11, 25, DATOS["programa"], FONT_NORMAL, ALIGN_CENTER)

    # ── Row 24: blank ──

    # ── Row 25: Activities table header ──
    merge_range_and_write(ws, 25, 25, 2, 10,
                          "DESCRIPCIÓN DE LA ACTIVIDAD\n(Ingrese cuantas filas sean necesarias)",
                          FONT_SMALL, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 25, 11, 12, "FECHA\nINICIO", FONT_SMALL, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 25, 13, 14, "FECHA\nFIN", FONT_SMALL, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 25, 15, 20, "EVIDENCIA DE CUMPLIMIENTO",
                    FONT_SMALL, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 25, 21, 25,
                    "OBSERVACIONES, INASISTENCIAS Y/O DIFICULTADES PRESENTADAS",
                    FONT_SMALL, ALIGN_CENTER, FILL_HEADER)

    ws.row_dimensions[25].height = 35

    # ── Row 26+: Activities ──
    current_row = 26
    for act in data["actividades"]:
        # Each activity takes ~24 rows for the merged text cells
        act_height = 24
        end_row = current_row + act_height - 1

        merge_range_and_write(ws, current_row, end_row, 2, 10,
                              act["descripcion"], FONT_SMALL, ALIGN_LEFT)
        merge_range_and_write(ws, current_row, end_row, 11, 12,
                              act["fecha_inicio"], FONT_SMALL, ALIGN_CENTER)
        merge_range_and_write(ws, current_row, end_row, 13, 14,
                              act["fecha_fin"], FONT_SMALL, ALIGN_CENTER)
        merge_range_and_write(ws, current_row, end_row, 15, 20,
                              act["evidencia"], FONT_SMALL, ALIGN_LEFT)
        merge_range_and_write(ws, current_row, end_row, 21, 25,
                              act["observaciones"], FONT_SMALL, ALIGN_LEFT)

        # Set row heights for readability
        for r in range(current_row, end_row + 1):
            ws.row_dimensions[r].height = 15

        current_row = end_row + 1

    # ── Blank rows before signatures ──
    current_row += 2

    # ── Reminder line ──
    merge_and_write(ws, current_row, 2, 25,
                    "Aprendiz: recuerde diligenciar completamente el informe y "
                    "entregarlo o subirlo al espacio asignado para este.",
                    FONT_SMALL, ALIGN_LEFT_CENTER)
    current_row += 2

    # ── Signatures section ──
    # Aprendiz name
    merge_and_write(ws, current_row, 3, 9, "ANDERSON MORENO", FONT_NORMAL, ALIGN_CENTER)
    # Fecha entrega
    merge_and_write(ws, current_row + 1, 21, 25, data["fecha_entrega"],
                    FONT_NORMAL, ALIGN_CENTER)
    current_row += 2

    # Labels
    merge_and_write(ws, current_row, 2, 9, "Nombre del Aprendiz",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, current_row, 11, 18, "Firma del aprendiz",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, current_row, 20, 25, "Fecha entrega bitácora",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    current_row += 3

    # Instructor and Jefe
    merge_and_write(ws, current_row, 2, 9, "Nombre del Instructor de Seguimiento",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, current_row, 11, 18, "Firma de instructor de seguimiento",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)
    merge_and_write(ws, current_row, 19, 25, "Firma del jefe inmediato (Si es del caso)",
                    FONT_SMALL, ALIGN_CENTER, FILL_LIGHT)

    current_row += 2

    # ── Privacy note ──
    merge_and_write(ws, current_row, 2, 25,
                    "Nota: LOS DATOS PROPORCIONADOS SERÁN TRATADOS DE ACUERDO CON LA "
                    "POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES DEL SENA Y A LA LEY "
                    "1581 DE 2012.",
                    FONT_SMALL, ALIGN_LEFT_CENTER)

    # Set print area
    ws.sheet_properties.pageSetUpPr = None
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0


def create_instrucciones_sheet(wb):
    """Create the 'Instrucciones' sheet (simplified version)."""
    ws = wb.create_sheet(title="Instrucciones")

    ws.column_dimensions["A"].width = 4
    ws.column_dimensions["B"].width = 40
    ws.column_dimensions["C"].width = 60
    for col in range(4, 16):
        ws.column_dimensions[get_column_letter(col)].width = 8

    merge_and_write(ws, 4, 2, 10,
                    "Proceso Gestión de Formación Profesional Integral\n"
                    "Formato Bitácora seguimiento Etapa productiva",
                    FONT_TITLE, ALIGN_CENTER)
    merge_and_write(ws, 4, 11, 15, "Versión: 03", FONT_VERSION, ALIGN_CENTER)
    merge_and_write(ws, 5, 11, 15, "Código:\nGFPI-F-147", FONT_VERSION, ALIGN_CENTER)

    merge_and_write(ws, 6, 2, 15,
                    "INSTRUCCIONES PARA EL DILIGENCIAMIENTO DEL FORMATO",
                    FONT_HEADER, ALIGN_CENTER, FILL_HEADER)
    merge_and_write(ws, 7, 2, 15, "NO IMPRIMIR", FONT_HEADER, ALIGN_CENTER)

    merge_and_write(ws, 8, 2, 15, "1. Generalidades", FONT_HEADER, ALIGN_LEFT)
    merge_and_write(ws, 9, 2, 15,
                    "El formato de Bitácora de Seguimiento de Etapa Productiva se crea como "
                    "parte de la Guía Desarrollo Etapa Productiva en el proceso formativo que "
                    "se ubica dentro del Proceso Ejecución de la Formación Profesional Integral "
                    "(GFPI-P-006), para ser diligenciado por los aprendices y el jefe de la "
                    "empresa (si es del caso para las alternativas de etapa productiva de índole "
                    "laboral).",
                    FONT_NORMAL, ALIGN_LEFT)

    ws.row_dimensions[9].height = 80


def main():
    wb = Workbook()

    # Create Instrucciones sheet first
    create_instrucciones_sheet(wb)

    # Create all 10 bitácora sheets
    for data in BITACORAS_DATA:
        create_bitacora_sheet(wb, data)

    # Remove default sheet
    del wb["Sheet"]

    output_path = os.path.join(BITACORAS_DIR, "Bitacoras_SENA_GFPI-F-147.xlsx")
    wb.save(output_path)
    print(f"✓ Excel generado: {output_path}")
    print(f"  → {len(BITACORAS_DATA)} bitácoras en formato SENA GFPI-F-147")


if __name__ == "__main__":
    main()
