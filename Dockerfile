# Single image for the whole shop: NestJS serves the API, /uploads, and the
# production Angular build from one port.

FROM node:22-alpine AS build
WORKDIR /app
# Match the npm major that writes package-lock.json locally; npm 10 (bundled
# with node 22) rejects lockfiles npm 11 considers in sync.
RUN npm install -g npm@11.19.1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY . .
# `prisma generate` loads prisma.config.ts, which reads DATABASE_URL; the
# build never talks to a database, so a throwaway value satisfies it. The
# running container gets the real URL from compose.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# The full node_modules is kept on purpose: `prisma migrate deploy` and the
# `tsx` seed run from this image, and both live in devDependencies.
COPY --from=build /app/package.json /app/package-lock.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/src/generated ./backend/src/generated
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 3000
# Apply pending migrations, then start. Seeding is a separate, explicit step.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/backend/src/main"]
