FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies including tsx
RUN npm ci --production=false

# Copy source code
COPY src ./src

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
