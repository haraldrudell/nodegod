// frontgod.js

if (typeof NODEGOD == 'undefined') NODEGOD = {}

if (typeof $ == 'undefined') alert ('jQuery is missing')
else $(function() {
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

		if (action && app) messageToServer({ type: action[1], app: app})
	})

	connect()

	function messageToServer(data) {
		if (!connected) connect(afterConnect)
		else afterConnect()

		function afterConnect() {
			$('#status').text('Sending to server')
			socketSend(data)
		}
	}

	function connect(cb) {
		$('#status').text('Connecting to server')
		socketConnect(messageFromServer, noConnection)

		function noConnection(err) {
			if (err) {
				var s = 'No connection'
				if (err) s+= ': ' + err.message
				$('#status').text(s)
			} else {
				if (cb) cb()
				else {
					$('#status').text('Connected')
				}
			}
		}

		function messageFromServer(data) {
			var string

			if (!data || !data.type) {
				var text = JSON.stringify(data)
				alert('corrupt comms:' + text)
			} else {
				switch(data.type) {
				case 'auth':
					string = data.value === true ? 'Logged in' : data.value
					break
				case 'apps':
					string = 'Got apps:' + data.apps
					break
				case 'app':
					updateCreateApp(data.app)
					break
				case 'ok':
					string = 'ok'
					break
				default:
					string = 'Bad type from server:' + JSON.stringify(data.type)
				}
				$('#status').text(string)
			}
		}
	}

	function updateCreateApp(app) {
		console.log('updating:' + app.id)
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
			div.find('.id').text(app.id)
			div.find('.state').text(app.state)
			div.find('.watchers').text(app.watchers)
			div.find('.upsince').text(app.lastLaunch ? new Date(app.lastLaunch) : '?')
			div.find('.lastcrash').text(app.lastCrash ? new Date(app.lastCrash): '?')
			div.find('.crashes').text(app.crashCount || 0)
			div.find('.exit').text(app.exitCode != null ? app.exitCode : '?')
		}
	}

	NODEGOD.socketSend = socketSend
	var socket
	var connected

	// ensure connected, then callback
	function socketConnect(rxFunc, callback) {

		// if we are already connected, return
		if (connected) callback()

		// make sure socket.io javascript is loaded
		else if (typeof io == 'undefined') {
			var e = 'socket io not loaded'
			alert(e)
			callback(Error(e))
		} else {

			// connect the socket
			socket = io.connect()
			socket.on('connect_failed', function () {
				callback(Error('connect_failed'))
			})
			socket.on('connect', function () {
				connected = true
				callback()
			})
			socket.on('fromgod', rxFunc)
		}
	}

	function socketSend(data) {
		socket.emit('togod', data)
	}

})