# syntax=docker/dockerfile:1.7
#
# Builds the directory portal (Next.js) image used by the feature-env and
# k8s deployments. Three stages:
#
#   deps     – `npm ci` (all dependencies, needed to build)
#   builder  – `next build` in standalone mode
#   runner   – the standalone server, static assets and public/ only
#
# The runner contains neither the sources nor the full node_modules, which is
# what keeps the image small and the pod start fast.

ARG NODE_VERSION=20

# ============================
# Stage 1: dependencies
# ============================
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app

# Toolchain for packages that compile native code on install.
RUN apk add --no-cache python3 make g++ libc6-compat

COPY package.json package-lock.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --legacy-peer-deps

# ============================
# Stage 2: build
# ============================
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT_STANDALONE=1 \
    NODE_OPTIONS=--max-old-space-size=4096

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `.env.production` is written into the build context by the deploy pipeline;
# Next.js reads it during `next build` (next.config `env` + NEXT_PUBLIC_*).
RUN npm run build

# ============================
# Stage 3: runtime
# ============================
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat \
 && addgroup -S app && adduser -S -G app app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=4200 \
    HOSTNAME=0.0.0.0

# Standalone output: server.js, the traced node_modules and .next/server.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Runtime env file, if the pipeline provided one (the glob keeps the COPY
# optional). Build-time values are already inlined by `next build`.
COPY --from=builder --chown=app:app /app/.env.productio[n] ./

USER app

EXPOSE 4200

CMD ["node", "server.js"]
