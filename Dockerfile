# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Production stage ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Security: run as non-root
RUN addgroup -S app && adduser -S app -G app

# Copy optimised build output
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx configuration for SPA routing and security headers
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(self), geolocation=()" always;

    # Cache static assets aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — serve index.html for client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 8080

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
