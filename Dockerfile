# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm ci --only=production && npm cache clean --force

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create data directory for SQLite database
RUN mkdir -p /usr/src/app/data && chown nodejs:nodejs /usr/src/app/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Start the application
CMD ["node", "src/server.js"]
