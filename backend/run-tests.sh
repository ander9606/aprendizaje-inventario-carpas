#!/bin/bash

# ============================================
# SCRIPT: Ejecutar tests de API
# ============================================

set -e

echo "🚀 Iniciando servidor de pruebas..."

# Verificar que estamos en el directorio correcto
cd "$(dirname "$0")"

# Matar cualquier proceso en el puerto 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Esperar un momento para que el puerto se libere
sleep 1

# Iniciar el servidor en background
echo "📡 Levantando servidor..."
NODE_ENV=test node server.js &
SERVER_PID=$!

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
sleep 5

# Verificar que el servidor está corriendo
if ! lsof -ti:3000 > /dev/null; then
    echo "❌ Error: El servidor no pudo iniciarse"
    exit 1
fi

echo "✅ Servidor listo en http://localhost:3000"
echo ""

# Ejecutar los tests
echo "🧪 Ejecutando tests..."
node test-api-cards.js
TEST_EXIT_CODE=$?

# Detener el servidor
echo ""
echo "🛑 Deteniendo servidor..."
kill $SERVER_PID 2>/dev/null || true

# Esperar a que el servidor se detenga
sleep 2

echo "✅ Tests completados"
exit $TEST_EXIT_CODE
