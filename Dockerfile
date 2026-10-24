# ---------- Stage 1: dependencias ----------
# Multi-stage build: aquí instalamos, en la imagen final solo copiamos lo necesario.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci: instala EXACTAMENTE lo del lockfile (reproducible). Sin devDependencies.
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Stage 2: runtime ----------
FROM node:22-alpine
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=${APP_VERSION}

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# CLAVE EN OPENSHIFT: el contenedor arranca con un UID aleatorio (p. ej. 1000680000)
# pero SIEMPRE con GID 0 (root group). Damos al grupo 0 los mismos permisos que al dueño.
RUN chgrp -R 0 /app && chmod -R g=u /app

# Usuario no-root. En OpenShift se ignora el UID (restricted-v2 SCC asigna otro),
# pero en Docker/K8s "vanilla" evita correr como root.
USER 1001

EXPOSE 8080
CMD ["node", "src/server.js"]
