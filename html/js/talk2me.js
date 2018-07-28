;(function() {
    var isLoggedIn = false;
    var threshold = 2000;
    var lastTyping = parseInt(new Date().getTime()) - threshold;
    var usekey = false;
    var persistent = false;
    var secret = "";
    var connected = false;
    var reConnecting = false;
    var idle = false;
    var lastActive = moment().format("X");
    var room = "";
    var username = "";
    var windowFocused = true;
    var messageCount = 0;
    var conn = null;
    var messagesShown = 0;
    var persistentURLBit = "!";
    var linker = new Autolinker({
        newWindow: true,
        stripPrefix: false,
        email: false,
        twitter: false,
        urls: true
    });

    function random(min, max) {
        "use strict";
        return Math.round(Math.random() * (max - min) + min);
    }

    Date.prototype.today = function () {
        return (this.getFullYear()) + "-"
                + (((this.getMonth()+1) < 10) ? "0" : "") + (this.getMonth()+1) + "-"
                + ((this.getDate() < 10) ? "0" : "") + this.getDate();
    }

    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours()
                +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes()
                +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }

    String.prototype.trim = function() {
        return this.replace(/^\s +|\s +$/g, "");
    }

    String.prototype.ltrim = function() {
        return this.replace(/^\s +/, "");
    }

    String.prototype.rtrim = function() {
        return this.replace(/\s +$/, "");
    }

    function htmlspecialchars(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function getTimestamp() {
        "use strict";
        var d = new Date();
        return d.today() + " " + d.timeNow();
    }

    function sendMessage(msg) {
        "use strict";
        if (undefined === msg || msg.length < 1) {
            return;
        }
        if (msg.match(/^\s*(\/logout|\/exit|\/quit|\/q)\s*$/)) {
            logout();
            return;
        } else if (msg.match(/^\s*\/room\s*[0-9a-zA-Z_\-\.]{1,16}!?\s*$/)) {
            var room = msg.replace(/\/room\s*([0-9a-zA-Z_\-\.]{1,16})!?\s*/, "$1");
            if (msg.match(/^\s*\/room\s*[0-9a-zA-Z_\-\.]{1,16}!\s*$/)) {
                window.location.hash = "#" + room + "@" + username + "!";
            } else {
                window.location.hash = "#" + room + "@" + username;
            }
            location.reload();
            return;
        } else if (msg.match(/^\s*(\/search|\/find)/)) {
            var q = msg.replace(/^\s*(\/search|\/find)\s*(.*?)\s*$/, "$2");
            var request = {"a": "search", "q": q, "persistent": persistent, "encrypted": usekey};
            conn.send(JSON.stringify(request));
            return;
        } else if (msg.match(/^\s*(\/clear|\/refresh)\s*$/)) {
            clearMessages();
            return;
        }

        msg = "<span class=\"room-user-message\">@" + username + "</span> " + htmlspecialchars(msg)
                + " <span class=\"timestamp\">" + getTimestamp() + "</span>";
        // strip_tags(msg, "<strong><em><table><thead><tbody><tr><th><td><img><br><br/><a><p><div><ul><li><ol><span><hr><hr/><dd><dl><dt>");
        var orgMsg = msg;

        if (usekey) {
            msg = encryptMessage(msg);
        }

        if (!msg) {
            $.jGrowl("Message not sent - could not encrypt!", { life: 8000, group: "error-encryption" });
        } else {
            var request = {"a": "message", "msg": msg, "persistent": persistent, "encrypted": usekey};
            conn.send(JSON.stringify(request));
            appendMessage(orgMsg, usekey);
        }

        scrollToTop();
    }

    function scrollToBottom() {
        "use strict";
        $("html, body").animate({ scrollTop: $(document).height() - $(window).height() });
    }

    function scrollToTop() {
        "use strict";
        $("html, body").animate({ scrollTop: 0 });
    }

    function removeErrorMessages() {
        "use strict";
        var errMsg = $("#error");
        if (errMsg.size() > 0) {
            errMsg.each(function(i, r) {
                $(r).remove()
            });
        }
    }

    function updateRoomMember(username, currentStatus, encrypted) {
        "use strict";

        var lockHTML = "";
        if (encrypted) {
            lockHTML = getUserLockHTML() + " ";
        }

        var usernameHtml = "";
        if (currentStatus === "Free") {
            usernameHtml = lockHTML + "@" + username;
        } else {
            usernameHtml = lockHTML + "@" + username + ".<span class=\"user-status\">" + currentStatus + "</span>";
        }

        var user = $(".room-user[data-username='" + username + "']");
        if (user.size() > 0) {
            var userHtml = "<span class=\"room-user\" data-username=\"" + username + "\">" + usernameHtml + "</span>";
            // These two lines move the user to the front of the list as they are the most active.
            removeRoomMember(username);
            $("#users-online").prepend(userHtml);
        }
    }

    function addRoomMember(username, encrypted) {
        "use strict";

        var lockHTML = "";
        if (encrypted) {
            lockHTML = getUserLockHTML() + " ";
        }

        var user = $(".room-user[data-username='" + username + "']");
        if (user.size() < 1) {
            var userHtml = "<span class=\"room-user\" data-username=\"" + username + "\">" + lockHTML + "@" + username + "</span>";
            // This line moves the user to the front of the list as she is the most active.
            $("#users-online").prepend(userHtml);
        }
    }

    function removeRoomMember(username, encrypted) {
        "use strict";
        var user = $(".room-user[data-username='" + username + "']");
        if (user.size() > 0) {
            user.remove();
        }
    }

    function updateRoomMembers(users) {
        "use strict";
        for (var username in users) {
            var user = $(".room-user[data-username='" + username + "']");
            if (user.size() < 1) {
                $("#users-online").append("<span class=\"room-user\" data-username=\""
                        + username + "\">" + users[username] + "</span>");
            }
        }
    }

    function showMessage(encrypted, usekey) {
        if (!encrypted || (usekey && encrypted)) {
            return true;
        } else {
            return false;
        }
    }

    function handleMessage(json) {
        "use strict";
        if (isLoggedIn) {
            var jsonObj = JSON.parse(json);
            if (jsonObj.a === "message" && jsonObj.t === "typing") {
                if (showMessage(jsonObj.encrypted, usekey)) {
                    if ($(".from-" + jsonObj.from).size() < 1) {
                        $.jGrowl(jsonObj.msg, { life: 3500, group: "from-" + jsonObj.from });
                    }
                }
            } else if (jsonObj.a === "message" && jsonObj.t === "status-message") {
                if (showMessage(jsonObj.encrypted, usekey)) {
                    // This is where we add, remove or update a person in room.
                    if (jsonObj['statusType'] === "disconnect") {
                        removeRoomMember(jsonObj.username, jsonObj.encrypted);
                    } else if (jsonObj['statusType'] === "join") {
                        addRoomMember(jsonObj.username, jsonObj.encrypted);
                    } else if (jsonObj['statusType'] === "statusChange") {
                        updateRoomMember(jsonObj.username, jsonObj['currentStatus'], jsonObj.encrypted);
                    }

                    $.jGrowl(jsonObj.msg, { life: 1500, group: "from-status-" + jsonObj.from });
                }
            } else if (jsonObj.a === "message" && jsonObj.t === "who") {
                updateRoomMembers(jsonObj.users);
            } else if (jsonObj.a === "message" && jsonObj.t === "message") {
                if (jsonObj.msg) {
                    // Decrypt messages if using a key.
                    if (usekey && jsonObj.encrypted) {
                        jsonObj.msg = decryptMessage(jsonObj.msg);
                    }

                    if (showMessage(jsonObj.encrypted, usekey)) {
                        // Remove Growls on message received.
                        if ($(".from-" + jsonObj.from).size() > 0) {
                            lastTyping = parseInt(new Date().getTime()) - threshold;
                            $(".from-" + jsonObj.from).remove();
                        }

                        // Only play sounds for these types of messages.
                        var notif = new Audio("sounds/" + notifMessage);
                        notif.volume = soundVolume;
                        notif.play();

                        // Append message to page
                        appendMessage(jsonObj.msg, jsonObj.encrypted);

                        // Increment favicon
                        if (!windowFocused && jsonObj.t === "message") {
                            Tinycon.setBubble(++messageCount);
                        }
                    }
                }
            } else if (jsonObj.a === "showMoreMessages") {
                showMoreMessages(jsonObj);
            } else if (jsonObj.a === "login") {
                if (jsonObj.isLoggedIn) {
                    removeErrorMessages();
                    $("#login-form").prepend("<div id=\"error\"></div>");
                    $("#error").addClass("alert alert-warning fade in")
                            .append("<button id=\"close\">&times;</button>");
                    $("#close").addClass("close").attr({"type":"button", "data-dismiss":"alert"})
                            .after("Username already taken");
                } else {
                    var source = $("#message-form").html();
                    var template = Handlebars.compile(source);
                    var context = {room: room, username: username}
                    var html = template(context);
                    $("#login-form").replaceWith(html);
                    if (persistent) {
                        $(".messages").before("<div class=\"more-messages-alert container\">"
                                + "Persistent messages enabled</div>");
                        // Display all messages from room when first logging into room.
                        $.each(jsonObj.messages, function(k, v) {
                            if (v.item.encrypted) {
                                v.item.message = getMessageLockHTML() + " " + decryptMessage(v.item.message);
                            }

                            if (v.item.message) {
                                $(".messages").append("<div class=\"well well-sm message\">"
                                        + Wwiki.render(linker.link(v.item.message)) + "</div>");
                            }
                        });
                        var s = $(jsonObj.messages).size();
                        messagesShown = s;
                        if (s > 0 && s === jsonObj.moreMessagesLimit) {
                            $(".messages").append("<div class=\"more-messages\"><button type=\"button\" "
                                    + "class=\"btn btn-default\" id=\"show-more-messages\">More</button>");
                            applyShowMoreEvent();
                        }
                    }
                    $("#message").focus();
                    $("#message").keypress(function (e) {
                        if (e.which == 13) {
                            e.preventDefault();
                            sendMessageAction();
                            return false;
                        } else {
                            // This will only send a typing message at most every 'threshold' seconds.
                            var curTyping = parseInt(new Date() . getTime());
                            var test = curTyping - threshold;
                            if (curTyping - threshold > lastTyping) {
                                sendTyping();
                                lastTyping = curTyping;
                            }
                        }
                    });
                    $("#send-message").on("click", function() {
                        sendMessageAction();
                    });
                    applyLogoutEvent();
                    applyWhoEvent();
                    applyClearMessagesEvent();
                    applyChangeStatusEvent();
                    $(".btn-tooltip").tooltip();
                }
            }
        }
    }

    function sendMessageAction() {
        sendMessage($("#message").val());
        $("#message").val('');
        $("#message").focus();
    }

    function sendTyping() {
        "use strict";
        var request = {"a": "typing", "encrypted": usekey};
        conn.send(JSON.stringify(request));
    }

    /**
     * This function should match that in Chat.php
     */
    function getMessageLockHTML() {
        return "<span class=\"glyphicon glyphicon-lock btn-tooltip\" title=\"This message is encrypted.\"></span>";
    }

    /**
     * This function should match that in Chat.php
     */
    function getUserLockHTML() {
        return "<span class=\"glyphicon glyphicon-lock btn-tooltip\" title=\"This users messages are encrypted.\"></span>";
    }

    function appendMessage(msg, encrypted) {
        "use strict";
        if (encrypted) {
            msg = getMessageLockHTML() + " " + msg;
        }
        $(".messages").prepend("<div class=\"well well-sm message\">" + Wwiki.render(linker.link(msg)) + "</div>");
    }

    function login() {
        "use strict";
        room = $("#room").val().trim();
        username = $("#username").val().trim();
        if (undefined !== username && username.match(/^[0-9a-zA-Z_\-\.]{1,16}$/)) {
            isLoggedIn = true;

            if (undefined !== room && room.length > 1) {
                if (!room.match(/^[0-9a-zA-Z_\-\.]{1,16}$/)) {
                    removeErrorMessages();
                    $("#login-form").prepend("<div id=\"error\"></div>");
                    $("#error").addClass("alert alert-warning fade in")
                            .append("<button id=\"close\">&times;</button>");
                    $("#close").addClass("close").attr({"type":"button", "data-dismiss":"alert"})
                            .after("Rooms must be 1-16 of these characters: 0-9a-zA-Z_-.");
                    return false;
    }
            } else {
                room = "public";
            }

            if ($("#usekey").is(":checked")) {
                usekey = true;
                secret = $("#secret").val();
                var l = secret.length;
                if (l < 8) {
                    removeErrorMessages();
                    $("#login-form").prepend("<div id=\"error\"></div>");
                    $("#error").addClass("alert alert-warning fade in")
                            .append("<button id=\"close\">&times;</button>");
                    $("#close").addClass("close").attr({"type":"button", "data-dismiss":"alert"})
                            .after("Secret key for client-side encryption must be between 16 and 32 characters.");
                    return false;
                }
            } else {
                usekey = false;
                secret = "";
            }

            if ($("#persistent").is(":checked")) {
                persistent = true;
                window.location.hash = room + "@" + username + persistentURLBit;
            } else {
                window.location.hash = room + "@" + username;
            }

            $(".header").hide();

            startConnection(room, username);
        } else {
            $(".header").show();
            removeErrorMessages();
            $("#login-form").prepend("<div id=\"error\"></div>");
            $("#error").addClass("alert alert-warning fade in")
                    .append("<button id=\"close\">&times;</button>");
            $("#close").addClass("close").attr({"type":"button", "data-dismiss":"alert"})
                    .after("Usernames must be 1-16 of these characters: 0-9a-zA-Z_-.");
            return false;
        }
    }

    function applyLogoutEvent() {
        "use strict";
        $("#logout").on("click", function() {
            logout();
        });
    }

    function logout() {
        "use strict";
        isLoggedIn = false;
        usekey = false;
        secret = "";
        var request = {"a": "logout", "encrypted": usekey};
        conn.send(JSON.stringify(request));
        window.location.href = window.location.protocol + "//"
                + window.location.hostname + window.location.pathname;
    }

    function applyChangeStatusEvent() {
        "use strict";
        $(".chg-status").on("click", function() {
            var newStatus = $(this).text();
            sendChangeStatus(newStatus);
            $("#message").focus();
            scrollToTop();
        });
    }

    function sendChangeStatus(newStatus) {
        "use strict";
        updateRoomMember(username, newStatus, usekey);
        $("#current-status").text(newStatus);
        var request = {"a": "statusChange", "status": newStatus, "encrypted": usekey};
        conn.send(JSON.stringify(request));
    }


    function getStatus() {
        "use strict";
        return $("#current-status").text();
    }

    function applyWhoEvent() {
        "use strict";
        $("#who").on("click", function() {
            who();
        });
    }

    function applyClearMessagesEvent() {
        "use strict";
        $("#clear-messages").on("click", function() {
            clearMessages();
        });
    }

    function clearMessages() {
        "use strict";
        var messages = $(".message");
        if (messages.size() > 0) {
            messages.each(function(i, r) {
                $(r).remove();
            });
            who();
        }
    }

    function who() {
        "use strict";
        var request = {"a": "who", "encrypted": usekey};
        conn.send(JSON.stringify(request));
        $("#message").focus();
        scrollToTop();
    }

    function strip_tags(input, allowed) {
        "use strict";
        //  discuss at: http://phpjs.org/functions/strip_tags/
        allowed = (((allowed || '') + '').toLowerCase()
                .match(/<[a-z][a-z0-9]*>/g) || []).join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
            commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
        });
    }

    function loginToRoom(room, username) {
        "use strict";
        try {
            var request = {"a": "login", "room": room, "username": username, "persistent": persistent, "encrypted": usekey};
            conn.send(JSON.stringify(request));
        } catch (ex) {
        }
    }

    function startConnection(room, username) {
        "use strict";
        if (!connected) {
            conn = new WebSocket(webSocketUrl);

            conn.onopen = function(e) {
                if (reConnecting) {
                    clearMessages();
                }
                connected = true;
                reConnecting = false;
                loginToRoom(room, username);
            };

            conn.onclose = function(e) {
                isLoggedIn = false;
                connected = false;
                $("#message").remove();
                if (!reConnecting) {
                    $(".main-control").html("<div id=\"login-form\"><!--add form on reconnect--></div>");
                    var source = $("#connection-lost-msg").html();
                    var template = Handlebars.compile(source);
                    var context = {timestamp: getTimestamp()};
                    var html = template(context);
                    appendMessage(html);
                    reConnect();
                }
            };

            conn.onerror = function(e) {
                isLoggedIn = false;
                connected = false;
                $("#message").remove();
                if (!reConnecting) {
                    $(".main-control").html("<div id=\"login-form\"><!--add form on reconnect--></div>");
                    var source = $("#connection-lost-msg").html();
                    var template = Handlebars.compile(source);
                    var context = {timestamp: getTimestamp()};
                    var html = template(context);
                    appendMessage(html);
                    reConnect();
                }
            };

            conn.onmessage = function(e) {
                if (isLoggedIn) {
                    handleMessage(e.data);
                }
            };
        } else {
            loginToRoom(room, username);
        }
    }

    function reConnect() {
        "use strict";
        reConnecting = true;
        if (!connected) {
            if ($("#room").size() < 1) {
                $("body").append("<input id=\"room\" type=\"hidden\" />");
            }
            if ($("#username").size() < 1) {
                $("body").append("<input id=\"username\" type=\"hidden\" />");
            }
            if (persistent && $("#persistent").size() < 1) {
                $("body").append("<input id=\"persistent\" checked=\"checked\" "
                        + "type=\"checkbox\" value=\"yes\" "
                        + "style=\"display:none; visibility:hidden;\" />");
            }
            init();
            setTimeout(reConnect, 2000);
            $(".more-messages").remove();
            $(".more-messages-alert").remove();
            $(".messages").children().remove();
        }
    }

    function autoSetStatus() {
        "use strict";
        var now = moment().format("X");
        var elapsed = now - lastActive;
        if (!idle && elapsed > idleInSeconds && getStatus() === "Free") {
            sendChangeStatus("Idle");
            idle = true;
        }
        setTimeout(autoSetStatus, 5000);
    }

    function resetIdleStatus() {
        "use strict";
        if (idle) {
            idle = false;
            lastActive = moment().format("X");
            sendChangeStatus("Free");
        }
    }

    function init() {
        "use strict";
        autoSetStatus();
        room = "";
        username = "";
        var hash = window.location.hash;
        if (hash.match(/#/) && hash.match(/@/)) {
            if (hash.match(/!/)) {
                $("#persistent").prop("checked", true);
                room = hash.replace(/^#(.*)@.*/, "$1");
                $("#room").val(room);
                username = hash.replace(/^#.*@(.*)!$/, "$1");
                $("#username").val(username);
            } else {
                persistent = false;
                room = hash.replace(/^#(.*)@.*/, "$1");
                $("#room").val(room);
                username = hash.replace(/^#.*@(.*)$/, "$1");
                $("#username").val(username);
            }
            login();
        }
    }

    function switchClass(thiz, from, to) {
        "use strict";
        if (thiz.size() > 0) {
            if (thiz.hasClass(from)) {
                thiz.removeClass(from);
            }
            if (!thiz.hasClass(to)) {
                thiz.addClass(to);
            }
        }
    }

    /**
    * http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    */
    function ab2str(buf) {
        "use strict";
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    function makeIV() {
        var text = "";
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 16; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }

    function encryptMessage(msg) {
        "use strict";
        try {
            return sjcl.encrypt(secret, msg);
        } catch (ex) {
            console.log("Could not encrypt message.");
            return false;
        }
    }

    function decryptMessage(msg) {
        "use strict";
        try {
            return sjcl.decrypt(secret, msg);
        } catch (ex) {
            console.log("Could not decrypt message.");
            return false;
        }
    }

    function getMoreMessages() {
        $(".more-messages").remove();
        var request = {"a": "moreMessages", "persistent": persistent, "offset": messagesShown, "encrypted": usekey};
        conn.send(JSON.stringify(request));
    }

    function showMoreMessages(jsonObj) {
        "use strict";
        if (persistent) {
            $.each(jsonObj.messages, function(k, v) {
                if (v.item.encrypted) {
                    v.item.message = getMessageLockHTML() + " " + decryptMessage(v.item.message);
                }

                $(".messages").append("<div class=\"well well-sm message\">"
                        + Wwiki.render(linker.link(v.item.message)) + "</div>");
            });
            var s = $(jsonObj.messages).size();
            messagesShown += s;
            if (s > 0 && s === jsonObj.moreMessagesLimit) {
                $(".messages").append("<div class=\"more-messages\"><button type=\"button\" "
                        + "class=\"btn btn-default\" id=\"show-more-messages\">More</button>");
                applyShowMoreEvent();
            }
        }
    }

    function applyShowMoreEvent() {
        $("#show-more-messages").on("click", function() {
            getMoreMessages();
        });
    }

    $(document).ready(function() {

        init();

        if (!allowPersistentRooms) {
            $(".persistent-wrapper").remove();
        }

        $("pre").livequery(function() {
            $("pre").each(function(i, e) {
                hljs.highlightBlock(e)
            });
        });

        $(".btn-tooltip").livequery(function() {
            $(".btn-tooltip").tooltip();
        });

        $(".btn-help").livequery(function() {
            $(".btn-help").popover({ html: true, placement: "auto left" });
        });

        $("#room").focus();

        $("#room, #username").keypress(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                login();
                return false;
            }
        });

        $("#login-button").on("click", function() {
            login();
            return false;
        });

        applyLogoutEvent();

        $("#usekey").on("click", function() {
            if ($("#usekey").is(":checked")) {
                switchClass($("#keyform"), "block-hidden", "block-visible");
                $("#secret").focus();
            } else {
                switchClass($("#keyform"), "block-visible", "block-hidden");
            }
        });

        $("#secret").on("keyup", function() {
            var l = $("#secret").val().length;
            if (l >= 8) {
                $("#key-length").css("color", "green");
                $("#key-length").html("Valid key");
            } else {
                $("#key-length").css("color", "red");
                $("#key-length").html(l + " characters");
            }
        });

        $(window).on("unload", function() {
            return confirm("Are you sure you want to logout?");
        });

        $(window).focus(function() {
            windowFocused = true;
            messageCount = 0;
            Tinycon.setBubble(messageCount);
            if (idle) {
                resetIdleStatus();
            }
        }).blur(function() {
            windowFocused = false;
        });

        $(window).on("mouseenter, mousemove, mouseover, scroll, resize, keypress, click", function() {
            if (idle) {
                resetIdleStatus();
            }
        });

    });
})();
