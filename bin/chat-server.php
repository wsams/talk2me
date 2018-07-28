<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use Talk2Me\Chat;

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/bin/config.php';

$mysql = null;
if ($cfg['allowPersistentRooms']) {
    $mysql = mysqli_connect(
        $cfg['mysqlHost'],
        $cfg['mysqlUsername'],
        $cfg['mysqlPassword'],
        $cfg['mysqlDatabase']
    );
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Chat($cfg, $mysql)
        )
    ),
    $cfg['webSocketPort']
);

$server->run();
