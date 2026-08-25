# Frontend build
FROM node:24-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite inlines VITE_ values at build time, so they must be present here.
ARG VITE_WAGMI_PROJECT_ID
ARG VITE_HEDERA_ACCOUNT_ID
RUN npm run build

# Server build
FROM node:24-alpine AS api
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npm run build

# Runtime
FROM node:24-alpine
WORKDIR /app/server
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

COPY --from=api /app/server/dist ./dist
COPY --from=web /app/dist /app/dist

ENV PORT=8080 \
    DATABASE_PATH=/data/aegis.db \
    STATIC_DIR=/app/dist

# SQLite lives here; mount a volume or the database dies with the container.
VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "dist/index.js"]
