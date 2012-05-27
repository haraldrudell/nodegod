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
			console.log(data)
			var result = { type: 'bad'}
/*			if (data.auth) {
				var outcome = cloudservice.authenticate(data)
				session.authenticated = outcome === true
				result = { type: 'auth', value: outcome }
			} else if (!session.authenticated) {
				result = { type: 'auth', value: 'Please log in with Facebook' }
			} else {*/
			var x = clientToControl(data)
			if (x) result = x
			console.log('send:'+JSON.stringify(result))
			socket.emit('fromgod', result)
		})
	})
	return send
}

function send(data) {
	for (var id in sessions) {
		var session = sessions[id]
		session.socket.emit('fromgod', data)
	}
}