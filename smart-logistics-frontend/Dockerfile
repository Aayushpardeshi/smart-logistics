# Build stage
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite will automatically read .env.production during this step
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Expose default port (Render will inject PORT at runtime)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
