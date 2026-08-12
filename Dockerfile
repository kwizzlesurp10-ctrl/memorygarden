# MemoryGarden — production static SPA (Vite build + nginx)
# Build:  docker build -t memorygarden .
# Run:    docker compose up --build

FROM node:22-alpine AS build
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

COPY index.html vite.config.ts tsconfig.json tailwind.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS production

RUN addgroup -S app && adduser -S app -G app \
    && apk add --no-cache curl \
    && sed -i '/user  nginx;/d' /etc/nginx/nginx.conf \
    && sed -i 's|pid /var/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && chown -R app:app /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html

COPY --from=build --chown=app:app /app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
