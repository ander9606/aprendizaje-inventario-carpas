#!/bin/sh
# ============================================
# Espera a que MySQL esté listo antes de iniciar la app
# Usa mysql2 (ya instalado como dependencia del proyecto)
# ============================================
set -e

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRIES=0

echo "Esperando base de datos en $DB_HOST..."

until node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }).then(c => { c.query('SELECT 1'); c.end(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "Base de datos no disponible despues de $MAX_RETRIES intentos. Saliendo."
    exit 1
  fi
  echo "Base de datos no lista (intento $RETRIES/$MAX_RETRIES). Reintentando en ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "Base de datos lista!"
exec "$@"
