FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm install -w @medico/shared -w @medico/web
RUN npm run build -w @medico/shared
RUN npm run build -w @medico/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/apps/web ./apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@medico/web"]
