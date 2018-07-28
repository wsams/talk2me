#!/bin/bash

# This variable is the absolute path to the
# bin directory in the talk2me root directory.
bindir="/talk2me/bin"

while true; do
    echo "Starting chat-server.php";
    php ${bindir}/chat-server.php
    echo "Chat server died: `date`"
    sleep 2
done
