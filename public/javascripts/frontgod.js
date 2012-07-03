// frontgod.js

if (typeof NODEGOD == 'undefined') NODEGOD = {}
if (typeof io == 'undefined') alert ('socket.io is missing')
if (typeof $ == 'undefined') alert ('jQuery is missing')

// on parsing
// socket client with in-page status update
;
(function () {

	// on page loaded
	$(function() {

		// click on any of the action buttons
		$('.control').click(function() {

			// find action word
			var action = this.className.match(/\bdo([^ $]+)/)
			var app
			if (action) {
				var app = $(this).closest('div').attr('id')
				if (app) app = app.substring(3)
			} else {
				action = this.className.match(/\b(reload)($|\s)/)
				if (action) app = true
			}

			if (action && app) socketSend({ type: action[1], app: app})
		})

		// click on reconnect, a button enabled when we are not connected
		$('.reconnect').click(function() {
			reconnect()
		})

		updateState() // state when page is loaded

	})

	function messageFromServer(data) {
		var string

		if (!data || !data.type) {
			var text = JSON.stringify(data)
			alert('corrupt comms:' + text)
		} else {
			switch(data.type) {
			case 'denied':
				string = 'Read-Only Mode'
				break
			case 'auth':
				string = data.value === true ? 'Logged in' : data.value
				break
			case 'apps':
				string = 'Got apps:' + data.apps
				break
			case 'app':
				string = 'Update to ' + data.app.name
				updateCreateApp(data.app)
				break
			case 'ok':
				string = 'ok'
				break
			default:
				string = 'Bad type from server:' + JSON.stringify(data.type)
			}
			$('#status').text(string + ' at ' + dateString(Date.now()))
		}
	}

	function updateCreateApp(app) {
		var div = $('#app' + app.id)
		if (!div) $('#status').text('Unknown app:' + app.id)
		else {
			// get enable pattern for buttons
			var state = app.state || 'stop'
			var map = actionMap[state]
			if (map) {
				div.find('.control').each(function(index, el) {
					var buttonAction = el.className.match(/\bdo([^ $]+)/)
					if (buttonAction) {
						buttonAction = buttonAction[0]
						if (map[buttonAction]) $(el).show('slow')
						else $(el).hide('slow')
					}
				})
			}
			div.find('.pid').text(app.pid)
			div.find('.state').text(app.state)
			div.find('.watchers').text(app.watchers)
			div.find('.upsince').text(dateString(app.lastLaunch))
			div.find('.lastcrash').text(dateString(app.lastCrash))
			div.find('.crashes').text(app.crashCount || 0)
			div.find('.exit').text(app.exitCode != null ? app.exitCode : '?')
		}
	}

	var timezoneMinutesOffUtc = -new Date().getTimezoneOffset()
	function dateString(value) {
		var result = '?'
		if (typeof value == 'number') {
			var str = new Date(value + timezoneMinutesOffUtc * 60000).toISOString()
			var hms = str.substring(11, 19)
			var date = str.substring(0, 10)
			if (timezoneMinutesOffUtc) {
				var absoluteValue = Math.abs(timezoneMinutesOffUtc)
				hms += (timezoneMinutesOffUtc < 0 ? '-' : '+') + getTwoDigits(absoluteValue / 60)
				var minutes = absoluteValue % 60
				if (minutes) hms += getTwoDigits(minutes)
			} else {
				hms += 'Z'
			}
			var result = hms + ' on ' + date
		}
		return result
	}
	function getTwoDigits(number) {
		var result = number.toString()
		if (result.length < 2) {
				result = '0' + result
		}
		return result
	}
	var actions = [ 'dodebug', 'donodebug', 'dostart', 'dorestart', 'dostop']
	var actionMap = {
		'run': {
			dodebug: true,
			donodebug: false,
			dorun: false,
			dorestart: true,
			dostop: true,
		},
		'stop': {
			dodebug: true,
			donodebug: false,
			dorun: true,
			dorestart: false,
			dostop: false,			
		},
		'debug': {
			dodebug: false,
			donodebug: true,
			dorun: false,
			dorestart: true,
			dostop: true,			
		},
	}

	NODEGOD.socketSend = socketSend

	function socketSend(data) {
		socket.emit('togod', data)
	}

	var texts = {
		0: 'Disconnected',
		1: 'Connecting',
		2: 'Connected',
		3: 'Rejected',
	}
	var socket = io.connect()
	socket.on('connect', function () {
		updateState(2)
	})
	socket.on('connect_failed', function (reason) {
		updateState(3)
	})
	socket.on('fromgod', function (data) {
		messageFromServer(data)
	})
	socket.on('disconnect', function (reason) {
		updateState(1)
	})
	socket.on('error', function (error) {
		console.log('websocket error:' + error)
	})
	function getState(newState) {
		var result = socket.aState || 0
		if (typeof newState == 'number' && newState >= 0) socket.aState = newState
		return result
	}
	function reconnect() {
		socket.socket.reconnect()
	}
	function updateState(newState) {
		var lastState = getState(newState)
		if (lastState != newState) {
			if (typeof newState != 'number') newState = lastState
			reconnectEnable(newState != 2)
			//$('.connected').text()
			$('#status').text(texts[newState] + ' at ' + dateString(Date.now()))
		}
	}
	function reconnectEnable(flag) {
		var e = $('.reconnect')
		if (flag) e.removeAttr('disabled')
		else e.attr('disabled', 'disabled')
	}
})()