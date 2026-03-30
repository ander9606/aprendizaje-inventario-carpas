# Manual de Usuario — Sistema de Gestion de Inventario y Alquileres de Carpas

## Tabla de Contenido

1. [Introduccion](#1-introduccion)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Roles y Permisos](#3-roles-y-permisos)
4. [Modulo de Inventario](#4-modulo-de-inventario)
5. [Modulo de Productos](#5-modulo-de-productos)
6. [Modulo de Alquileres](#6-modulo-de-alquileres)
7. [Modulo de Operaciones](#7-modulo-de-operaciones)
8. [Configuracion](#8-configuracion)
9. [Flujos de Trabajo Principales](#9-flujos-de-trabajo-principales)

---

## 1. Introduccion

### Que es este sistema?

Este sistema es una aplicacion web disenada para gestionar el inventario, cotizaciones, alquileres y logistica de una empresa de alquiler de carpas y equipos para eventos. Permite controlar desde el stock de cada elemento hasta la coordinacion de montajes y desmontajes en campo.

### Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge o Safari en su version mas reciente).
- Conexion a internet.
- Credenciales de acceso proporcionadas por el administrador del sistema.

### Como acceder

1. Abra su navegador web.
2. Ingrese la direccion (URL) del sistema proporcionada por su empresa.
3. Se mostrara la pantalla de inicio de sesion.

---

## 2. Primeros Pasos

### 2.1 Registro de cuenta

Si aun no tiene una cuenta:

1. En la pantalla de inicio de sesion, haga clic en **"Registrarse"**.
2. Complete el formulario con sus datos: nombre, apellido, correo electronico y contrasena.
3. Seleccione el rol que desea solicitar (ventas, operaciones, bodega, etc.).
4. Haga clic en **"Registrarse"**.
5. Su solicitud quedara en estado **pendiente** hasta que un administrador la apruebe.
6. Recibira acceso una vez que el administrador active su cuenta.

### 2.2 Inicio de sesion

1. Ingrese su **correo electronico** y **contrasena**.
2. Haga clic en **"Iniciar Sesion"**.
3. Si ingresa la contrasena incorrecta 5 veces consecutivas, su cuenta se bloqueara temporalmente por 15 minutos.

### 2.3 Navegacion general

Al iniciar sesion, vera el **Dashboard de Modulos** con tarjetas de acceso rapido a cada seccion:

- **Inventario** — Gestionar el inventario fisico de elementos.
- **Productos** — Administrar plantillas de productos compuestos para alquiler.
- **Alquileres** — Cotizaciones, alquileres, clientes y calendario.
- **Operaciones** — Ordenes de trabajo, montajes, desmontajes y alertas.
- **Configuracion** — Datos de empresa, ciudades, ubicaciones y empleados.

Haga clic en cualquier tarjeta para ingresar al modulo correspondiente.

---

## 3. Roles y Permisos

El sistema cuenta con 5 roles predefinidos. Cada rol determina que acciones puede realizar el usuario:

| Accion | Admin | Gerente | Ventas | Operaciones | Bodega |
|--------|:-----:|:-------:|:------:|:-----------:|:------:|
| **Inventario** — Ver | Si | Si | Si | Si | Si |
| **Inventario** — Crear/Editar | Si | Si | No | Editar | Si |
| **Inventario** — Eliminar | Si | No | No | No | No |
| **Productos** — Ver | Si | Si | Si | Si | Si |
| **Productos** — Crear/Editar | Si | Si | No | No | No |
| **Alquileres** — Ver | Si | Si | Si | Si | Si |
| **Alquileres** — Crear/Editar | Si | Si | Si | No | No |
| **Operaciones** — Ver | Si | Si | Si | Si | Si |
| **Operaciones** — Crear/Editar | Si | Si | No | Si | No |
| **Empleados** — Gestionar | Si | Ver | No | No | No |
| **Configuracion** — Modificar | Si | Ver | No | No | No |
| **Reportes** — Ver | Si | Si | Si | No | No |
| **Reportes** — Exportar | Si | Si | No | No | No |

**Resumen por rol:**

- **Admin**: Acceso total al sistema, incluyendo gestion de empleados y configuracion.
- **Gerente**: Puede crear y editar en la mayoria de modulos, pero no puede eliminar ni modificar configuracion.
- **Ventas**: Enfocado en cotizaciones, alquileres y clientes. Puede ver inventario y reportes.
- **Operaciones**: Enfocado en ordenes de trabajo y montajes. Puede editar inventario (mover elementos).
- **Bodega**: Enfocado en gestion de inventario fisico (crear y editar stock, series y lotes).

---

## 4. Modulo de Inventario

### 4.1 Dashboard de Inventario

El dashboard presenta un resumen visual del estado del inventario:

- **Tarjetas KPI**: Total de elementos, total de unidades, valor del inventario y alertas de stock bajo.
- **Graficos**: Distribucion por estado (nuevo, bueno, mantenimiento, alquilado, danado), top de categorias, inventario por ubicacion.
- **Tabla de alertas de stock bajo**: Elementos por debajo del stock minimo con indicadores de severidad.
- **Exportar a Excel**: Boton para descargar el inventario completo.

### 4.2 Jerarquia de categorias

El inventario se organiza en tres niveles:

```
Categoria principal (ej: Carpas)
  └── Subcategoria (ej: Carpa P10)
        └── Elemento (ej: Carpa blanca 3x3)
              └── Series (unidades individuales) o Lotes (cantidades por ubicacion)
```

**Navegacion:**
1. Al entrar al modulo de Inventario vera las **categorias principales** en formato de tarjetas.
2. Haga clic en una categoria para ver sus **subcategorias**.
3. Haga clic en una subcategoria para ver sus **elementos**.
4. Haga clic en un elemento para ver su **detalle completo**.

**Acciones disponibles en cada nivel:**
- Crear, editar y eliminar categorias/subcategorias (segun su rol).
- Busqueda global de categorias y elementos.
- Alternar entre vista de tarjetas y vista de lista.

### 4.3 Gestion de elementos

Cada elemento tiene un detalle completo con:

- Informacion general (nombre, descripcion, precio, stock minimo).
- Imagenes (subir y eliminar fotos del elemento).
- Estadisticas de unidades por estado y ubicacion.

#### Elementos con Series (unidades individuales)

Para elementos que requieren seguimiento individual (ej: cada carpa tiene un numero de serie):

- **Ver lista de series** con filtros por estado y ubicacion.
- **Agregar nuevas series** con numero de serie unico.
- **Editar** informacion de una serie (estado, observaciones).
- **Mover** una serie entre ubicaciones (ej: de bodega a un evento).
- **Retornar** una serie a bodega.

#### Elementos con Lotes (cantidades por ubicacion)

Para elementos que se gestionan por cantidad (ej: sillas, mesas):

- **Ver inventario distribuido** por ubicacion.
- **Agregar lotes** con cantidad a una ubicacion.
- **Editar** detalles de un lote.
- **Mover** cantidades entre ubicaciones.
- **Retornar** lotes a bodega.

### 4.4 Ubicaciones

Las ubicaciones se dividen en dos tipos:

- **Almacenamiento**: Bodegas y talleres donde se guardan los elementos.
- **Destinos de eventos**: Ubicaciones donde se realizan los eventos, agrupadas por ciudad.

Se gestionan desde **Configuracion > Ubicaciones**.

---

## 5. Modulo de Productos

### 5.1 Que son los productos compuestos?

Un producto compuesto (o plantilla de producto) es un paquete que agrupa varios elementos individuales del inventario en un solo producto para alquiler. Por ejemplo, una "Carpa P10 Completa" puede incluir: 1 estructura de carpa, 4 paredes laterales, 1 techo y 8 estacas.

### 5.2 Navegacion

El modulo de productos sigue una jerarquia similar al inventario:

1. **Categorias de productos** (ej: Carpas, Parasoles).
2. **Subcategorias** (ej: P10, P14).
3. **Productos compuestos** (ej: Carpa P10 Blanca Completa).

### 5.3 Crear un producto compuesto

1. Navegue hasta la subcategoria deseada.
2. Haga clic en **"Crear producto"**.
3. Asigne un nombre y descripcion.
4. Agregue los elementos que componen el producto, indicando la cantidad de cada uno.
5. Guarde el producto.

Este producto estara disponible como opcion al crear cotizaciones.

---

## 6. Modulo de Alquileres

Este modulo se accede desde la barra lateral y contiene varias secciones.

### 6.1 Cotizaciones

Las cotizaciones son el punto de partida de todo alquiler.

**Crear una cotizacion:**
1. Vaya a **Alquileres > Cotizaciones**.
2. Haga clic en **"Nueva Cotizacion"**.
3. Seleccione o cree un **cliente**.
4. Defina las **fechas** del evento (montaje, evento, desmontaje).
5. Agregue **productos** (plantillas compuestas) o elementos individuales.
6. Aplique **descuentos** si es necesario.
7. Revise el resumen de totales (subtotal, impuestos, transporte, total).
8. **Guarde** la cotizacion.

**Acciones sobre cotizaciones:**
- **Generar PDF**: Crear un documento PDF de la cotizacion para enviar al cliente.
- **Editar**: Modificar productos, fechas o descuentos.
- **Convertir a alquiler**: Cuando el cliente confirma, convertir la cotizacion en un alquiler activo.

### 6.2 Gestion de Alquileres

En **Alquileres > Gestion** puede ver y administrar todos los alquileres.

**Panel principal:**
- Filtros por estado: Activo, Pendiente, Completado, Vencido, Cancelado.
- Estadisticas rapidas: cantidad de activos, pendientes y vencidos.
- Busqueda por nombre de evento, cliente o productos.

**Detalle de un alquiler:**
- Informacion basica: evento, cliente, fechas, ubicacion.
- Resumen financiero: total, anticipo, saldo, impuestos.
- Linea de tiempo del alquiler (cotizacion, salida, retorno).
- Galeria de fotos.
- Registro de novedades e incidentes.

**Acciones:**
- **Cancelar** un alquiler.
- **Extender** la duracion (agregar dias).
- **Imprimir** documentos asociados.

### 6.3 Clientes

En **Alquileres > Clientes** puede gestionar su base de clientes.

- **Crear** un nuevo cliente con datos de contacto.
- **Editar** informacion de un cliente existente.
- **Ver historial**: Eventos pasados de cada cliente.
- **Repetir evento**: Crear rapidamente una nueva cotizacion basada en un evento anterior del cliente.

### 6.4 Calendario

En **Alquileres > Calendario** puede visualizar todos los eventos en formato de calendario.

- Codigo de colores:
  - **Verde**: Montaje
  - **Morado**: Evento
  - **Naranja**: Desmontaje
- Filtros para mostrar/ocultar por tipo o estado.
- Haga clic en un evento para ver su resumen.
- Haga clic en una fecha para ver todas las cotizaciones de ese dia.

### 6.5 Tarifas de Transporte

En **Alquileres > Transporte** puede consultar y gestionar las tarifas por ciudad.

- Tarifas por tipo de camion: Pequeno, Mediano, Grande, Extragrande.
- Filtrar por departamento o ciudad.
- Buscar ciudades especificas.

### 6.6 Descuentos

En **Alquileres > Descuentos** puede administrar plantillas de descuento predefinidas.

- Crear descuentos por **porcentaje** o por **monto fijo**.
- Activar o desactivar descuentos.
- Los descuentos disponibles aparecen al crear cotizaciones.

### 6.7 Historial

- **Historial de alquileres**: Registro de alquileres completados y cancelados.
- **Historial de eventos**: Eventos pasados con opcion de repetir.

### 6.8 Reportes

En **Alquileres > Reportes** puede analizar el rendimiento del negocio.

**KPIs disponibles:**
- Ingresos totales.
- Alquileres activos.
- Valor promedio de alquiler.
- Alquileres completados.

**Filtros de periodo:**
- Todo el historial.
- Por mes (con navegacion entre meses).
- Por semestre.
- Por ano.

**Graficos:**
- Tendencia de ingresos.
- Top clientes.
- Top productos.
- Ingresos por categoria.

---

## 7. Modulo de Operaciones

### 7.1 Dashboard de Operaciones

Al ingresar al modulo vera un resumen de las ordenes de trabajo agrupadas por alquiler:

- Estadisticas: ordenes pendientes, en progreso, completadas hoy.
- Panel de alertas con problemas de asignacion.
- Acceso rapido a cada orden de trabajo.

### 7.2 Ordenes de Trabajo

Las ordenes de trabajo coordinan las actividades de campo (montaje, desmontaje, etc.).

**Tipos de ordenes:**
- **Montaje**: Armado de carpas y equipos en el lugar del evento.
- **Desmontaje**: Desarmado y retiro de equipos.
- **Mantenimiento**: Reparacion o mantenimiento de elementos.
- **Traslado**: Movimiento de equipos entre ubicaciones.
- **Revision**: Inspeccion de equipos.
- **Inventario**: Conteo o verificacion de stock.
- **Otro**: Cualquier otra actividad.

**Estados de una orden:**
1. Pendiente
2. Confirmado
3. En preparacion
4. En ruta
5. En sitio
6. En proceso
7. Completado
8. Cancelado

**Crear una orden manual:**
1. Vaya a **Operaciones > Ordenes**.
2. Haga clic en **"Nueva Orden"**.
3. Seleccione el tipo de orden.
4. Defina fechas, ubicacion y elementos.
5. Asigne un responsable.
6. Guarde la orden.

> **Nota**: Las ordenes de montaje y desmontaje tambien se generan automaticamente al convertir una cotizacion en alquiler.

**Detalle de una orden:**
- Informacion de la orden (tipo, fechas, ubicacion).
- Lista de elementos con cantidades.
- Equipo y responsable asignado.
- Flujo de estados (preparar, iniciar, completar).
- Documentacion con fotos.
- Registro de novedades e incidentes.
- Checklist de carga/descarga.

### 7.3 Calendario de Operaciones

Vista de calendario con todas las ordenes de trabajo:

- **Verde**: Montaje.
- **Naranja**: Desmontaje.
- Colores mas claros para ordenes completadas.
- Filtros por tipo de orden.

### 7.4 Sistema de Alertas

En **Operaciones > Alertas** se centralizan todas las notificaciones del sistema.

**Tipos de alertas:**
- Retornos o montajes vencidos.
- Retornos o montajes proximos.
- Conflictos de disponibilidad.
- Conflictos de fechas.
- Conflictos de equipos.
- Incidencias reportadas.

**Niveles de severidad:** Baja, Media, Alta, Critica.

**Acciones sobre alertas:**
- **Marcar como leida**: Ignorar por 1 dia.
- **Marcar como resuelta**: Ignorar por 7 dias.
- **Navegar al origen**: Ir directamente al alquiler u orden relacionada.

### 7.5 Historial de Ordenes

Registro de todas las ordenes completadas, con busqueda y filtros.

---

## 8. Configuracion

Accesible desde el modulo **Configuracion** en el dashboard.

### 8.1 Datos de Empresa

Configuracion de la informacion de su empresa:

- Nombre de la empresa.
- Logo (subir, previsualizar, reemplazar o eliminar).
- NIT (identificacion tributaria).
- Direccion.
- Telefono y correo electronico.
- Persona de contacto.

### 8.2 Ciudades y Tarifas de Transporte

Gestion del catalogo de ciudades con sus tarifas de transporte:

- Agregar, editar o eliminar ciudades.
- Definir tarifas para 4 tipos de camion por ciudad.
- Crear departamentos nuevos.
- Activar/desactivar ciudades.

### 8.3 Ubicaciones y Destinos

- **Almacenamiento**: Crear y gestionar bodegas y talleres.
- **Destinos de eventos**: Crear destinos agrupados por ciudad para asignarlos a cotizaciones y ordenes.

### 8.4 Gestion de Empleados (Solo Admin/Gerente)

Administracion del equipo de trabajo:

- **Aprobar** solicitudes de registro pendientes.
- **Rechazar** solicitudes (con motivo).
- **Editar** datos y rol de un empleado.
- **Desactivar** empleados que ya no trabajan.
- **Reactivar** empleados desactivados.
- Filtrar por nombre, rol o estado (pendiente, activo, inactivo).

### 8.5 Impuestos y Dias Extra

- **IVA**: Configurar el porcentaje de impuesto aplicado a cotizaciones.
- **Dias extra**: Definir dias de gracia y recargos por dias adicionales en alquileres.

---

## 9. Flujos de Trabajo Principales

### 9.1 Flujo completo de alquiler

Este es el flujo principal del sistema, desde la solicitud del cliente hasta la devolucion de equipos:

```
1. Crear cotizacion
       |
2. Seleccionar cliente y productos
       |
3. Generar PDF y enviar al cliente
       |
4. Cliente confirma → Convertir a alquiler
       |
5. Se generan ordenes de trabajo automaticamente
   (montaje + desmontaje)
       |
6. Asignar responsables a las ordenes
       |
7. Preparar elementos en bodega
       |
8. Ejecutar montaje en sitio
       |
9. Realizar evento
       |
10. Ejecutar desmontaje
       |
11. Retornar elementos a bodega
       |
12. Completar alquiler
```

### 9.2 Gestion diaria de inventario

1. Revisar el **dashboard de inventario** para identificar alertas de stock bajo.
2. Verificar el estado de series/lotes que estan en campo (estado "alquilado").
3. Registrar **retornos** de elementos que regresan de eventos.
4. Actualizar el **estado** de elementos danados o en mantenimiento.
5. Mover elementos entre **ubicaciones** segun necesidad.

### 9.3 Gestion de operaciones en campo

1. Consultar el **calendario de operaciones** para ver las ordenes del dia.
2. Revisar el **detalle** de cada orden: elementos, ubicacion, responsable.
3. Actualizar el **estado** de la orden a medida que avanza (en preparacion → en ruta → en sitio → en proceso → completado).
4. Documentar con **fotos** el montaje/desmontaje.
5. Registrar **novedades** o incidentes si ocurren.
6. Revisar las **alertas** del sistema para atender problemas pendientes.

---

> **Soporte**: Si tiene dudas o problemas con el sistema, contacte al administrador de su empresa.
