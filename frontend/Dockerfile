FROM node:18-alpine

WORKDIR /app

# Copy root and frontend packages
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend ./frontend/

# Expose port
EXPOSE 3000

# Set environment for development
ENV CI=false

# Default command
CMD ["npm", "--workspace", "frontend", "run", "start"]
