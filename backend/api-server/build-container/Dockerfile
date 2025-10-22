# ---- Build stage ----
FROM node:20-alpine AS builder

RUN apk add --no-cache git bash
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /home/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build


# ---- Runtime stage ----
FROM node:20-alpine

RUN apk add --no-cache bash git
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /home/app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /home/app/dist ./dist

EXPOSE 3000

ENTRYPOINT ["node", "dist/index.js"]
