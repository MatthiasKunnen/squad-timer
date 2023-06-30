FROM node:18.16 as build

WORKDIR /app
RUN corepack enable

COPY .yarnrc.yml ./
COPY .yarn ./.yarn/
COPY yarn.lock ./
COPY package.json ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/
RUN --mount=type=cache,target=/root/yarn-cache YARN_CACHE_FOLDER=/root/yarn-cache \
    yarn workspaces focus api

COPY . .
RUN yarn workspace api run build
RUN --mount=type=cache,target=/root/yarn-cache YARN_CACHE_FOLDER=/root/yarn-cache \
    yarn workspaces focus api --production

ARG REVISION
ENV REVISION=$REVISION
LABEL org.opencontainers.image.revision=$REVISION

FROM node:18.16 as app
LABEL org.opencontainers.image.source=https://github.com/MatthiasKunnen/squad-timer

LABEL org.opencontainers.image.description="The API for Squad Timer"
LABEL org.opencontainers.image.title="Squad Timer API"

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules/
# The [s] trick is used to copy the node_modules directory only if it exists. See
# https://stackoverflow.com/a/70096420
COPY --from=build /app/api/node_module[s] ./api/node_modules/
COPY --from=build /app/shared/node_module[s] ./shared/node_modules/
COPY --from=build /app/api/dist ./

ARG REVISION
ENV REVISION=$REVISION
LABEL org.opencontainers.image.revision=$REVISION

EXPOSE 80
CMD ["node", "--disable-proto=delete", "--enable-source-maps", "api/src/server.js"]
