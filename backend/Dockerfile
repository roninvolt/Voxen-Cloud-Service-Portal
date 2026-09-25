# ==========================================
# Voxen Cloud Services Backend Dockerfile
# Production-ready Node.js container
# ==========================================

FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install production dependencies first (caching layer)
COPY package*.json ./

RUN npm ci --only=production

# Copy source code and database migrations
COPY src/ ./src/
COPY database/ ./database/

# Create uploads folder and configure permissions
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to unprivileged non-root user
USER node

ENV NODE_ENV=production \
    PORT=5000 \
    STORAGE_PROVIDER=local \
    UPLOAD_DIR=/app/uploads

EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
