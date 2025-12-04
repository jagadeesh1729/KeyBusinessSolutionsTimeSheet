FROM node:20-alpine AS build
WORKDIR /app

# Provide defaults for Vite build-time environment so docker builds do not rely on host files
ARG VITE_API_BASE_URL=/api
ARG VITE_BACKEND_URL=http://localhost:3000
ARG VITE_LOGIN_BACKGROUND_URL=https://source.unsplash.com/random?wallpapers
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_LOGIN_BACKGROUND_URL=${VITE_LOGIN_BACKGROUND_URL}

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
