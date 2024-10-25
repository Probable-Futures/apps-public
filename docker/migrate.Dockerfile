ARG BASE_IMAGE=base
FROM node:18.19.0-bullseye-slim AS base
ARG BASE_IMAGE
ARG YARN_VERSION="1.22.5"
ENV YARN_VERSION $YARN_VERSION

RUN apt-get update && apt-get install -y --no-install-recommends \
  apt \
  curl \
  ca-certificates \
  git \
  tini \
  gnupg2

# Ensure we use the same version of yarn for production builds
RUN curl -fSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
  && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
  && ln -snf /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
  && rm yarn-v$YARN_VERSION.tar.gz

# Install Postgres PGP Key so we can install Postgres v12
RUN curl -L "https://www.postgresql.org/media/keys/ACCC4CF8.asc" | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update && apt-get install -y --no-install-recommends \
  postgresql-client-12 \
  && rm -rf /var/lib/apt/lists/*

ARG TRUSTSTORE_PASSWORD="change-this-in-production"
ENV TRUSTSTORE_PASSWORD $TRUSTSTORE_PASSWORD

COPY ./docker/scripts/import-aws-rds-certs.sh .
RUN chmod +x ./import-aws-rds-certs.sh
RUN ./import-aws-rds-certs.sh

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN ["/bin/bash", "-c", "mkdir -p /opt/probable-futures/{app,cache}/packages && chown -R -L node:node /opt/probable-futures"]


###################################################
# Development Docker Image
###################################################
FROM base AS development
ARG BASE_IMAGE

COPY --chown=node:node ./data data

ARG BASE_IMAGE
RUN set -ex; \
  # Install the wait-for-it command to /usr/bin.
  git clone https://github.com/vishnubob/wait-for-it /tmp/wait-for-it; \
  mv /tmp/wait-for-it/wait-for-it.sh /usr/bin/wait-for-it; \
  chmod +x /usr/bin/wait-for-it; \
  # Clean up to reduce the image size.
  rm -rf /tmp/wait-for-it /var/lib/apt/lists/*

###################################################
# Cache Node Modules for Env's Base Image
###################################################
ARG BASE_IMAGE="base"
FROM $BASE_IMAGE AS cache

WORKDIR /opt/probable-futures/cache

COPY --chown=node:node ./yarn.lock .
COPY --chown=node:node ./package.json .
COPY --chown=node:node ./packages/db packages/db

USER node

# Fixes timeout issues
# https://github.com/yarnpkg/yarn/issues/5259
RUN set http_proxy=https_proxy= \
  && yarn config delete https-proxy \
  && npm config rm proxy \
  && npm config rm https-proxy \
  && npm config set registry "https://registry.npmjs.org"

RUN yarn install --network-timeout 100000 --frozen-lockfile

###################################################
# Production Image
###################################################
FROM $BASE_IMAGE AS production
ARG BASE_IMAGE

WORKDIR /opt/probable-futures/app

COPY --from=cache --chown=node:node /opt/probable-futures/cache/node_modules node_modules
COPY --from=cache --chown=node:node /opt/probable-futures/cache/packages packages
COPY --chown=node:node ./data data

USER node

# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#handling-kernel-signals
ENTRYPOINT ["tini", "--"]

WORKDIR /opt/probable-futures/app/packages/db

CMD ["yarn", "migrate"]
