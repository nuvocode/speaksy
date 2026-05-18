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

# Default environment values — overridden by docker run -e or env_file
ENV PORT=3001 \
    AI_PROVIDER=ollama \
    STT_PROVIDER=webspeech \
    OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    OLLAMA_MODEL=llama3.2 \
    LMSTUDIO_BASE_URL=http://host.docker.internal:1234 \
    LMSTUDIO_MODEL=local-model \
    KOKORO_URL=http://localhost:8880 \
    KOKORO_VOICE=af_heart \
    WHISPER_URL=http://localhost:9000

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
