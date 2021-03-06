#!/bin/bash

set -e

echo "-------------------------------------------------------------------------------"
echo "-- Starting WebSocket Server Runner                                          --"
echo "-------------------------------------------------------------------------------"
# Uncomment if you need to debug `bin/chat-server.php`
#bin/run.sh > /var/log/chat.log 2>&1 &
bin/run.sh &

echo "-------------------------------------------------------------------------------"
echo "-- Sleeping                                                                  --"
echo "-------------------------------------------------------------------------------"
sleep 5

echo "-------------------------------------------------------------------------------"
echo "-- hitch --frontend=[*]:8443 --backend=[talk2mechat]:55000 /talk2me/cert.pem --"
echo "-------------------------------------------------------------------------------"
exec hitch --config=./hitch.conf

echo "-------------------------------------------------------------------------------"
echo "-- Done                                                                      --"
echo "-------------------------------------------------------------------------------"
