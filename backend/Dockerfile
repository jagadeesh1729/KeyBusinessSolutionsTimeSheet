FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
COPY public ./public
RUN mkdir -p logs && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
