#!/bin/bash
# ============================================
# Script de Deployment - Sistema de Inventario
# ============================================
# Uso:
#   Opción 1 (SIN HTTPS): ./scripts/deploy.sh
#   Opción 2 (CON HTTPS): ./scripts/deploy.sh --https
#
# Requisitos:
#   - Docker y Docker Compose instalados
#   - Archivo .env configurado (copiar de .env.docker.example)
#   - Para HTTPS: dominio apuntando a este servidor + DOMAIN y CERTBOT_EMAIL en .env

set -e

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment - Inventario de Carpas${NC}"
echo -e "${GREEN}============================================${NC}"

# Verificar que estamos en la raíz del proyecto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Ejecuta este script desde la raíz del proyecto${NC}"
    echo "  cd /ruta/al/proyecto && ./scripts/deploy.sh"
    exit 1
fi

# Verificar que .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: No se encontró el archivo .env${NC}"
    echo "Crea uno a partir del ejemplo:"
    echo "  cp .env.docker.example .env"
    echo "  nano .env  # Editar con valores reales"
    exit 1
fi

# Cargar variables de .env
set -a
source .env
set +a

# ============================================
# Opción 1: Sin HTTPS (solo HTTP)
# ============================================
if [ "$1" != "--https" ]; then
    echo ""
    echo -e "${YELLOW}Modo: HTTP (sin certificado SSL)${NC}"
    echo "El cliente podrá acceder por: http://$(hostname -I | awk '{print $1}')"
    echo ""

    echo "Construyendo y levantando servicios..."
    docker compose -f docker-compose.yml up -d --build

    echo ""
    echo -e "${GREEN}¡Deployment exitoso!${NC}"
    echo "Accede a: http://$(hostname -I | awk '{print $1}')"
    echo ""
    echo "Comandos útiles:"
    echo "  docker compose -f docker-compose.yml logs -f     # Ver logs"
    echo "  docker compose -f docker-compose.yml down         # Parar todo"
    echo "  docker compose -f docker-compose.yml up -d        # Reiniciar"
    exit 0
fi

# ============================================
# Opción 2: Con HTTPS (Let's Encrypt)
# ============================================
echo ""
echo -e "${YELLOW}Modo: HTTPS con Let's Encrypt${NC}"

# Verificar variables necesarias
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: La variable DOMAIN no está configurada en .env${NC}"
    echo "Agrega: DOMAIN=tu-dominio.com"
    exit 1
fi

if [ -z "$CERTBOT_EMAIL" ]; then
    echo -e "${RED}Error: La variable CERTBOT_EMAIL no está configurada en .env${NC}"
    echo "Agrega: CERTBOT_EMAIL=tu@email.com"
    exit 1
fi

echo "Dominio: $DOMAIN"
echo "Email: $CERTBOT_EMAIL"
echo ""

# Paso 1: Reemplazar ${DOMAIN} en la configuración de Nginx
echo "Configurando Nginx para el dominio $DOMAIN..."
sed "s/\${DOMAIN}/$DOMAIN/g" nginx/nginx.prod.conf > nginx/nginx.prod.active.conf

# Paso 2: Levantar servicios SIN HTTPS primero (para que Certbot pueda verificar)
echo "Levantando servicios en modo HTTP para verificación de Certbot..."
docker compose -f docker-compose.yml up -d --build

# Paso 3: Obtener certificado SSL
echo "Obteniendo certificado SSL de Let's Encrypt..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
    certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Paso 4: Actualizar nginx.prod.conf con el dominio real y reiniciar con HTTPS
echo "Activando HTTPS..."
# Copiar la config procesada para que el volumen la use
cp nginx/nginx.prod.active.conf nginx/nginx.prod.conf

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ¡Deployment con HTTPS exitoso!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Accede a: https://$DOMAIN"
echo ""
echo "Comandos útiles:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f    # Ver logs"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml down        # Parar"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d       # Reiniciar"
echo ""
echo "El certificado se renueva automáticamente cada 12 horas."
