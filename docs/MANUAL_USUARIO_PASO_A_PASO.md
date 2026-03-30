# Manual de Usuario Paso a Paso — Sistema de Gestion de Inventario y Alquileres de Carpas

> **Convencion**: Los espacios marcados con `> **[Pantallazo: ...]**` son reservados para insertar capturas de pantalla.

---

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

### 1.1 Que es este sistema?

Es una aplicacion web para gestionar el inventario, cotizaciones, alquileres y logistica de una empresa de alquiler de carpas y equipos para eventos. Controla desde el stock de cada elemento hasta la coordinacion de montajes y desmontajes en campo.

### 1.2 Requisitos

- Navegador web moderno (Chrome, Firefox, Edge o Safari).
- Conexion a internet.
- Credenciales de acceso proporcionadas por el administrador.

### 1.3 Como acceder

1. Abra su navegador web.
2. Ingrese la URL del sistema proporcionada por su empresa.
3. El sistema mostrara la pantalla de inicio de sesion.

> **[Pantallazo: Pantalla de inicio de sesion del sistema]**

---

## 2. Primeros Pasos

### 2.1 Registrarse en el sistema

**Ruta:** `/registro`

Si aun no tiene una cuenta, siga estos pasos:

1. En la pantalla de inicio de sesion, haga clic en el enlace **"Registrarse"**.
2. Complete el formulario con los siguientes campos:
   - **Nombre**: Su nombre.
   - **Apellido**: Su apellido.
   - **Correo electronico**: Su email corporativo.
   - **Telefono**: Su numero de contacto.
   - **Contrasena**: Minimo 6 caracteres.
   - **Confirmar contrasena**: Repita la contrasena.
   - **Rol solicitado**: Seleccione el rol que desea (ventas, operaciones, bodega, etc.).
3. Haga clic en el boton **"Registrarse"**.
4. Vera un mensaje indicando que su solicitud fue enviada.
5. Espere a que un administrador apruebe su cuenta.

> **[Pantallazo: Formulario de registro con todos los campos completados]**

> **[Pantallazo: Mensaje de confirmacion de registro exitoso]**

> **Nota:** Su cuenta permanecera en estado **pendiente** hasta que un administrador la active desde Configuracion > Empleados.

---

### 2.2 Iniciar sesion

**Ruta:** `/login`

1. Ingrese su **correo electronico** en el primer campo.
2. Ingrese su **contrasena** en el segundo campo.
3. (Opcional) Haga clic en el icono de ojo para verificar su contrasena.
4. Haga clic en **"Iniciar Sesion"**.
5. El sistema lo redirigira al **Dashboard de Modulos**.

> **[Pantallazo: Pantalla de login con campos de correo y contrasena]**

> **Nota:** Si ingresa la contrasena incorrecta **5 veces** consecutivas, su cuenta se bloqueara por **15 minutos**.

---

### 2.3 Navegacion general — Dashboard de Modulos

**Ruta:** `/`

Al iniciar sesion exitosamente, vera el Dashboard de Modulos:

1. Observe la **barra superior** con:
   - Logo y nombre de la empresa (esquina izquierda).
   - Sus iniciales de usuario y boton de **cerrar sesion** (esquina derecha).
2. En el area principal vera **5 tarjetas de modulos**:
   - **Inventario** (azul) — Elementos fisicos: carpas, mesas, sillas, accesorios.
   - **Productos** (verde) — Plantillas de productos combinando elementos para cotizar.
   - **Alquileres** (morado) — Cotizaciones, contratos y gestion de alquileres.
   - **Operaciones** (naranja) — Montajes, desmontajes, ordenes de trabajo y equipos.
   - **Configuracion** (gris) — Datos maestros: ubicaciones, tarifas, empresa y empleados.
3. Haga clic en cualquier tarjeta para ingresar a ese modulo.

> **[Pantallazo: Dashboard de Modulos mostrando las 5 tarjetas de acceso rapido]**

4. Para **regresar** al Dashboard desde cualquier modulo, haga clic en **"Volver a Modulos"** en la barra lateral.
5. Para **cerrar sesion**, haga clic en su avatar (esquina superior derecha) y seleccione **"Cerrar sesion"**.

---

## 3. Roles y Permisos

El sistema tiene 5 roles predefinidos. Cada rol determina que puede ver y hacer el usuario:

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

**Resumen rapido por rol:**

- **Admin**: Acceso total. Gestiona empleados, configuracion y puede eliminar registros.
- **Gerente**: Crea y edita en la mayoria de modulos. No puede eliminar ni modificar configuracion del sistema.
- **Ventas**: Enfocado en cotizaciones, alquileres y clientes. Puede ver inventario y reportes.
- **Operaciones**: Enfocado en ordenes de trabajo. Puede editar inventario (mover elementos entre ubicaciones).
- **Bodega**: Enfocado en inventario fisico. Crea y edita stock, series y lotes.

> **Nota:** Si intenta acceder a una funcion no permitida para su rol, el sistema mostrara un mensaje de **"Permiso denegado"**.

---

## 4. Modulo de Inventario

### 4.1 Acceder al modulo de Inventario

1. Desde el Dashboard de Modulos, haga clic en la tarjeta **"Inventario"** (azul).
2. Se abrira la vista principal del inventario mostrando las **categorias principales** en formato de tarjetas.

> **[Pantallazo: Vista principal del modulo de Inventario con categorias en tarjetas]**

---

### 4.2 Dashboard analitico de Inventario

**Ruta:** `/inventario/dashboard`

1. Desde la vista principal de Inventario, haga clic en el boton **"Dashboard"** (icono de graficos).
2. Se mostrara un panel con:
   - **Tarjetas KPI**: Total de elementos, total de categorias, valor del inventario, alertas de stock bajo.
   - **Graficos**: Distribucion por estado (nuevo, bueno, mantenimiento, alquilado, danado).
   - **Top categorias** por cantidad.
   - **Inventario por ubicacion**.
   - **Tabla de alertas** de stock bajo con indicadores de severidad.

> **[Pantallazo: Dashboard analitico con KPIs y graficos de distribucion]**

3. Para **exportar el inventario a Excel**, haga clic en el boton **"Exportar a Excel"**.

---

### 4.3 Navegar la jerarquia de categorias

El inventario se organiza en tres niveles: **Categoria > Subcategoria > Elemento**.

#### 4.3.1 Ver subcategorias de una categoria

1. En la vista principal de Inventario, haga clic en la tarjeta de una **categoria** (ej: "Carpas").
2. Se mostrara la lista de **subcategorias** dentro de esa categoria.

