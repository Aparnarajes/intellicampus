# Node.js Base Image
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build for production
# RUN npm run build
# For this SaaS demo/MVP, we will run the dev server or use a light container
# Standard Industry SaaS uses Nginx to serve the build, but for iterative dev:
EXPOSE 5173

# Start command
CMD ["npm", "run", "dev", "--", "--host"]
