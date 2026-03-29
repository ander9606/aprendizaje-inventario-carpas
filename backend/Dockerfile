# ============================================
# Dockerfile - Backend API
# Node.js + Express
# ============================================

FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache de Docker)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar código de la aplicación
COPY . .

# Crear directorio de uploads
RUN mkdir -p uploads/logos

# Copiar script de espera para la BD
COPY scripts/wait-for-db.sh /usr/local/bin/wait-for-db.sh
RUN chmod +x /usr/local/bin/wait-for-db.sh

# Ejecutar como usuario no-root (seguridad)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["wait-for-db.sh"]
CMD ["node", "server.js"]
