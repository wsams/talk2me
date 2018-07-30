# talk2me

This chat application is designed for for use within a web browser and is focused on simplicity and anonymous secure chat.

## Features

* Secure WebSockets over hitch for secure instant chat.
* Rooms with multiple users.
    * Persistent chat room messages stored in MySQL if enabled.
* Client-side[1] encryption with [http://bitwiseshiftleft.github.io/sjcl/](Stanford Javascript Crypto Library).
* Current status. e.g. Free, Away, Busy, Idle, ...
* Slash commands similar to IRC. Implement `CommandPlugin` for custom slash commands. e.g. /help
* User is typing notification.
* Growl messages for events such as: status changes, sign on, sign off, user is typing, ...
* Messages formatting with markdown syntax.

## INSTALL

### Install composer dependencies

```
composer install

# OR

composer update
```

If you don't have composer installed you can easily use a docker container containing composer to install the dependencies.

Create an empty directory somewhere on your system and add a file named `Dockerfile` with the following contents:

```
# docker build -t talk2me-composer --rm=true .
FROM composer:1.6

RUN apk add --update --no-cache gmp gmp-dev \
    && docker-php-ext-install gmp

CMD [ "composer" ]
```

Now run the following command while in that directory:

```
docker build -t talk2me-composer --rm=true .
```

Now change back to the root of you talk2me clone and run this command:

```
docker run -it --rm -v (pwd):(pwd) -w (pwd) -u (id -u) talk2me-composer update
```

This will mount the current directory inside the container and will run `composer update` on it effectively doing the same thing as a local installation of `composer`.

### SSL certificate

Create a `cert.pem` file in the root directory, or re-configure `docker-compose.yml`. You can create your certificates for free using Lets Encrypt. For example use `certbot` to create the certificates. Make sure you include the cert and private key in `cert.pem`. For example: `cat cert.key cert.crt > cert.pem`

### Chat server config

Copy `bin/example.config.php` to `bin/config.php`.

If you want persistent chat rooms set `allowPersistentRooms = true` and update MySQL properties. These will also need to go in `.env` which is discussed in the next section. If you're not using persistent chat you can remove them.

**Do not change `webSocketPort` unless you update the port in `hitch.conf`**

### Web app config

Copy `html/cdn/js/example.config.js` to `html/cdn/js/config.js`.

Update `webSocketUrl`. It should be something like: `var webSocketUrl = "wss://example.com:8443";`. If you change `WEBSOCKET_PORT` in the Docker `.env` then you will need to update here as well as `hitch.conf`.

If you set `allowPersistentRooms` to `true` in the chat server config above then also set it to `true` here as well, otherwise both should be `false`.

### Docker environment properties

Copy `example.env` to `.env`. If using persistent chat rooms update the `MYSQL_` properties as appropriate.

Update `WEBSOCKET_PORT` only if you want a different port. You must also update it in `hitch.conf`.

### Start Docker Containers

Start the MySQL container and wait until it fully starts if you want persistent chat rooms:

```
docker-compose up -d mysql
```

The schema should automatically be created when the container starts, but if not you may follow these commands to import the schema manually. The [official `mysql:5.7` image](https://hub.docker.com/_/mysql/) is used.

```
docker run -it THE_MYSQL_CONTAINER_NAME bash
mysql -u root -p talk2me < /docker-entrypoint-initdb.d/init.sql
exit
```

Build the web application image:

```
cd docker/web-server
docker build -t talk2me --rm=true .
cd ../../
```

Currently the `html` directory is bind mounted into the container at `/var/www/html`. The web server is running as user `www-data` so all of the files in this directory should match the same uid. You may need to create a `www-data` user on your host system with uid=33 and gid=33. Then change the permissions of this directory so that apache can read the files. For example: `chown -R www-data:www-data html`. Using a named volume should get around this issue. If you need to create the local `www-data` user on a linux system you can use a command like the following: `useradd -g 33 -u 33 -s /sbin/nologin www-data`. It may also be possible to go inside the container (`docker exec -it talk2mewww bash`) and change the permissions without creating a local user account. `chown -R www-data:www-data /var/www/html`. You may not be able to access the files on your local system without `root` so be aware.

Start the web application container:

```
docker-compose up -d www
```

Build the chat server image:

```
cd docker/chat-server
docker build -t talk2mechat --rm=true .
cd ../../
```

Start the chat server:

```
docker-compose up -d chat
```

You may want to use a `docker-compose.override.yml` file. One like the following will allow you to name your containers and connect them to a particular network.

```
version: "2"
services:
  www:
    container_name: talk2mewww
  mysql:
    container_name: talk2memysql
  chat:
    container_name: talk2mechat
networks:
  default:
    external:
      name: my_network_name_goes_here
```

## Persistent Chat Rooms

Persistent chat rooms are not enabled by default and are never required when entering a room. If you click the checkbox on the login page to **Create or join a persistent room** all of your messages will be logged. If you do not check the box your messages will not be logged. You can tell if a user is logging there messages when an exclamation mark is appended to their username. e.g. `@foobar!`

Note: There is no URL syntax for logging into a room with encrypting messages enabled. If you are logged into a room with encryption enabled and you refresh the browser, your encryption password will be lost. You will need to logout and back in manually with the same encryption password. Your encryption password is only valid until you close the browser window or tab, or refresh.

## Encrypted messages

Encryption is handled by the Stanford Javascript Crypto Library and happens entirely within your browser.

To encrypt your messages, check **Enable client-side encryption** before entering a chat room. Users with a lock symbol to the left of their usernames indicate that they are encrypting their messages. Both encrypting users and non-encrypting users may chat in the same room, however, non-encrypting users cannot see the messages of users encrypting their messages. Vice versa does not hold. Users that are encrypting their messages may still see non-encrypting user's messages. If you are encrypting your messages, those messages that are encrypted will have a lock symbol to the left of the message.

Your encryption password must be greater than 7 characters - no other requirements.

## Chat Usage

You may automatically log in by appending a HASH to the URL. Enter any room name and username.

e.g. https://www.example.com/talk2me/#room@username

To enter a persistent room, if enabled, append an exclamation mark.

e.g. https://www.example.com/talk2me/#room@username!

*Note, a username may only be a member of one room at any time.*

### Message Filtering (Wiki like syntax)

Embed YouTube videos.

    {youtube}https://www.youtube.com/watch?v=mgMn68Rgva0{/youtube}

Insert image.

    {http://www.example.com/image.jpg}

Insert hyper link with custom text.

    [http://www.example.com | This is a link]

Insert a hyper link.

    [http://www.example.com]

Bold text.

    '''make me bold'''

Italic text.

    ''make me italic''

Strikethrough text.

    {-strike me-}

Monospace code font.

    @@This will be monospace@@

Create a line break. i.e. &lt;br /&gt;

    {br}

Code blocks.

    {code}
    function foo() {
        console.log('hello world');
    }
    {/code}

## Command Plugin

To enable the command plugin copy `src/Talk2Me/example.CommandPlugin.php` to `src/Talk2Me/CommandPlugin.php`.

This plugin contains a single function `execute()` that is called for every message handled. If the message being
sent contains a command it will be parsed and handled and most likely should return immediately. If it does not
return the message will be sent to clients connected to the room.

In the example below if you send the message `/samplecommand` only you will receive a message back saying `Executing sample command`.

You must `return true` if a command was executed and you only want to send the message to `$from`.

The `execute()` function should `return false` in all other cases.

    public function execute($from, $json, $t) {
        if (preg_match("/\/samplecommand/", $json->msg)) {
            $o = array("status"=>"ok", "a"=>"message", "t"=>$t,
                    "msg"=>"Executing sample command");
            $from->send(json_encode($o));
        }
        return true;
    }

You can have any number of command that do just about anything you want. For example you might want a command such as `/weather 90210` that
will return the current forecast.

You could even implement a whole slew of admin commands. e.g. `/admin <password> broadcast-all '<message to send to all connected clients on server>'`

## Notes

This application runs on these two official images from Docker Hub: `mysql:5.7` and `ubuntu:18.04`. The web application runs on the default `apache2` package from Ubuntu. See `docker/web-server/Dockerfile` and `docker/chat-server/Dockerfile` for configuration.

The `messages` table `message` column content will be changed soon and will require a migration, however encrypted content cannot be migrated easily. Persistent chat should be used without the intent of long term storage until this work is complete. The migration won't be difficult but will require a bit of work.

Currently user can only be a member of a single room at any given time. To join multiple rooms simultaneously you must open new browser windows and choose a different username for each session. This may change in the future.

## Disclaimer

The author of this software is not a security expert and does not provide any warranty or guarantee that this application is as secure as it can be. Use at your own risk. SSL should always be used. Websockets are encrypted by proxying through `hitch` and chat messages are encrypted in the browser using `jscl.js`. See http://bitwiseshiftleft.github.io/sjcl/ for more information.
