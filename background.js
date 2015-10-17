/*
 * Notifications
 */

function notify(stream) {
    if (settings.notify != 1) {
        return;
    }

    if (typeof(stream.data.avatar) === "undefined" || stream.data.avatar == '') {
        stream.data.avatar = 'files/defaultAvatar.png';
    }
    if (typeof(stream.data.description) === "undefined" || stream.data.description == '') {
        stream.data.description = '';
    }

    var options = {
        type: 'basic',
        title: stream.name,
        message: '',
        contextMessage: stream.data.description,
        iconUrl: stream.data.avatar,
        isClickable: true
    }
    chrome.notifications.create(stream.name, options, function () {
    });

    setTimeout(function () {
        chrome.notifications.clear(stream.name, function () {
        });
    }, 5000);

}

/*
 * Check streams status
 */

function processData(stream, data) {
    if (stream.data.online !== data.online && data.online === true) {
        stream.data = data;
        notify(stream);
    } else {
        stream.data = data;
    }
}

function getData_twitch(stream) {
    var url = "https://api.twitch.tv/kraken/streams/" + stream.platform_id;
    $.ajax({
        url: url,
        dataType: 'json',
        success: function (resp) {
            var data = {};
            if (resp.stream === null) {
                data = {
                    online: false,
                    viewers: 0
                }
            } else {
                data = {
                    online: true,
                    viewers: resp.stream.viewers,
                    avatar: resp.stream.channel.logo,
                    description: resp.stream.channel.status
                }
            }
            processData(stream, data);
        },
        error: function (resp) {
            processData(stream, {online: false, viewers: 0});
        },
        timeout: 5000,
        cache: false
    });
}

function getData_hitbox(stream) {
    var url = "http://api.hitbox.tv/media/live/" + stream.platform_id;
    var staticUrl = "http://edge.sf.hitbox.tv/";
    $.ajax({
        url: url,
        dataType: 'json',
        methos: "GET",
        success: function (resp) {
            var data = {};
            if (resp.livestream[0].channel.media_is_live === "0") {
                data = {
                    online: false,
                    viewers: 0
                }
            } else {
                data = {
                    online: true,
                    viewers: resp.livestream[0].media_views,
                    avatar: staticUrl + resp.livestream[0].channel.user_logo,
                    description: resp.livestream[0].media_status
                }
            }
            processData(stream, data);
        },
        error: function (resp) {
            processData(stream, {online: false, viewers: 0});
        },
        timeout: 5000
    });
}

function getData(stream) {
    switch (stream.platform) {
        case 'twitch':
            getData_twitch(stream);
            break;
        case 'hitbox':
            getData_hitbox(stream);
            break;
    }
}

function refresh() {
    $.each(streams, function (key, stream) {
        getData(stream);
    });
}

var streams = [];
function __addStream(name, url, platform, platform_id) {
    streams.push({
        name: name,
        url: url,
        platform: platform,
        platform_id: platform_id,
        data: {online: false, viewers: 0}
    });
    saveStreams();
}
function loadStreams() {
    streams = localStorage['streams'];
    if (!streams) {
        streams = [];
        return;
    }
    streams = JSON.parse(localStorage['streams']);
    $.each(streams, function (key, value) {
        streams[key].data = {online: false, viewers: 0};
    });
}
function saveStreams() {
    localStorage['streams'] = JSON.stringify(streams);
}

/*
 * Settings
 */
var settings = {};
function loadSettings() {
    settings.freq = localStorage['streams-freq'] ? localStorage['streams-freq'] : 120;
    settings.onlyOnline = localStorage['streams-onlyOnline'] ? localStorage['streams-onlyOnline'] : 0;
    settings.notify = localStorage['streams-notify'] ? localStorage['streams-notify'] : 1;
}
function saveSettings() {
    $.each(settings, function (key, value) {
        localStorage['streams-' + key] = value;
    });
}

/*
 * init
 */
$(document).ready(function () {
    loadSettings();
    loadStreams();

    refresh();
    setInterval(refresh, settings.freq * 1000);
});
