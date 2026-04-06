#!/bin/bash
# ============================================
# Script para inicializar el repo logiq360
# ============================================
# Ejecutar desde el directorio padre donde están ambos repos:
#   chmod +x docs/logiq360/inicializar-repo.sh
#   cd ..  (ir al directorio padre)
#   ./aprendizaje-inventario-carpas/docs/logiq360/inicializar-repo.sh
#
# Prerequisitos:
#   - Tener clonado el repo: git clone https://github.com/ander9606/logiq360.git
#   - Tener el repo actual: aprendizaje-inventario-carpas/

set -e

SOURCE="aprendizaje-inventario-carpas"
DEST="logiq360"

echo "=== Inicializando Logiq360 SaaS Monorepo ==="

# Verificar que ambos repos existen
if [ ! -d "$SOURCE" ]; then
    echo "ERROR: No se encuentra $SOURCE/"
    exit 1
fi

if [ ! -d "$DEST" ]; then
    echo "Clonando repo logiq360..."
    git clone https://github.com/ander9606/logiq360.git
fi

echo "1/6 - Copiando backend..."
cp -r "$SOURCE/backend/" "$DEST/backend/"
rm -rf "$DEST/backend/node_modules" "$DEST/backend/.claude" 2>/dev/null
rm -f "$DEST/backend/OPTIMIZACIONES.md" "$DEST/backend/README.md" "$DEST/backend/TEST_README.md" "$DEST/backend/debug-disponibilidad.js" 2>/dev/null

echo "2/6 - Copiando frontend como tenant-app..."
cp -r "$SOURCE/inventario-frontend/" "$DEST/tenant-app/"
rm -rf "$DEST/tenant-app/node_modules" "$DEST/tenant-app/dist" "$DEST/tenant-app/.claude" 2>/dev/null
rm -f "$DEST/tenant-app/README.md" 2>/dev/null

echo "3/6 - Copiando archivos de soporte..."
cp -r "$SOURCE/sql/" "$DEST/sql/"
cp -r "$SOURCE/nginx/" "$DEST/nginx/"
cp -r "$SOURCE/scripts/" "$DEST/scripts/"
cp "$SOURCE/docker-compose.yml" "$DEST/"
cp "$SOURCE/docker-compose.prod.yml" "$DEST/"
cp "$SOURCE/docker-compose.override.yml" "$DEST/"
cp "$SOURCE/.env.docker.example" "$DEST/"

echo "4/6 - Creando carpetas nuevas..."
mkdir -p "$DEST/platform-admin" "$DEST/landing" "$DEST/docs"
touch "$DEST/platform-admin/.gitkeep" "$DEST/landing/.gitkeep"
mkdir -p "$DEST/backend/uploads/logos"
touch "$DEST/backend/uploads/logos/.gitkeep"

echo "5/6 - Copiando documentos de arquitectura..."
cp "$SOURCE/docs/logiq360/arquitectura-saas.md" "$DEST/docs/"

echo "6/6 - Aplicando adaptaciones..."

# Adaptar docker-compose.yml
sed -i 's/aprendizaje_inventario/logiq360/g' "$DEST/docker-compose.yml"
sed -i 's|./inventario-frontend|./tenant-app|g' "$DEST/docker-compose.yml"
sed -i 's/Sistema Carpas/Logiq360/g' "$DEST/docker-compose.yml"

# Adaptar package.json
sed -i 's/"name": "backend"/"name": "logiq360-backend"/' "$DEST/backend/package.json"
sed -i 's/"name": "inventario-frontend"/"name": "logiq360-tenant-app"/' "$DEST/tenant-app/package.json"

echo ""
echo "=== Logiq360 inicializado exitosamente ==="
echo ""
echo "Estructura:"
echo "  $DEST/"
echo "  ├── backend/"
echo "  ├── tenant-app/"
echo "  ├── platform-admin/  (vacío - por implementar)"
echo "  ├── landing/          (vacío - por implementar)"
echo "  ├── docs/"
echo "  ├── sql/"
echo "  ├── nginx/"
echo "  └── scripts/"
echo ""
echo "Siguientes pasos:"
echo "  1. cd $DEST"
echo "  2. Copiar CLAUDE.md y README.md (están en docs/logiq360/ del repo original)"
echo "  3. git add . && git commit -m 'feat: initialize Logiq360 SaaS monorepo'"
echo "  4. git push -u origin main"
echo ""
