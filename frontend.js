var streams = null;

var flashMessages = {
    // message types
    TYPE_NOTIFICATION: 'notification',
    TYPE_SUCCESS: 'success',
    TYPE_WARNING: 'warning',
    TYPE_ERROR: 'error',
    TYPE_INFO: 'info',
    // slide duration (ms)
    slideDuration: 300,
    // container for flash messages
    container: "#flashMessages",
    /**
     * This function check if passed type exist in system.
     * If not return type: notification.
     *
     * @param type
     * @returns {string}
     */
    getType: function (type) {
        switch (type) {
            case this.TYPE_NOTIFICATION:
            case this.TYPE_SUCCESS:
            case this.TYPE_WARNING:
            case this.TYPE_ERROR:
            case this.TYPE_INFO:
                return type;
                break;
            default:
                return this.TYPE_NOTIFICATION;
        }
    },
    /**
     * This function return font-awesome icon for passed type.
     *
     * @param type
     * @returns {jQuery}
     */
    createIcon: function (type) {
        // create new icon
        var $icon = $("<div>", {
            class: "icon"
        });
        // get supported type
        type = this.getType(type);
        // set default icon (notification)
        var iconClass = 'fa fa-fw fa-paperclip';
        // get class icon
        switch (type) {
            case this.TYPE_SUCCESS:
                iconClass = 'fa fa-fw fa-check-circle';
                break;
            case this.TYPE_INFO:
                iconClass = 'fa fa-fw fa-info-circle';
                break;
            case this.TYPE_WARNING:
                iconClass = 'fa fa-fw fa-exclamation-triangle';
                break;
            case this.TYPE_ERROR:
                iconClass = 'fa fa-fw fa-exclamation-circle';
                break;
        }
        // create icon object
        $("<i>", {
            class: iconClass
        }).appendTo($icon);
        // return icon object
        return $icon;
    },
    /**
     * This function hide and delete flash message.
     *
     * @param $fm
     */
    deleteMessage: function ($fm) {
        // check if this object still exists
        if (typeof $fm != "object") {
            return;
        }
        // hide message
        $fm.slideUp({
            duration: flashMessages.slideDuration,
            done: function () {
                // after animation remove message
                $fm.remove();
            }
        });
    },
    /**
     * This function create new flash message.
     *
     * @param message
     * @param type
     */
    newMessage: function (message, type) {
        // create flash message div
        var $fm = $("<div>", {
            class: "fm " + this.getType(type),
            click: function () {
                var $this = $(this);
                flashMessages.deleteMessage($this);
            }
        }).hide();
        // add icon
        var $icon = this.createIcon(type);
        $icon.appendTo($fm);
        // add message
        $("<div>", {
            class: "message",
            text: message
        }).appendTo($fm);
        // append new message to container
        $fm.appendTo(this.container);
        $fm.slideDown(flashMessages.slideDuration);
        // hide message after 5s
        setTimeout(function () {
            flashMessages.deleteMessage($fm);
        }, 5000);
    }
};

var translations = {
    init: function () {
        var html = $(".translations");
        html.each(function (index) {
            var $this = $(this);
            var message = $this.data().message;
            var translation = translations.get(message);
            $this.html(translation);
        });

        var placeholders = $(".translationsPlaceholder");
        placeholders.each(function (index) {
            var $this = $(this);
            var message = $this.data().message;
            var translation = translations.get(message);
            $this.attr('placeholder', translation);
        });

        var titles = $(".translationsTitle");
        titles.each(function (index) {
            var $this = $(this);
            var message = $this.data().message;
            var translation = translations.get(message);
            $this.attr('title', translation);
        });

    },
    /**
     * This function return translated phrase for
     *
     * @param messageName
     * @returns {string}
     */
    get: function (messageName) {
        if (!messageName) {
            return "";
        }

        return chrome.i18n.getMessage(messageName);
    }

};

function showTab(tabName) {
    $(".tab").slideUp(500);
    $("#tab_" + tabName).slideDown(500);
}

function nicerNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

function displayStreams() {
    var html = '';
    var online = '';
    var deleteList = '<ul>';
    for (var i = 0; i < streams.length; i++) {
        deleteList += '<li><a class="deleteStream" href="#" data-id="' + i + '">' + streams[i].name + '</a></li>';
    }
    deleteList += '</ul>';
    $("#delete_container").html(deleteList);
    $.each(streams, function (key, stream) {
        if (stream.data.online === false && settings.onlyOnline == 1) {
            return true;
        }

        if (stream.data.online === true) {
            online = 'online';
        } else {
            online = '';
        }
        html += '<div class="stream ' + online + '" data-url="' + stream.url + '"\
				<p><span class="stream_name">' + stream.name + '</span></p>\
				<p><i class="fa fa-users"></i> <span class="stream_viewers">' + nicerNumber(stream.data.viewers) + '</span></p>\
				</div>';
    });
    if (streams.length <= 0) {
        html = '<div class="noStreams">' + translations.get("noStreams_addNew") + '</div>';
    } else if (html.length < 10) {
        html = '<div class="noStreams">' + translations.get("noStreams_offline") + '</div>';
    }
    $("#tab_main").children(".container").html(html);
    $(".stream").click(function () {
        chrome.tabs.create({url: $(this).data("url")});
    });
    $(".deleteStream").click(function () {
        var streamId = $(this).data('id');
        deleteStream(streamId);
    });
    $(".loading").hide();
}

