FROM node:20-alpine AS build

WORKDIR /workspace
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration development

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/smart-learning-platform-frontend/browser /usr/share/nginx/html

EXPOSE 80