> **[Pantallazo: Vista de subcategorias dentro de una categoria]**

#### 4.3.2 Ver elementos de una subcategoria

1. Dentro de la lista de subcategorias, haga clic en una **subcategoria** (ej: "Carpa P10").
2. Se mostrara la lista de **elementos** que pertenecen a esa subcategoria.
3. Puede alternar entre **vista de tarjetas** y **vista de lista** con los iconos en la esquina superior.

> **[Pantallazo: Lista de elementos en una subcategoria con vista de tarjetas]**

#### 4.3.3 Buscar categorias o elementos

1. En la vista principal de Inventario, ubique el **campo de busqueda** en la parte superior.
2. Escriba al menos **2 caracteres** del nombre que busca.
3. El sistema mostrara resultados coincidentes de categorias y elementos.
4. Haga clic en un resultado para navegar directamente a el.

> **[Pantallazo: Resultados de busqueda global mostrando categorias y elementos]**

---

### 4.4 Gestionar categorias

#### 4.4.1 Crear una nueva categoria

1. En la vista principal de Inventario, haga clic en el boton **"+ Nueva Categoria"**.
2. En el formulario que aparece, ingrese:
   - **Nombre**: Nombre de la categoria (ej: "Carpas").
   - **Descripcion** (opcional): Detalle adicional.
3. Haga clic en **"Guardar"**.
4. La nueva categoria aparecera en la lista de tarjetas.

> **[Pantallazo: Formulario de creacion de categoria]**

#### 4.4.2 Editar una categoria

1. Ubique la tarjeta de la categoria que desea editar.
2. Haga clic en el **icono de editar** (lapiz) en la tarjeta.
3. Modifique los campos necesarios.
4. Haga clic en **"Guardar"**.

#### 4.4.3 Crear una subcategoria

1. Haga clic en la tarjeta de la categoria padre para ver sus subcategorias.
2. Haga clic en **"+ Nueva Subcategoria"**.
3. Complete el nombre y descripcion.
4. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de subcategoria]**

#### 4.4.4 Eliminar una categoria o subcategoria

> **Nota:** Solo el rol **Admin** puede eliminar. La categoria debe estar vacia (sin subcategorias o elementos).

1. Ubique la tarjeta de la categoria/subcategoria.
2. Haga clic en el **icono de eliminar** (papelera).
3. Confirme la eliminacion en el dialogo de confirmacion.

---

### 4.5 Gestionar elementos

#### 4.5.1 Crear un nuevo elemento

1. Navegue a una subcategoria (ver [4.3.2](#432-ver-elementos-de-una-subcategoria)).
2. Haga clic en el boton **"+ Nuevo Elemento"**.
3. Complete los campos del formulario:
   - **Nombre**: Nombre descriptivo (ej: "Carpa blanca 3x3").
   - **Descripcion** (opcional): Detalle del elemento.
   - **Precio**: Precio de alquiler.
   - **Stock minimo**: Cantidad minima deseada en inventario.
   - **Requiere series**: Active esta opcion si desea rastrear cada unidad individualmente con numero de serie. Dejela desactivada para manejar el elemento por lotes (cantidades).
4. Haga clic en **"Guardar"**.

> **[Pantallazo: Modal de creacion de elemento con campos completados]**

#### 4.5.2 Ver detalle de un elemento

1. En la lista de elementos, haga clic en el **nombre o tarjeta** del elemento.
2. Se abrira la pagina de detalle mostrando:
   - Informacion general (nombre, descripcion, precio, stock minimo).
   - Imagenes del elemento.
   - Estadisticas de unidades por estado y ubicacion.
   - Lista de series o lotes (segun el tipo de elemento).

> **[Pantallazo: Pagina de detalle de un elemento con informacion general y estadisticas]**

#### 4.5.3 Subir imagenes a un elemento

1. En la pagina de detalle del elemento, ubique la seccion de **imagenes**.
2. Haga clic en **"Subir imagen"** o arrastre un archivo de imagen.
3. La imagen se mostrara en la galeria del elemento.
4. Para eliminar una imagen, haga clic en el **icono X** sobre la imagen.

> **[Pantallazo: Seccion de imagenes de un elemento con galeria]**

#### 4.5.4 Editar un elemento

1. En la pagina de detalle del elemento, haga clic en **"Editar"**.
2. Modifique los campos necesarios.
3. Haga clic en **"Guardar"**.

#### 4.5.5 Eliminar un elemento

> **Nota:** Solo el rol **Admin** puede eliminar elementos.

1. En la pagina de detalle o en la lista, haga clic en el **icono de eliminar**.
2. Confirme la accion en el dialogo de confirmacion.

---

### 4.6 Gestionar series (unidades individuales)

> Aplica para elementos con **"Requiere series"** activado.

#### 4.6.1 Ver lista de series

1. En la pagina de detalle de un elemento, desplacese a la seccion **"Series"**.
2. Vera una lista de todas las unidades individuales con su:
   - Numero de serie.
   - Estado (disponible, alquilado, mantenimiento, danado).
   - Ubicacion actual.
   - Observaciones.
3. Use los **filtros** para buscar por estado o ubicacion.

> **[Pantallazo: Lista de series de un elemento con filtros de estado y ubicacion]**

#### 4.6.2 Agregar una nueva serie

1. En la seccion de series, haga clic en **"+ Nueva Serie"**.
2. Ingrese:
   - **Numero de serie**: Identificador unico de la unidad.
   - **Estado**: Estado inicial (normalmente "disponible").
   - **Ubicacion**: Donde se almacena la unidad.
   - **Observaciones** (opcional).
3. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de nueva serie]**

#### 4.6.3 Editar una serie

1. En la lista de series, haga clic en el **icono de editar** de la serie deseada.
2. Modifique el estado, ubicacion u observaciones.
3. Haga clic en **"Guardar"**.

#### 4.6.4 Mover una serie entre ubicaciones

1. En la lista de series, ubique la serie que desea mover.
2. Haga clic en **"Mover"**.
3. Seleccione la **nueva ubicacion** de destino.
4. Confirme el movimiento.

#### 4.6.5 Retornar una serie a bodega

1. En la lista de series, ubique la serie que desea retornar.
2. Haga clic en **"Retornar"**.
3. Seleccione la **bodega** de destino.
4. Confirme la accion. El estado cambiara a "disponible".

---

### 4.7 Gestionar lotes (cantidades por ubicacion)

> Aplica para elementos **sin** "Requiere series" (gestion por cantidad).

#### 4.7.1 Ver inventario distribuido por ubicacion

1. En la pagina de detalle de un elemento (tipo lote), desplacese a la seccion **"Lotes"**.
2. Vera una tabla con la distribucion de cantidades por ubicacion.

> **[Pantallazo: Vista de lotes mostrando cantidades por ubicacion]**

#### 4.7.2 Agregar un nuevo lote

1. Haga clic en **"+ Nuevo Lote"**.
2. Ingrese:
   - **Cantidad**: Numero de unidades.
   - **Ubicacion**: Donde se almacenan.
   - **Estado**: Estado del lote.
   - **Observaciones** (opcional).
3. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de lote]**

