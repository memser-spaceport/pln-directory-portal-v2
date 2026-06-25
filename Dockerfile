FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat

COPY package*.json ./

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --legacy-peer-deps

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4200
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app ./

EXPOSE 4200

CMD ["npm", "run", "start"]