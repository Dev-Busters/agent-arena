FROM node:22-alpine

WORKDIR /app

# Copy package files and source
COPY package*.json tsconfig.json ./
COPY src ./src

# Install ALL dependencies (including devDependencies for esbuild)
RUN npm ci

# Bundle with esbuild into single file
RUN npm run bundle

# Verify bundle was created
RUN test -f dist/server.bundle.js || (echo "Bundle not created!"; exit 1)

# Remove devDependencies to reduce image size
RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

# Run the bundled server
CMD ["node", "dist/server.bundle.js"]
