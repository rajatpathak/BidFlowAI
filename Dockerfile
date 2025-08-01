FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Create required directories
RUN mkdir -p uploads logs dist

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]