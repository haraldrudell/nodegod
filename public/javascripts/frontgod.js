// frontgod.js

if (typeof NODEGOD == 'undefined') NODEGOD = {}

if (typeof $ == 'undefined') alert ('jQuery is missing')
else $(function() {

	messageToServer({ type: 'getApps'})

	function messageToServer(data) {
		if (!connected) {
			$('#status').text('Connecting to server')
			socketConnect(messageFromServer, afterConnect)
		} else afterConnect()

		function afterConnect(err) {
			if (err) {
				$('#status').text(err.message)
			} else {
				$('#status').text('Sending to server')
				socketSend(data)
			}
		}

	}

	function messageFromServer(data) {
		var string

		switch(data.type) {
		case 'auth':
			string = data.value === true ? 'Logged in' : data.value
			break
		case 'apps':
			string = 'Got apps:' + data.apps
			break
		default:
			string = 'Bad type from server:' + data.type
		}
		$('#status').text(string)
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