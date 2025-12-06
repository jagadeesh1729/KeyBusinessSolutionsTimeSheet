FROM node:20-alpine
WORKDIR /app

# Provide defaults for Vite build-time environment so docker builds do not rely on host files
ARG VITE_API_BASE_URL=/api
ARG VITE_BACKEND_URL=http://backend:3000
ARG VITE_LOGIN_BACKGROUND_URL=https://source.unsplash.com/random?wallpapers
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_LOGIN_BACKGROUND_URL=${VITE_LOGIN_BACKGROUND_URL}

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5000"]
