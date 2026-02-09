FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy pre-built dist folder (already committed to git)
COPY dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

# Run the pre-compiled server
CMD ["node", "dist/server.js"]
