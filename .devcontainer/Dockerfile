FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

# install npm and unzip
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends npm unzip

# install docker
RUN curl -fsSL https://get.docker.com | bash

# install bun
RUN curl -fsSL https://bun.sh/install | bash

# install concurrently package for running multiple commands
# https://www.npmjs.com/package/concurrently
RUN npm install -g concurrently

CMD [ "sleep", "infinity" ]
