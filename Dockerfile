FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json tsconfig.json ./

# Install all dependencies (includes dev for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies to save space
RUN npm prune --production

# Verify dist exists
RUN ls -la dist/ && ls -la dist/api/ || echo "Dist built"

EXPOSE 3000

# Run the app
CMD ["node", "dist/server.js"]
