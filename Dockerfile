FROM node:22-alpine

WORKDIR /app

# Copy package files FIRST
COPY package*.json tsconfig.json ./

# Install all dependencies (dev included for TypeScript build)
RUN npm ci --verbose

# Copy source code
COPY src ./src

# Build TypeScript - fail immediately if build fails
RUN npm run build || (echo "BUILD FAILED"; exit 1)

# Verify dist was created
RUN test -d dist/ || (echo "dist/ directory missing after build!"; exit 1)
RUN test -f dist/server.js || (echo "dist/server.js missing after build!"; exit 1)

# Remove dev dependencies to save space
RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

# Run the app
CMD ["node", "dist/server.js"]
