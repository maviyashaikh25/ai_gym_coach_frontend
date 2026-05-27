FROM node:18-alpine AS builder
WORKDIR /app

# Install deps and build
COPY frontend/package.json ./
COPY frontend/package-lock.json* ./
RUN npm ci --silent || npm install --silent

COPY frontend/ ./
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
