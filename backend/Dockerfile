FROM node:18-alpine

WORKDIR /app

# Copy root package files and backend package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy backend source
COPY backend ./backend/

# Expose port
EXPOSE 5000

# Default command
CMD ["npm", "--workspace", "backend", "run", "dev"]
