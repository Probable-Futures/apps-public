FROM node:18.19.0-buster-slim 

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
RUN echo "deb http://apt.postgresql.org/pub/repos/apt buster-pgdg main" > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update && apt-get install -y --no-install-recommends \
  postgresql-client-12 \
  && rm -rf /var/lib/apt/lists/*

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN ["/bin/bash", "-c", "mkdir -p /opt/probable-futures/{app,cache,build}/packages && chown -R -L node:node /opt/probable-futures"]

