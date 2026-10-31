# --- Etapa 1: compilar la app con Node ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las variables VITE_* en el bundle al compilar: se pasan como build args
# (docker build --build-arg VITE_API_URL=...). Ver .env.example.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY=$VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY \
    VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Etapa 2: servir los estáticos con nginx ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
