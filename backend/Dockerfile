# Node.js Base Image
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client (MongoDB version)
RUN npx prisma generate

EXPOSE 5000

# Start command
CMD ["npm", "start"]
