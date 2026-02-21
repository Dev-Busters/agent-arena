FROM node:22-alpine

# Cache buster - forces rebuild (2026-02-20 19:48 EST - leaderboard schema fix)
ENV BUILD_DATE="2026-02-21T00:48:32Z"

WORKDIR /app

# Copy package files and source
COPY package*.json tsconfig.json ./
COPY src ./src

# Install ALL dependencies (including devDependencies for esbuild)
RUN npm install

# Bundle with esbuild into single file
RUN echo "=== Running esbuild bundle ===" && npm run bundle

# Debug: Show what was created
RUN echo "=== Contents of /app ===" && ls -la /app
RUN echo "=== Contents of /app/dist ===" && ls -la /app/dist || echo "dist folder missing!"
RUN echo "=== First 50 lines of bundled file ===" && head -50 /app/dist/server.bundle.js || echo "Bundle file missing!"
RUN echo "=== Searching for import statements in bundle ===" && grep -n "import.*from" /app/dist/server.bundle.js | head -20 || echo "No imports found (good!)"
RUN echo "=== File size ===" && wc -c /app/dist/server.bundle.js || echo "Cannot measure file"

# Verify bundle was created
RUN test -f dist/server.bundle.js || (echo "Bundle not created!"; exit 1)

# Remove devDependencies to reduce image size
RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production

# Debug startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "=== STARTUP DEBUG ===="' >> /app/start.sh && \
    echo 'echo "Node version: $(node --version)"' >> /app/start.sh && \
    echo 'echo "Contents of dist:"' >> /app/start.sh && \
    echo 'ls -la /app/dist' >> /app/start.sh && \
    echo 'echo "First 30 lines of server file:"' >> /app/start.sh && \
    echo 'head -30 /app/dist/server.bundle.js' >> /app/start.sh && \
    echo 'echo "=== Starting server ===="' >> /app/start.sh && \
    echo 'exec node /app/dist/server.bundle.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Run the debug startup
CMD ["/bin/sh", "/app/start.sh"]
