# Dockerfile that provides a same-origin testing platform for the API and website image by proxying.
FROM nginx:1.25.1

COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
