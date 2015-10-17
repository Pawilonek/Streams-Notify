var streams = null;

function flashMessage(message, type){
	$("#flash_message").removeClass();
	switch(type){
		case 'success':
			$("#flash_message").addClass('fm_success');
			$("#fm_icon").html('<i class="fa fa-check-circle"></i>');
			break;
		case 'info':
			$("#flash_message").addClass('fm_info');
			$("#fm_icon").html('<i class="fa fa-info-circle"></i>');
			break;
		case 'warning':
			$("#flash_message").addClass('fm_warning');
			$("#fm_icon").html('<i class="fa fa-exclamation-triangle"></i>');
			break;
		case 'error':
			$("#flash_message").addClass('fm_error');
			$("#fm_icon").html('<i class="fa fa-exclamation-circle"></i>');
			break;
		default:
			$("#flash_message").addClass('fm_notification');
			$("#fm_icon").html('<i class="fa fa-paperclip"></i>');
			break;
	}
	$("#fm_message").html(message);
	$("#flash_message").fadeIn().delay(5000).fadeOut();
}

function showTab(tabName) {
	$(".tab").hide();
	$("#tab_"+tabName).fadeIn();
}

function nicerNumber(num){
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

function displayStreams(){
	var html = '';
	var online = '';
	$.each(streams, function(key, stream){
		if(stream.data.online === false && settings.onlyOnline == 1){
			return true;
		}
	
		if(stream.data.online === true){
			online = 'online';
		} else {
			online = '';
		}
		html += '<div class="stream '+online+'" data-url="'+stream.url+'"\
				<p><span class="stream_name">'+stream.name+'</span></p>\
				<p><i class="fa fa-users"></i> <span class="stream_viewers">'+nicerNumber(stream.data.viewers)+'</span></p>\
				</div>';
	});
	$("#tab_main").children(".container").html(html);
	$(".stream").click(function(){
		chrome.tabs.create({ url: $(this).data("url") });
	});
	$(".loading").hide();
}

function refresh(timeout){
	$(".loading").show();
	chrome.extension.getBackgroundPage().refresh();
	timeout = typeof timeout !== 'undefined' ? timeout : 0;
	setTimeout(displayStreams, timeout);
}

function addStream_twitch(name, url){
	var startName = url.indexOf("twitch.tv/");
	startName += 10;
	platform_id = url.slice(startName);
	endName = platform_id.indexOf('?');
	if(endName > -1)
		platform_id = platform_id.slice(0, endName);
	if(platform_id.length > 0){
		chrome.extension.getBackgroundPage().__addStream(name, url, "twitch", platform_id);
		flashMessage("Stream został dodany.", "success");
	} else {
		flashMessage("Wystąpił błąd.", "error");
	}
}

function addStream_hitbox(name, url){
	var startName = url.indexOf("hitbox.tv/");
	startName += 10;
	platform_id = url.slice(startName);
	endName = platform_id.indexOf('?');
	if(endName > -1)
		platform_id = platform_id.slice(0, endName);
	if(platform_id.length > 0){
		chrome.extension.getBackgroundPage().__addStream(name, url, "hitbox", platform_id);
		flashMessage("Stream został dodany.", "success");
	} else {
		flashMessage("Wystąpił błąd.", "error");
	}
}

function addStream(){
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
		flashMessage("Podana strona nie jest obsługiwana.", "warning");
	}
	
	refresh(2000);
	showTab("main");
}

function refreschFreq(){
	$(".freq").html( $("#freq_slider").slider("value") );
}

function prepareButton(button, setting){
	if(setting == 1){
		button.prop('checked', true);
	} else {
		button.prop('checked', false);
	}	
}

function saveSettings(){
	settings.notify = $("#options_notify").prop('checked') === true ? 1 : 0;
	settings.onlyOnline = $("#options_online").prop('checked') === true ? 1 : 0;
	settings.freq = $("#freq_slider").slider("value");
	chrome.extension.getBackgroundPage().saveSettings();
	flashMessage('Ustawienia zostały zapisane.', 'success');
	refresh();
	showTab('main');
}

$( document ).ready(function() {
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
	$(".freq").html( settings.freq );
	$("#options_notify").prop('checked', settings.notify == 1 ? true : false);
	$("#options_online").prop('checked', settings.onlyOnline == 1 ? true : false);

	$(".button_info").click( function(){
		showTab("info");
	});
	$(".button_main").click( function(){
		showTab("main");
	});
	$(".button_add").click( function(){
		showTab("add");
		$("#addName").focus();
	});
	$(".button_refresh").click( function(){
		refresh(4000);
	});
	$(".button_submitAdd").click( function(){
		addStream();
	});
	$(".button_saveSettings").click( function(){
		saveSettings();
	});
	$(".button_options").click( function(){
		showTab("options");
	});

});
