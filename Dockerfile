# syntax=docker/dockerfile:1

# ============================================
# Irian Motor — Dockerfile
# ============================================
# Build: docker build -t irian-motor .
# Run:   docker-compose up -d
# ============================================

# Base image
FROM node:22-alpine

# Install dependencies needed for prisma
RUN apk add --no-cache python3 make g++ openssl

# Set working directory
WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]