#### 4.7.3 Editar un lote

1. En la lista de lotes, haga clic en el **icono de editar** del lote.
2. Modifique los campos necesarios.
3. Haga clic en **"Guardar"**.

#### 4.7.4 Mover cantidades entre ubicaciones

1. Ubique el lote que desea mover.
2. Haga clic en **"Mover"**.
3. Indique la **cantidad** a mover y la **ubicacion destino**.
4. Confirme el movimiento.

#### 4.7.5 Retornar un lote a bodega

1. Ubique el lote a retornar.
2. Haga clic en **"Retornar"**.
3. Seleccione la bodega de destino y confirme.

---

### 4.8 Ubicaciones

Las ubicaciones se dividen en dos tipos:
- **Almacenamiento**: Bodegas y talleres donde se guardan elementos.
- **Destinos de eventos**: Lugares donde se realizan los eventos, agrupados por ciudad.

> La gestion de ubicaciones se realiza desde **Configuracion > Ubicaciones** (ver [Seccion 8.3](#83-ubicaciones-y-destinos)).

---

## 5. Modulo de Productos

### 5.1 Que son los productos compuestos?

Un producto compuesto es una **plantilla** que agrupa varios elementos individuales del inventario en un solo producto para alquiler. Por ejemplo, una "Carpa P10 Completa" puede incluir: 1 estructura de carpa, 4 paredes laterales, 1 techo y 8 estacas.

Estos productos se usan al crear cotizaciones, facilitando la seleccion de paquetes completos.

---

### 5.2 Acceder al modulo de Productos

1. Desde el Dashboard de Modulos, haga clic en la tarjeta **"Productos"** (verde).
2. Se abrira la vista de productos compuestos organizada por categorias y subcategorias.

> **[Pantallazo: Vista principal del modulo de Productos con categorias de productos]**

---

### 5.3 Navegar categorias de productos

La organizacion es similar al inventario: **Categoria > Subcategoria > Producto compuesto**.

1. Vera las **categorias de productos** en formato de tarjetas (ej: Carpas, Parasoles).
2. Haga clic en una categoria para ver sus **subcategorias** (ej: P10, P14).
3. Haga clic en una subcategoria para ver los **productos compuestos** disponibles.

> **[Pantallazo: Navegacion de categorias y subcategorias de productos]**

---

### 5.4 Crear un producto compuesto

1. Navegue hasta la subcategoria donde desea crear el producto.
2. Haga clic en **"+ Crear Producto"**.
3. En el formulario, complete:
   - **Nombre**: Nombre del producto (ej: "Carpa P10 Blanca Completa").
   - **Descripcion** (opcional): Detalle del paquete.
4. En la seccion **"Componentes"**, agregue los elementos que conforman el producto:
   - Haga clic en **"+ Agregar Componente"**.
   - **Seleccione el elemento** del inventario desde la lista desplegable.
   - **Indique la cantidad** de ese elemento en el paquete.
   - Repita para cada elemento que compone el producto.
5. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de producto compuesto con componentes agregados]**

---

### 5.5 Editar un producto compuesto

1. Ubique el producto en la lista de la subcategoria.
2. Haga clic en el **icono de editar** (lapiz).
3. Modifique nombre, descripcion o componentes:
   - Para **agregar** un componente: haga clic en **"+ Agregar Componente"**.
   - Para **quitar** un componente: haga clic en el icono **X** junto al componente.
   - Para **cambiar la cantidad**: modifique el campo de cantidad.
4. Haga clic en **"Guardar"**.

> **[Pantallazo: Edicion de un producto compuesto mostrando la lista de componentes]**

---

### 5.6 Eliminar un producto compuesto

> **Nota:** Solo los roles **Admin** y **Gerente** pueden eliminar productos.

1. Ubique el producto en la lista.
2. Haga clic en el **icono de eliminar** (papelera).
3. Confirme la eliminacion en el dialogo de confirmacion.

---

## 6. Modulo de Alquileres

### 6.1 Acceder y navegar el modulo

1. Desde el Dashboard de Modulos, haga clic en la tarjeta **"Alquileres"** (morada).
2. Se abrira el modulo con una **barra lateral** de navegacion a la izquierda con las siguientes secciones:
   - **Cotizaciones** — Crear y gestionar cotizaciones.
   - **Alquileres** — Gestionar alquileres activos.
   - **Clientes** — Base de datos de clientes.
   - **Transporte** — Tarifas de transporte por ciudad.
   - **Calendario** — Vista de calendario de eventos.
   - **Reportes** — Analisis y estadisticas.
   - **Historial Alquileres** — Alquileres completados/cancelados.
   - **Historial Eventos** — Eventos pasados.
   - **Configuracion** (desplegable):
     - Descuentos
     - Impuestos (IVA)
     - Dias Extra
3. Haga clic en cualquier opcion de la barra lateral para navegar a esa seccion.

> **[Pantallazo: Modulo de Alquileres mostrando la barra lateral con todas las opciones]**

---

### 6.2 Cotizaciones

**Ruta:** `/alquileres/cotizaciones`

#### 6.2.1 Ver lista de cotizaciones

1. En la barra lateral, haga clic en **"Cotizaciones"**.
2. Vera la lista de todas las cotizaciones con:
   - Nombre del evento.
   - Cliente.
   - Fecha.
   - Estado (En revision, Aceptada, Rechazada, Cancelada).
   - Total.
3. Use los **filtros** en la parte superior para filtrar por estado.
4. Use el **campo de busqueda** para buscar por nombre de evento o cliente.

> **[Pantallazo: Lista de cotizaciones con filtros y busqueda]**

#### 6.2.2 Crear una nueva cotizacion

1. En la pagina de Cotizaciones, haga clic en **"+ Nueva Cotizacion"**.
2. **Seleccione un cliente**:
   - Busque un cliente existente en el campo de busqueda.
   - O haga clic en **"+ Nuevo Cliente"** para crear uno nuevo (ver [6.5.2](#652-crear-un-nuevo-cliente)).
3. **Defina las fechas** del evento:
   - **Fecha de montaje**: Cuando se armaran los equipos.
   - **Fecha de evento**: Cuando es el evento.
   - **Fecha de desmontaje**: Cuando se retiraran los equipos.
4. **Defina la ubicacion** del evento (ciudad y destino).
5. Haga clic en **"Siguiente"** o continue al paso de productos.

> **[Pantallazo: Formulario de nueva cotizacion — seccion de cliente y fechas]**

6. **Agregue productos** al pedido:
   - Haga clic en **"+ Agregar Producto"**.
   - Seleccione un **producto compuesto** de la lista (las plantillas creadas en el modulo de Productos).
   - Indique la **cantidad**.
   - Repita para cada producto necesario.
7. **Aplique descuentos** si corresponde:
   - Haga clic en **"Agregar Descuento"**.
   - Seleccione un descuento predefinido o ingrese un monto/porcentaje manual.

> **[Pantallazo: Seccion de productos de la cotizacion con productos agregados]**

8. **Revise el resumen de totales**:
   - Subtotal.
   - Descuentos aplicados.
   - Transporte (calculado automaticamente segun la ciudad).
   - Impuestos (IVA).
   - **Total**.
9. Haga clic en **"Guardar Cotizacion"**.

> **[Pantallazo: Resumen de totales de la cotizacion antes de guardar]**

#### 6.2.3 Generar PDF de una cotizacion

1. Abra el detalle de una cotizacion haciendo clic sobre ella en la lista.
2. Haga clic en el boton **"Generar PDF"**.
3. Se descargara un documento PDF con el detalle de la cotizacion para enviar al cliente.

> **[Pantallazo: Vista previa o boton de generacion de PDF de cotizacion]**

#### 6.2.4 Editar una cotizacion

1. En la lista de cotizaciones, ubique la cotizacion deseada.
2. Haga clic en el **icono de editar** o abra el detalle y haga clic en **"Editar"**.
3. Modifique productos, fechas, descuentos o cualquier campo necesario.
4. Haga clic en **"Guardar"**.

#### 6.2.5 Convertir cotizacion a alquiler

> Cuando el cliente confirma la cotizacion:

1. Abra el detalle de la cotizacion.
2. Haga clic en **"Convertir a Alquiler"**.
3. Confirme la accion.
4. El sistema creara un **alquiler activo** y generara automaticamente las **ordenes de trabajo** de montaje y desmontaje.

> **[Pantallazo: Boton de conversion de cotizacion a alquiler y dialogo de confirmacion]**

---

### 6.3 Gestion de Alquileres

**Ruta:** `/alquileres/gestion`

#### 6.3.1 Ver lista de alquileres

1. En la barra lateral, haga clic en **"Alquileres"**.
2. Vera el panel de gestion con:
   - **Estadisticas rapidas**: Cantidad de activos, pendientes y vencidos.
   - **Filtros por estado**: Activo, Pendiente, Completado, Vencido, Cancelado.
   - **Lista de alquileres** con informacion resumida.
3. Use la **busqueda** para encontrar por nombre de evento, cliente o productos.

> **[Pantallazo: Panel de gestion de alquileres con estadisticas y filtros]**

#### 6.3.2 Ver detalle de un alquiler

1. En la lista, haga clic en el **nombre o tarjeta** del alquiler.
2. Se abrira la pagina de detalle con:
   - **Informacion basica**: Evento, cliente, fechas, ubicacion.
   - **Resumen financiero**: Total, anticipo, saldo, impuestos.
   - **Linea de tiempo**: Progreso del alquiler (cotizacion → salida → retorno).
   - **Galeria de fotos**.
   - **Registro de novedades** e incidentes.

> **[Pantallazo: Pagina de detalle de un alquiler mostrando informacion y linea de tiempo]**

#### 6.3.3 Cancelar un alquiler

1. Abra el detalle del alquiler.
2. Haga clic en **"Cancelar Alquiler"**.
3. Confirme la cancelacion en el dialogo.

> **Nota:** Al cancelar, los elementos asociados pueden volver al estado "disponible".

#### 6.3.4 Extender la duracion de un alquiler

1. Abra el detalle del alquiler.
2. Haga clic en **"Extender"**.
3. Indique la **nueva fecha de desmontaje**.
4. Revise los recargos por dias adicionales (si aplica).
5. Confirme la extension.

---

### 6.4 Eventos

**Ruta:** `/alquileres/gestion`

Los alquileres se visualizan como **eventos**. Cada evento agrupa la informacion del alquiler con sus ordenes de trabajo asociadas.

1. En la vista de gestion, cada tarjeta de evento muestra:
   - Nombre del evento y cliente.
   - Fechas (montaje, evento, desmontaje).
   - Estado actual.
   - Productos incluidos.
2. Haga clic en una tarjeta para ver el **detalle completo** del evento.

> **[Pantallazo: Tarjetas de eventos en la vista de gestion de alquileres]**

---

### 6.5 Clientes

**Ruta:** `/alquileres/clientes`

#### 6.5.1 Ver lista de clientes

1. En la barra lateral, haga clic en **"Clientes"**.
2. Vera la lista de todos los clientes registrados con:
   - Nombre.
   - Contacto (telefono, email).
   - Cantidad de eventos.
3. Use el **campo de busqueda** para encontrar clientes.

> **[Pantallazo: Lista de clientes con busqueda]**

#### 6.5.2 Crear un nuevo cliente

1. Haga clic en **"+ Nuevo Cliente"**.
2. Complete los datos:
   - **Nombre** del cliente o empresa.
   - **Telefono**.
   - **Correo electronico**.
   - **Direccion** (opcional).
   - **Ciudad**.
   - **Notas** (opcional).
3. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de cliente]**

#### 6.5.3 Editar un cliente

1. En la lista, haga clic en el **icono de editar** del cliente.
2. Modifique los campos necesarios.
3. Haga clic en **"Guardar"**.

#### 6.5.4 Ver historial de un cliente

1. Haga clic en el **nombre del cliente** para ver su detalle.
2. Vera el historial de eventos pasados del cliente.
3. Para **repetir un evento**, haga clic en **"Repetir Evento"** junto a un evento anterior. Esto creara una nueva cotizacion basada en ese evento.

> **[Pantallazo: Detalle de cliente con historial de eventos y opcion de repetir]**

---

### 6.6 Calendario

**Ruta:** `/alquileres/calendario`

1. En la barra lateral, haga clic en **"Calendario"**.
2. Vera un calendario mensual con los eventos codificados por color:
   - **Verde**: Montaje.
   - **Morado**: Evento.
   - **Naranja**: Desmontaje.
3. Use las **flechas** para navegar entre meses.
4. Use los **filtros** para mostrar/ocultar eventos por tipo o estado.
5. **Haga clic en un evento** en el calendario para ver su resumen en un popup.
6. **Haga clic en una fecha** para ver todas las cotizaciones programadas para ese dia.

> **[Pantallazo: Vista de calendario mensual con eventos codificados por color]**

> **[Pantallazo: Popup de resumen al hacer clic en un evento del calendario]**

---

### 6.7 Tarifas de Transporte

**Ruta:** `/alquileres/transporte`

1. En la barra lateral, haga clic en **"Transporte"**.
2. Vera una tabla con las tarifas por ciudad y tipo de camion:
   - **Pequeno**, **Mediano**, **Grande**, **Extragrande**.
3. Use los **filtros** para buscar por departamento o ciudad.
4. Haga clic en una ciudad para ver o editar sus tarifas.

> **[Pantallazo: Tabla de tarifas de transporte por ciudad y tipo de camion]**

> **Nota:** Las tarifas se configuran desde **Configuracion > Ciudades** (ver [Seccion 8.2](#82-ciudades-y-tarifas-de-transporte)).

---

### 6.8 Descuentos

**Ruta:** `/alquileres/descuentos`

#### 6.8.1 Ver descuentos disponibles

1. En la barra lateral, expanda **"Configuracion"** y haga clic en **"Descuentos"**.
2. Vera la lista de descuentos predefinidos con:
   - Nombre del descuento.
   - Tipo (porcentaje o monto fijo).
   - Valor.
   - Estado (activo/inactivo).

> **[Pantallazo: Lista de descuentos predefinidos]**

#### 6.8.2 Crear un descuento

1. Haga clic en **"+ Nuevo Descuento"**.
2. Complete:
   - **Nombre**: Descripcion del descuento (ej: "Descuento 10% por volumen").
   - **Tipo**: Porcentaje o Monto fijo.
   - **Valor**: El porcentaje o monto del descuento.
3. Haga clic en **"Guardar"**.

#### 6.8.3 Activar o desactivar un descuento

1. En la lista de descuentos, ubique el descuento.
2. Haga clic en el **interruptor de estado** para activar o desactivar.
3. Los descuentos inactivos no aparecen al crear cotizaciones.

---

### 6.9 Historial

#### 6.9.1 Historial de alquileres

**Ruta:** `/alquileres/historial`

1. En la barra lateral, haga clic en **"Historial Alquileres"**.
2. Vera el registro de alquileres **completados** y **cancelados**.
3. Use filtros de busqueda y fecha para encontrar registros especificos.

> **[Pantallazo: Historial de alquileres con filtros]**

#### 6.9.2 Historial de eventos

**Ruta:** `/alquileres/historial-eventos`

1. En la barra lateral, haga clic en **"Historial Eventos"**.
2. Vera eventos pasados con la opcion de **repetir** un evento creando una nueva cotizacion basada en el.

> **[Pantallazo: Historial de eventos pasados con opcion de repetir]**

---

### 6.10 Reportes

**Ruta:** `/alquileres/reportes`

1. En la barra lateral, haga clic en **"Reportes"**.
2. Vera las **tarjetas KPI** con:
   - Ingresos totales.
   - Alquileres activos.
   - Valor promedio de alquiler.
   - Alquileres completados.
3. Seleccione un **periodo** de analisis con los filtros:
   - Todo el historial.
   - Por mes (con flechas para navegar entre meses).
   - Por semestre.
   - Por ano.
4. Revise los **graficos** disponibles:
   - **Tendencia de ingresos**: Evolucion de ingresos en el periodo.
   - **Top clientes**: Clientes con mayor facturacion.
   - **Top productos**: Productos mas alquilados.
   - **Ingresos por categoria**: Distribucion de ingresos.

> **[Pantallazo: Dashboard de reportes con KPIs y graficos de tendencia]**

> **[Pantallazo: Graficos de top clientes y top productos]**

---

## 7. Modulo de Operaciones

### 7.1 Acceder al modulo

1. Desde el Dashboard de Modulos, haga clic en la tarjeta **"Operaciones"** (naranja).
2. Se abrira el modulo con una **barra lateral** con las secciones:
   - **Dashboard** — Resumen de ordenes del dia.
   - **Ordenes de Trabajo** — Lista completa de ordenes.
   - **Calendario** — Vista de calendario de operaciones.
   - **Alertas** — Notificaciones y alertas del sistema.
   - **Historial** — Ordenes completadas.

> **[Pantallazo: Modulo de Operaciones con barra lateral y dashboard]**

---

### 7.2 Dashboard de Operaciones

**Ruta:** `/operaciones`

1. Al ingresar al modulo, el dashboard muestra:
   - **Estadisticas**: Ordenes pendientes, en progreso y completadas hoy.
   - **Panel de alertas** con problemas de asignacion o conflictos.
   - **Ordenes agrupadas por alquiler/evento**.
2. Haga clic en cualquier orden para ver su detalle.
3. Use el filtro de **rango de fechas** (Hoy, Proximos 7 dias, etc.) para ajustar la vista.

> **[Pantallazo: Dashboard de operaciones con estadisticas y ordenes agrupadas]**

---

### 7.3 Ordenes de Trabajo

**Ruta:** `/operaciones/ordenes`

#### 7.3.1 Ver lista de ordenes

1. En la barra lateral, haga clic en **"Ordenes de Trabajo"**.
2. Vera la lista de todas las ordenes con:
   - Tipo de orden.
   - Evento/alquiler asociado.
   - Fecha programada.
   - Estado actual.
   - Responsable asignado.
3. Use los **filtros** para buscar por estado, tipo o responsable.

> **[Pantallazo: Lista de ordenes de trabajo con filtros]**

#### 7.3.2 Tipos de ordenes

Las ordenes pueden ser de estos tipos:
- **Montaje**: Armado de carpas y equipos en el lugar del evento.
- **Desmontaje**: Desarmado y retiro de equipos.
- **Mantenimiento**: Reparacion o mantenimiento de elementos.
- **Traslado**: Movimiento de equipos entre ubicaciones.
- **Revision**: Inspeccion de equipos.
- **Inventario**: Conteo o verificacion de stock.
- **Otro**: Cualquier otra actividad.

#### 7.3.3 Crear una orden manual

> **Nota:** Las ordenes de montaje y desmontaje se generan **automaticamente** al convertir una cotizacion en alquiler. Use esta opcion para ordenes adicionales.

1. En la lista de ordenes, haga clic en **"+ Nueva Orden"**.
2. Complete los campos:
   - **Tipo de orden**: Seleccione el tipo (montaje, desmontaje, mantenimiento, etc.).
   - **Fecha programada**: Cuando se realizara.
   - **Ubicacion**: Donde se ejecutara.
   - **Elementos**: Agregue los elementos que se incluyen en la orden.
   - **Responsable**: Asigne un empleado responsable.
3. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de orden de trabajo]**

#### 7.3.4 Ver detalle de una orden

1. Haga clic en una orden de la lista.
2. La pagina de detalle muestra:
   - **Informacion de la orden**: Tipo, fechas, ubicacion.
   - **Lista de elementos** con cantidades.
   - **Equipo y responsable** asignado.
   - **Flujo de estados** con botones para avanzar.
   - **Documentacion** con fotos.
   - **Registro de novedades** e incidentes.
   - **Checklist** de carga/descarga.

> **[Pantallazo: Detalle de una orden de trabajo con informacion completa]**

#### 7.3.5 Cambiar el estado de una orden

Los estados siguen este flujo:

```
Pendiente → Confirmado → En preparacion → En ruta → En sitio → En proceso → Completado
```

Tambien es posible **cancelar** una orden en cualquier momento.

1. Abra el detalle de la orden.
2. Haga clic en el boton de **accion de estado** correspondiente:
   - **"Confirmar"** — Pasar de Pendiente a Confirmado.
   - **"Preparar"** — Iniciar la preparacion de elementos.
   - **"Iniciar Ruta"** — El equipo salio hacia el sitio.
   - **"Llegar a Sitio"** — El equipo llego al lugar.
   - **"Iniciar"** — Comenzar el trabajo en sitio.
   - **"Completar"** — Finalizar la orden.
3. El sistema actualiza el estado y registra la fecha/hora del cambio.

> **[Pantallazo: Flujo de estados de una orden con botones de accion]**

#### 7.3.6 Documentar con fotos

1. En el detalle de la orden, ubique la seccion de **"Documentacion"**.
2. Haga clic en **"Subir Foto"**.
3. Seleccione la imagen o tome una foto (en dispositivos moviles).
4. La foto se agregara a la galeria de la orden.

> **[Pantallazo: Seccion de documentacion con fotos de una orden]**

#### 7.3.7 Registrar novedades o incidentes

1. En el detalle de la orden, ubique la seccion de **"Novedades"**.
2. Haga clic en **"+ Nueva Novedad"**.
3. Describa la novedad o incidente.
4. Haga clic en **"Guardar"**.

---

### 7.4 Calendario de Operaciones

**Ruta:** `/operaciones/calendario`

1. En la barra lateral, haga clic en **"Calendario"**.
2. Vera un calendario con todas las ordenes de trabajo codificadas por color:
   - **Verde**: Montaje.
   - **Naranja**: Desmontaje.
   - Colores **mas claros** para ordenes completadas.
3. Use los **filtros** para mostrar/ocultar por tipo de orden.
4. Haga clic en una orden del calendario para ver su resumen.
5. Use las flechas para navegar entre meses.

> **[Pantallazo: Calendario de operaciones con ordenes codificadas por color]**

---

### 7.5 Sistema de Alertas

**Ruta:** `/operaciones/alertas`

1. En la barra lateral, haga clic en **"Alertas"**.
2. Vera todas las alertas activas del sistema, clasificadas por:
   - **Tipo**: Retornos vencidos, montajes vencidos, retornos proximos, conflictos de disponibilidad, conflictos de fechas, conflictos de equipos, incidencias.
   - **Severidad**: Baja, Media, Alta, Critica.
3. Para cada alerta puede:
   - **Marcar como leida**: Haga clic en **"Leida"** (se oculta por 1 dia).
   - **Marcar como resuelta**: Haga clic en **"Resuelta"** (se oculta por 7 dias).
   - **Navegar al origen**: Haga clic en **"Ver"** para ir al alquiler u orden relacionada.

> **[Pantallazo: Panel de alertas con diferentes tipos y niveles de severidad]**

---

### 7.6 Historial de Ordenes

**Ruta:** `/operaciones/historial`

1. En la barra lateral, haga clic en **"Historial"**.
2. Vera el registro de ordenes **completadas**.
3. Use los filtros de **busqueda** y **fecha** para encontrar ordenes especificas.

> **[Pantallazo: Historial de ordenes completadas con filtros]**

---

## 8. Configuracion

### 8.1 Acceder al modulo de Configuracion

1. Desde el Dashboard de Modulos, haga clic en la tarjeta **"Configuracion"** (gris).
2. Vera un hub con tarjetas de acceso a las diferentes secciones:
   - **Ciudades** — Catalogo de ciudades y tarifas de transporte.
   - **Ubicaciones y Destinos** — Bodegas, talleres y destinos de eventos.
   - **Datos de Empresa** — Informacion de su empresa.
   - **Empleados** — Gestion de usuarios (solo Admin/Gerente).

> **[Pantallazo: Hub de configuracion con las tarjetas de acceso]**

---

### 8.2 Datos de Empresa

**Ruta:** `/configuracion/empresa`

1. Haga clic en la tarjeta **"Datos de Empresa"**.
2. Vera el formulario con la informacion de su empresa.
3. Para **subir o cambiar el logo**:
   - Haga clic en el area del logo o en **"Subir Logo"**.
   - Seleccione una imagen.
   - El logo se previsualizara inmediatamente.
   - Para eliminar el logo, haga clic en el **icono X** sobre la imagen.
4. Complete o modifique los campos:
   - **Nombre de la empresa**.
   - **NIT** (identificacion tributaria).
   - **Direccion**.
   - **Telefono**.
   - **Correo electronico**.
   - **Persona de contacto**.
5. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de datos de empresa con logo y campos de informacion]**

---

### 8.3 Ciudades y Tarifas de Transporte

**Ruta:** `/configuracion/ciudades`

#### 8.3.1 Ver catalogo de ciudades

1. Haga clic en la tarjeta **"Ciudades"**.
2. Vera la lista de ciudades organizadas por departamento.
3. Use el **campo de busqueda** para encontrar una ciudad especifica.
4. Use los **filtros** para filtrar por departamento.

> **[Pantallazo: Catalogo de ciudades organizado por departamento]**

#### 8.3.2 Agregar una nueva ciudad

1. Haga clic en **"+ Nueva Ciudad"**.
2. Complete los campos:
   - **Nombre** de la ciudad.
   - **Departamento**: Seleccione uno existente o cree uno nuevo.
   - **Estado**: Activa o inactiva.
3. Defina las **tarifas de transporte** por tipo de camion:
   - **Camion Pequeno**: Tarifa en pesos.
   - **Camion Mediano**: Tarifa en pesos.
   - **Camion Grande**: Tarifa en pesos.
   - **Camion Extragrande**: Tarifa en pesos.
4. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de ciudad con tarifas de transporte]**

#### 8.3.3 Editar una ciudad y sus tarifas

1. En la lista, haga clic en el **icono de editar** de la ciudad.
2. Modifique los campos o tarifas necesarios.
3. Haga clic en **"Guardar"**.

#### 8.3.4 Activar o desactivar una ciudad

1. En la lista, ubique la ciudad.
2. Haga clic en el **interruptor de estado** para activar o desactivar.
3. Las ciudades inactivas no aparecen al crear cotizaciones.

---

### 8.4 Ubicaciones y Destinos

**Ruta:** `/configuracion/ubicaciones`

#### 8.4.1 Ver ubicaciones

1. Haga clic en la tarjeta **"Ubicaciones y Destinos"**.
2. Vera dos secciones:
   - **Almacenamiento**: Bodegas y talleres.
   - **Destinos de eventos**: Ubicaciones de eventos agrupadas por ciudad.

> **[Pantallazo: Vista de ubicaciones con seccion de almacenamiento y destinos]**

#### 8.4.2 Crear una ubicacion de almacenamiento

1. En la seccion **"Almacenamiento"**, haga clic en **"+ Nueva Ubicacion"**.
2. Complete:
   - **Nombre**: Nombre de la bodega o taller (ej: "Bodega Principal").
   - **Tipo**: Bodega o Taller.
   - **Direccion** (opcional).
3. Haga clic en **"Guardar"**.

> **[Pantallazo: Formulario de creacion de ubicacion de almacenamiento]**

#### 8.4.3 Crear un destino de evento

1. En la seccion **"Destinos de eventos"**, haga clic en **"+ Nuevo Destino"**.
2. Complete:
   - **Nombre** del destino.
   - **Ciudad**: Seleccione la ciudad.
   - **Direccion** (opcional).
3. Haga clic en **"Guardar"**.

#### 8.4.4 Editar o eliminar una ubicacion

1. Ubique la ubicacion en la lista.
2. Haga clic en el **icono de editar** para modificar o el **icono de eliminar** para borrar.
3. Si edita, modifique los campos y haga clic en **"Guardar"**.
4. Si elimina, confirme en el dialogo de confirmacion.

---

### 8.5 Gestion de Empleados

**Ruta:** `/configuracion/empleados`

> **Nota:** Solo los roles **Admin** y **Gerente** tienen acceso a esta seccion.

#### 8.5.1 Ver lista de empleados

1. Haga clic en la tarjeta **"Empleados"**.
2. Vera la lista de empleados con:
   - Nombre completo.
   - Rol asignado.
   - Estado (pendiente, activo, inactivo).
3. Use los **filtros** para buscar por nombre, rol o estado.

> **[Pantallazo: Lista de empleados con filtros por nombre, rol y estado]**

#### 8.5.2 Aprobar una solicitud de registro pendiente

1. Filtre la lista por estado **"Pendiente"**.
2. Ubique la solicitud del nuevo empleado.
3. Haga clic en **"Aprobar"**.
4. El empleado podra iniciar sesion con su cuenta.

> **[Pantallazo: Solicitud de registro pendiente con boton de aprobar]**

#### 8.5.3 Rechazar una solicitud de registro

1. Filtre la lista por estado **"Pendiente"**.
2. Ubique la solicitud.
3. Haga clic en **"Rechazar"**.
4. Ingrese el **motivo del rechazo**.
5. Confirme la accion.

#### 8.5.4 Editar datos y rol de un empleado

1. En la lista, haga clic en el **icono de editar** del empleado.
2. Modifique los campos necesarios:
   - **Nombre**, **Apellido**, **Telefono**.
   - **Rol**: Cambie el rol asignado (admin, gerente, ventas, operaciones, bodega).
3. Haga clic en **"Guardar"**.

#### 8.5.5 Desactivar un empleado

1. Ubique el empleado activo en la lista.
2. Haga clic en **"Desactivar"**.
3. Confirme la accion. El empleado no podra iniciar sesion.

#### 8.5.6 Reactivar un empleado

1. Filtre por estado **"Inactivo"**.
2. Ubique el empleado.
3. Haga clic en **"Reactivar"**.
4. El empleado podra iniciar sesion nuevamente.

---

### 8.6 Impuestos (IVA)

**Ruta:** `/alquileres/configuracion/impuestos`

1. Desde el modulo de **Alquileres**, expanda **"Configuracion"** en la barra lateral.
2. Haga clic en **"Impuestos (IVA)"**.
3. Vera el porcentaje de IVA configurado actualmente.
4. Para modificarlo, ingrese el nuevo **porcentaje**.
5. Haga clic en **"Guardar"**.

> **[Pantallazo: Configuracion de porcentaje de IVA]**

> **Nota:** Este porcentaje se aplica automaticamente al total de las cotizaciones.

---

### 8.7 Dias Extra

**Ruta:** `/alquileres/configuracion/dias-extra`

1. Desde el modulo de **Alquileres**, expanda **"Configuracion"** en la barra lateral.
2. Haga clic en **"Dias Extra"**.
3. Configure:
   - **Dias de gracia**: Dias adicionales sin recargo.
   - **Recargo por dia extra**: Monto o porcentaje que se cobra por cada dia adicional.
4. Haga clic en **"Guardar"**.

> **[Pantallazo: Configuracion de dias de gracia y recargos por dias extra]**

---

## 9. Flujos de Trabajo Principales

### 9.1 Flujo completo de alquiler (de cotizacion a devolucion)

Este es el flujo principal del sistema. Siga estos pasos en orden:

**Paso 1 — Crear o seleccionar un cliente**
1. Vaya a **Alquileres > Clientes** (ver [Seccion 6.5](#65-clientes)).
2. Cree un nuevo cliente o verifique que el cliente ya existe.

> **[Pantallazo: Seleccion o creacion de cliente]**

**Paso 2 — Crear la cotizacion**
1. Vaya a **Alquileres > Cotizaciones** (ver [Seccion 6.2](#62-cotizaciones)).
2. Haga clic en **"+ Nueva Cotizacion"**.
3. Seleccione el cliente, defina fechas, agregue productos y descuentos.
4. Guarde la cotizacion.

> **[Pantallazo: Cotizacion completada con productos y totales]**

**Paso 3 — Enviar cotizacion al cliente**
1. Abra la cotizacion creada.
2. Haga clic en **"Generar PDF"**.
3. Envie el PDF al cliente por correo o WhatsApp.

> **[Pantallazo: PDF de cotizacion generado]**

**Paso 4 — Convertir cotizacion a alquiler**
1. Cuando el cliente confirme, abra la cotizacion.
2. Haga clic en **"Convertir a Alquiler"**.
3. El sistema crea el alquiler y genera **ordenes de trabajo automaticas** (montaje + desmontaje).

> **[Pantallazo: Confirmacion de conversion a alquiler]**

**Paso 5 — Asignar responsables a las ordenes**
1. Vaya a **Operaciones > Ordenes de Trabajo** (ver [Seccion 7.3](#73-ordenes-de-trabajo)).
2. Abra las ordenes generadas para este alquiler.
3. Asigne un **responsable** y equipo a cada orden.

> **[Pantallazo: Asignacion de responsable en orden de trabajo]**

**Paso 6 — Preparar elementos en bodega**
1. El responsable abre la orden asignada.
2. Cambia el estado a **"En preparacion"**.
3. Prepara los elementos del checklist de carga.

> **[Pantallazo: Orden en estado de preparacion con checklist]**

**Paso 7 — Ejecutar montaje en sitio**
1. El equipo avanza la orden: **"En ruta"** → **"En sitio"** → **"En proceso"**.
2. Documenta el montaje con **fotos**.
3. Registra **novedades** si ocurren.

> **[Pantallazo: Orden en estado "En proceso" con fotos de documentacion]**

**Paso 8 — Realizar el evento**
1. Durante el evento, el sistema mantiene los elementos en estado "alquilado".
2. Revise **alertas** si hay incidencias.

**Paso 9 — Ejecutar desmontaje**
1. Al finalizar el evento, la orden de desmontaje se activa.
2. El equipo avanza los estados igual que en el montaje.
3. Documenta con fotos el desmontaje.

> **[Pantallazo: Orden de desmontaje en progreso]**

**Paso 10 — Retornar elementos a bodega**
1. Una vez los elementos regresan, retorne series/lotes a bodega (ver [Seccion 4.6.5](#465-retornar-una-serie-a-bodega) o [4.7.5](#475-retornar-un-lote-a-bodega)).
2. Actualice el estado de elementos danados si aplica.

**Paso 11 — Completar el alquiler**
1. Vaya a **Alquileres > Gestion**.
2. Abra el alquiler y marquelo como **"Completado"**.

> **[Pantallazo: Alquiler marcado como completado]**

---

### 9.2 Configuracion inicial del sistema

Siga estos pasos para configurar el sistema por primera vez:

1. **Configurar datos de empresa** — Vaya a **Configuracion > Datos de Empresa** y complete la informacion (ver [Seccion 8.2](#82-datos-de-empresa)).
2. **Crear ciudades** — Vaya a **Configuracion > Ciudades** y agregue las ciudades con sus tarifas de transporte (ver [Seccion 8.3](#83-ciudades-y-tarifas-de-transporte)).
3. **Crear ubicaciones** — Vaya a **Configuracion > Ubicaciones** y cree las bodegas y destinos (ver [Seccion 8.4](#84-ubicaciones-y-destinos)).
4. **Crear categorias de inventario** — Vaya a **Inventario** y cree las categorias y subcategorias (ver [Seccion 4.4](#44-gestionar-categorias)).
5. **Agregar elementos** — Cree los elementos en cada subcategoria con sus series o lotes (ver [Seccion 4.5](#45-gestionar-elementos)).
6. **Crear productos compuestos** — Vaya a **Productos** y cree las plantillas de alquiler (ver [Seccion 5.4](#54-crear-un-producto-compuesto)).
7. **Configurar impuestos** — Defina el porcentaje de IVA (ver [Seccion 8.6](#86-impuestos-iva)).
8. **Configurar descuentos** — Cree los descuentos predefinidos (ver [Seccion 6.8](#68-descuentos)).
9. **Aprobar empleados** — Apruebe las solicitudes de registro pendientes (ver [Seccion 8.5.2](#852-aprobar-una-solicitud-de-registro-pendiente)).

---

### 9.3 Gestion diaria de inventario

Procedimiento recomendado para la revision diaria:

1. **Revisar dashboard** — Abra el dashboard analitico de inventario (ver [Seccion 4.2](#42-dashboard-analitico-de-inventario)) para identificar alertas de stock bajo.
2. **Verificar elementos en campo** — Revise los elementos con estado "alquilado" para saber que esta fuera de bodega.
3. **Registrar retornos** — Cuando elementos regresen de eventos, registre los retornos de series o lotes a bodega (ver [Seccion 4.6.5](#465-retornar-una-serie-a-bodega) o [4.7.5](#475-retornar-un-lote-a-bodega)).
4. **Actualizar estados** — Cambie el estado de elementos danados a "mantenimiento" o "danado" segun corresponda.
5. **Mover elementos** — Si es necesario, mueva elementos entre ubicaciones (ver [Seccion 4.6.4](#464-mover-una-serie-entre-ubicaciones) o [4.7.4](#474-mover-cantidades-entre-ubicaciones)).

---

### 9.4 Gestion de operaciones en campo

Procedimiento para el equipo de operaciones:

1. **Consultar calendario** — Revise el calendario de operaciones para ver las ordenes del dia (ver [Seccion 7.4](#74-calendario-de-operaciones)).
2. **Revisar detalle** — Abra cada orden para ver: elementos necesarios, ubicacion del evento y responsable asignado (ver [Seccion 7.3.4](#734-ver-detalle-de-una-orden)).
3. **Actualizar estados** — A medida que avanza el trabajo, cambie el estado de la orden (ver [Seccion 7.3.5](#735-cambiar-el-estado-de-una-orden)):
   - En preparacion → En ruta → En sitio → En proceso → Completado.
4. **Documentar con fotos** — Tome fotos del montaje/desmontaje y subalas a la orden (ver [Seccion 7.3.6](#736-documentar-con-fotos)).
5. **Registrar novedades** — Si ocurren incidentes, registrelos en la orden (ver [Seccion 7.3.7](#737-registrar-novedades-o-incidentes)).
6. **Revisar alertas** — Al final del dia, revise las alertas pendientes del sistema (ver [Seccion 7.5](#75-sistema-de-alertas)).

---

> **Soporte**: Si tiene dudas o problemas con el sistema, contacte al administrador de su empresa.
