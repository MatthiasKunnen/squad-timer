# Dockerfile for frontend, for backend dockerfile see api/Dockerfile
FROM nginx:1.25.1
LABEL org.opencontainers.image.source=https://github.com/MatthiasKunnen/squad-timer

COPY ./dist/nginx.conf /etc/nginx/nginx.conf

ARG REVISION
ENV REVISION=$REVISION
LABEL org.opencontainers.image.revision=$REVISION

LABEL org.opencontainers.image.description="The frontend for Squad Timer"
LABEL org.opencontainers.image.title="Squad Timer frontend"

WORKDIR /usr/share/nginx/html

COPY ./dist/public ./
RUN find ./ -type f \( \
        -name '*.css' -o \
        -name '*.html' -o \
        -name '*.js' -o \
        -name '*.svg' -o \
        -name '*.json' -o \
        -name '*.webmanifest' -o \
        -name '*.xml' -o \
        -name '*.ico' -o \
        -name '*.txt' \
        \) -exec gzip --force --no-name --keep -9 {} +

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
