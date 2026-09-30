FROM node:20-alpine AS base
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm install -w @medico/shared -w @medico/api
RUN npm run build -w @medico/shared
RUN cd apps/api && npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/apps/api ./apps/api

EXPOSE 5000
CMD ["npm", "run", "start", "-w", "@medico/api"]
