FROM mcr.microsoft.com/vscode/devcontainers/python:3.12

RUN mkdir /app /app/logs /app/config

# install npm and unzip
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends npm unzip

# install docker
RUN curl -fsSL https://get.docker.com | bash

# install regctl
# https://github.com/regclient/regclient
RUN curl -L https://github.com/regclient/regclient/releases/latest/download/regctl-linux-amd64 > /usr/bin/regctl
RUN chmod 755 /usr/bin/regctl

# install bun
RUN curl -fsSL https://bun.sh/install | bash

# install concurrently package for running multiple commands
# https://www.npmjs.com/package/concurrently
RUN npm install -g concurrently

CMD [ "sleep", "infinity" ]
