FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine

USER root
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
COPY --chown=101:101 docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --chown=101:101 docker/container-entrypoint.sh /usr/local/bin/container-entrypoint.sh
RUN chmod 755 /usr/local/bin/container-entrypoint.sh \
    && chown -R 101:101 /etc/nginx/conf.d /etc/nginx/templates /usr/share/nginx/html

USER 101:101
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/container-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
