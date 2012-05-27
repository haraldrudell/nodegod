// godsocket.js
// socket layer for nodegod

// imports
var socketio = require('socket.io')

// exports
module.exports = {
	init: init,
}

var sessions = {}
var sessionId = 1

function init(app, clientToControl) {
	// http://socket.io
	var io = socketio.listen(app)
	io.set('log level', 0)

	io.sockets.on('connection', function (socket) {
		// publish session to outside world
		var session = {
			id: sessionId++,
			socket: socket,
		}
		sessions[session.id] = session

		// receive socket requests from client
		socket.on('togod', function (data) {
			// data is a request from a client
			console.log('request:', data)
			// true: success!
			// false: no reply
			// undefined: error
			var result = clientToControl(data)
			if (result === undefined) {
				result = { type: 'bad'}
			}
			if (result !== false) {
				console.log('send:' + JSON.stringify(result))
				socket.emit('fromgod', result)
			}
		})
	})
	return send
}

function send(update) {
	for (var id in sessions) {
		var session = sessions[id]
		console.log('update:', JSON.stringify(update))
		session.socket.emit('fromgod', update)
	}
}