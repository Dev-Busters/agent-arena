FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies including tsx
RUN npm ci --production=false

# Copy source code
COPY src ./src

EXPOSE 3000

ENV NODE_ENV=production

# Run directly with tsx (bypass npm)
CMD ["npx", "tsx", "src/server.ts"]
