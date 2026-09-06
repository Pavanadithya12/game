FROM node:20-alpine AS build

WORKDIR /app

# Copy package configs
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY shared ./shared

# Install dependencies
RUN npm run postinstall

# Copy source files
COPY server/ ./server/
COPY client/ ./client/

# Build client and server
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/shared ./shared

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
