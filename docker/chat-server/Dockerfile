# docker build -t talk2mechat --rm=true .
FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get -y install \
        apt-utils \
        git \
        sudo \
        fail2ban \
        vim \
        unzip \
        zip \
        curl \
        php \
        php-curl \
        php-json \
        php-mongodb \
        php-mysql \
        php-zip \
        hitch && \
    apt-get -y autoremove && \
    apt-get -y clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 80

WORKDIR /talk2me

ENTRYPOINT ["/bin/bash", "startup.sh"]
