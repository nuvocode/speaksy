# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --prefer-offline
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend runtime with embedded frontend
FROM node:20-alpine AS runtime
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev --prefer-offline
COPY backend/ ./
COPY --from=frontend-builder /frontend/dist ./public

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