function refresh(timeout) {
    $(".loading").show();
    chrome.extension.getBackgroundPage().refresh();
    timeout = typeof timeout !== 'undefined' ? timeout : 0;
    setTimeout(displayStreams, timeout);
}

function addStream_twitch(name, url) {
    var startName = url.indexOf("twitch.tv/");
    startName += 10;
    platform_id = url.slice(startName);
    endName = platform_id.indexOf('?');
    if (endName > -1)
        platform_id = platform_id.slice(0, endName);
    if (platform_id.length > 0) {
        chrome.extension.getBackgroundPage().__addStream(name, url, "twitch", platform_id);
        flashMessages.newMessage(translations.get("flashMessage_streamAdded"), flashMessages.TYPE_SUCCESS);
    } else {
        flashMessages.newMessage(translations.get("flashMessage_error"), flashMessages.TYPE_ERROR);
    }
}

function addStream_hitbox(name, url) {
    var startName = url.indexOf("hitbox.tv/");
    startName += 10;
    platform_id = url.slice(startName);
    endName = platform_id.indexOf('?');
    if (endName > -1)
        platform_id = platform_id.slice(0, endName);
    if (platform_id.length > 0) {
        chrome.extension.getBackgroundPage().__addStream(name, url, "hitbox", platform_id);
        flashMessages.newMessage(translations.get("flashMessage_streamAdded"), flashMessages.TYPE_SUCCESS);
    } else {
        flashMessages.newMessage(translations.get("flashMessage_error"), flashMessages.TYPE_ERROR);
    }
}

function addStream() {
    $(".loading").show();
    var name = $("#addName").val();
    $("#addName").val('');
    var url = $("#addUrl").val();
    $("#addUrl").val('');

    if (url.indexOf("twitch.tv") > -1) {
        addStream_twitch(name, url);
    } else if (url.indexOf("hitbox.tv") > -1) {
        addStream_hitbox(name, url);
    } else if (url.indexOf("gaminglive.tv") > -1) {
        addStream_gaminglive(name, url);
    } else {
        flashMessages.newMessage(translations.get("flashMessage_unsupportedWebsite"), flashMessages.TYPE_WARNING);
    }

    refresh(2000);
    showTab("main");
}

function refreschFreq() {
    $(".freq").html($("#freq_slider").slider("value"));
}

function prepareButton(button, setting) {
    if (setting == 1) {
        button.prop('checked', true);
    } else {
        button.prop('checked', false);
    }
}

function saveSettings() {
    settings.notify = $("#options_notify").prop('checked') === true ? 1 : 0;
    settings.onlyOnline = $("#options_online").prop('checked') === true ? 1 : 0;
    settings.freq = $("#freq_slider").slider("value");
    chrome.extension.getBackgroundPage().saveSettings();
    flashMessages.newMessage(translations.get("flashMessage_settingsSaved"), flashMessages.TYPE_SUCCESS);
    refresh();
    showTab('main');
}

function deleteStream(id) {
    chrome.extension.getBackgroundPage().deleteStream(id);
    refresh();
    flashMessages.newMessage(translations.get("flashMessage_streamDeleted"), flashMessages.TYPE_SUCCESS);
}

$(document).ready(function () {
    translations.init();

    streams = chrome.extension.getBackgroundPage().streams;
    settings = chrome.extension.getBackgroundPage().settings;
    refresh();

    $(".sn_version").html(chrome.app.getDetails().version);
    $("#freq_slider").slider({
        max: 600,
        value: settings.freq,
        min: 30,
        step: 10,
        slide: refreschFreq,
        change: refreschFreq
    });
    $(".freq").html(settings.freq);
    $("#options_notify").prop('checked', settings.notify == 1);
    $("#options_online").prop('checked', settings.onlyOnline == 1);

    $(".button_info").click(function () {
        showTab("info");
    });
    $(".button_main").click(function () {
        showTab("main");
    });
    $(".button_add").click(function () {
        showTab("add");
        $("#addName").focus();
    });
    $(".button_refresh").click(function () {
        refresh(4000);
    });
    $(".button_submitAdd").click(function () {
        addStream();
    });
    $(".button_saveSettings").click(function () {
        saveSettings();
    });
    $(".button_options").click(function () {
        showTab("options");
    });
    $(".button_delete").click(function () {
        showTab("delete");
    });

});
