FROM postgis/postgis:16-3.5-alpine

# Install build dependencies and specific compiler
RUN apk add --no-cache --virtual .build-deps \
    alpine-sdk \
    git \
    postgresql-dev \
    clang \
    llvm

# Clone pgvector at a specific version that doesn't require clang-19
RUN git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && \
    make install && \
    cd .. && rm -rf pgvector

# Remove build dependencies
RUN apk del .build-deps
