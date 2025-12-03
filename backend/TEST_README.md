# 🧪 Tests de Verificación de Cards API

Este documento explica cómo ejecutar los tests de verificación para asegurar que todos los componentes de cards del frontend estén obteniendo datos correctamente desde la API.

## 📋 Descripción

El script `test-api-cards.js` verifica que todos los endpoints utilizados por los siguientes componentes estén funcionando correctamente:

### Componentes Probados

1. **CategoriaPadreCard**
   - GET `/api/categorias/padres` - Obtener categorías padres
   - PUT `/api/categorias/:id` - Actualizar emoji de categoría

2. **SubcategoriaCard**
   - GET `/api/categorias/:id/subcategorias` - Obtener subcategorías

3. **StatCard**
   - GET `/api/elementos` - Obtener total de elementos
   - GET `/api/categorias` - Obtener total de categorías

4. **ElementoLoteCard**
   - GET `/api/lotes` - Obtener todos los lotes
   - GET `/api/lotes/elemento/:elementoId` - Obtener lotes de un elemento

5. **ElementoSerieCard**
   - GET `/api/series` - Obtener todas las series
   - GET `/api/series/elemento/:elementoId` - Obtener series de un elemento

6. **Tests de Paginación**
   - Verificación de paginación en elementos y lotes

## 🚀 Ejecución de Tests

### Opción 1: Script Automatizado (Recomendado)

El script `run-tests.sh` automáticamente:
- Inicia el servidor
- Espera a que esté listo
- Ejecuta todos los tests
- Detiene el servidor
- Muestra un resumen de resultados

```bash
cd backend
./run-tests.sh
```

### Opción 2: Manual

Si prefieres tener más control, puedes ejecutar los pasos manualmente:

```bash
# 1. Iniciar el servidor (en una terminal)
cd backend
node server.js

# 2. Ejecutar los tests (en otra terminal)
cd backend
node test-api-cards.js
```

## 📊 Interpretación de Resultados

### Salida de Ejemplo

```
╔═══════════════════════════════════════════════════╗
║  🧪 TEST DE VERIFICACIÓN DE CARDS API           ║
║  API: http://localhost:3000/api                 ║
╚═══════════════════════════════════════════════════╝

═══════════════════════════════════════
  CATEGORIA PADRE CARD TESTS
═══════════════════════════════════════

TEST: GET /api/categorias/padres - Obtener categorías padres... ✓ PASSED
    → 5 categorías padres encontradas

TEST: PUT /api/categorias/:id - Actualizar emoji de categoría... ✓ PASSED
    → Emoji actualizado a 🎯

...

═══════════════════════════════════════
  RESUMEN DE TESTS
═══════════════════════════════════════

  Total:  12
  Pasados: 12
  Fallados: 0
  Tasa de éxito: 100.0%
```

### Códigos de Salida

- **0**: Todos los tests pasaron correctamente ✅
- **1**: Uno o más tests fallaron ❌

## 🔍 Qué se Verifica

Para cada endpoint, el script verifica:

1. **Conectividad**: El endpoint responde
2. **Estructura de Respuesta**:
   - `success: true`
   - `data` está presente
   - Los campos requeridos existen
3. **Tipos de Datos**: Los valores son del tipo correcto
4. **Paginación**: Cuando aplica, verifica metadata de paginación

## 🛠️ Configuración

### Variables de Entorno

Puedes configurar la URL de la API mediante la variable `API_URL`:

```bash
# Probar contra API local (por defecto)
./run-tests.sh

# Probar contra API en otro puerto
API_URL=http://localhost:5000/api ./run-tests.sh

# Probar contra API de staging
API_URL=https://staging.example.com/api node test-api-cards.js
```

### Timeout

Por defecto, cada petición tiene un timeout de 5 segundos. Puedes modificar esto editando la constante `TIMEOUT` en `test-api-cards.js`.

## 🐛 Solución de Problemas

### El servidor no puede iniciarse

```bash
# Verificar si el puerto 3000 está en uso
lsof -ti:3000

# Matar el proceso que usa el puerto
lsof -ti:3000 | xargs kill -9
```

### Tests fallan por timeout

- Verifica que la base de datos esté corriendo
- Asegúrate de que las credenciales en `.env` sean correctas
- Aumenta el valor de `TIMEOUT` en `test-api-cards.js`

### Errores de conexión a la base de datos

```bash
# Verificar que MySQL esté corriendo
mysql -u root -p -e "SELECT 1"

# Verificar las credenciales en .env
cat .env | grep DB_
```

## 📝 Añadir Nuevos Tests

Para añadir tests para nuevos componentes/endpoints:

1. Crea una nueva función de test:

```javascript
const testNuevoComponente = async () => {
  console.log(`\n${colors.blue}═══════════════════════════════════════`);
  console.log(`  NUEVO COMPONENTE TESTS`);
  console.log(`═══════════════════════════════════════${colors.reset}`);

  await test('GET /api/nuevo-endpoint - Descripción', async () => {
    const result = await request('GET', '/nuevo-endpoint');

    if (!result.success) {
      throw new Error(`API Error: ${JSON.stringify(result.error)}`);
    }

    // Verificaciones...
  });
};
```

2. Llama la función desde `runAllTests()`:

```javascript
const runAllTests = async () => {
  // ... otros tests
  await testNuevoComponente();
  // ...
};
```

## 📚 Estructura de un Test

Cada test sigue este patrón:

```javascript
await test('Descripción del test', async () => {
  // 1. Hacer la petición
  const result = await request('GET', '/endpoint');

  // 2. Verificar que fue exitosa
  if (!result.success) {
    throw new Error(`API Error: ${JSON.stringify(result.error)}`);
  }

  // 3. Verificar la estructura
  assertStructure(result.data.data[0], ['campo1', 'campo2'], 'NombreEntidad');

  // 4. Logging opcional
  console.log(`    ${colors.yellow}→ Información adicional${colors.reset}`);
});
```

## ✅ Checklist Pre-Deployment

Antes de hacer deploy, ejecuta este checklist:

- [ ] Todos los tests pasan (100% success rate)
- [ ] No hay errores en la consola
- [ ] Paginación funciona correctamente
- [ ] Actualización de emojis funciona
- [ ] Todos los endpoints devuelven la estructura esperada

## 🤝 Contribuir

Si encuentras bugs o quieres añadir más tests:

1. Añade el test siguiendo la estructura existente
2. Verifica que pase
3. Documenta el cambio en este README
4. Crea un commit con el formato: `test: Descripción del test añadido`

## 📖 Más Información

- [Documentación de la API](../docs/API.md)
- [Estructura de Componentes](../inventario-frontend/src/components/README.md)
- [React Query Hooks](../inventario-frontend/src/hooks/README.md)
