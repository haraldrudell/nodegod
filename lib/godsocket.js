// godsocket.js
// socket layer for nodegod

// imports
var socketio = require('socket.io')

// exports
module.exports = {
	init: init,
}

//var sessions = {}

function init(app, clientToControl) {
	// http://socket.io
	var socketManager = socketio.listen(app)
	socketManager.set('log level', 0)

	socketManager.sockets.on('connection', function (socket) {

		// determine if writing is allowed for this socket
		// ie. from localhost
		var ip
		var sockid = socket.id
		if (sockid) {
			var hand = socket.manager && socket.manager.handshaken &&
				socket.manager.handshaken
			if (hand && hand[sockid] && hand[sockid].address) ip = hand[sockid].address.address
			console.log('Connecting ip:', ip)
		}
		allowWrite = ip == '127.0.0.1'

		// publish session to outside world
		/*var session = {
			id: sockid,
			socket: socket,
		}
		sessions[session.id] = session*/

		// receive socket requests from client
		socket.on('togod', function (data) {
			// data is a request from a client
			console.log('request:', data)
			if (!allowWrite) {
				result = { type: 'denied' }
			} else {
				// true: success!
				// false: no reply
				// undefined: error
				var result = clientToControl(data)
				if (result === undefined) {
					result = { type: 'bad'}
				}
			}
			if (result !== false) {
				console.log('send:' + JSON.stringify(result))
				socket.emit('fromgod', result)
			}
		})
		socket.on('disconnect', function (reason) {
			//delete sessions[sockid]
		})
		socket.on('error', function (etext) {
			console.log('socket error:', etext)
		})
	})
	return send

	function send(update) {
		console.log('update:', JSON.stringify(update))
		socketManager.sockets.emit('fromgod', update)
	}
}