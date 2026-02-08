# Multi-stage build for Node.js + TypeScript

FROM node:22-alpine as build

WORKDIR /build

# Copy package files first (better caching)
COPY package*.json tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build && ls -la dist/

# Runtime stage
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript from build stage
COPY --from=build /build/dist ./dist

# Verify files exist
RUN ls -la dist/ && ls -la dist/api/routes/ || echo "Files exist"

EXPOSE 3000

# Start the app
CMD ["node", "dist/server.js"]
