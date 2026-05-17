FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci

FROM deps AS frontend-build

WORKDIR /app

ARG REACT_APP_API_URL=/api
ARG REACT_APP_PLATFORM_API_URL=/api/platform
ARG REACT_APP_ML_API_URL=http://localhost:8000
ARG REACT_APP_ENV=production

ENV CI=false
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_PLATFORM_API_URL=$REACT_APP_PLATFORM_API_URL
ENV REACT_APP_ML_API_URL=$REACT_APP_ML_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

COPY frontend ./frontend/

RUN npm --workspace frontend run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --omit=dev --workspace backend --include-workspace-root=false \
    && npm cache clean --force

COPY backend ./backend/
COPY db ./db/
COPY --from=frontend-build /app/frontend/build ./frontend/build/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node

CMD ["npm", "--workspace", "backend", "run", "start"]
