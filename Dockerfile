FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies 
RUN npm ci

# Copy source code
COPY src ./src

EXPOSE 3000

ENV NODE_ENV=production

# Run the app directly with tsx (no build step)
CMD ["npm", "start"]
