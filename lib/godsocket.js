// godsocket.js
// socket layer for nodegod

// imports
var socketio = require('socket.io')
var nodereq = require('./nodereq')

// exports
module.exports = listen

function listen(app) {
	// http://socket.io
	var io = socketio.listen(app)
	io.set('log level', 0)

	io.sockets.on('connection', function (socket) {
		var session = {}
		socket.on('togod', function (data) {
			var result
/*			if (data.auth) {
				var outcome = cloudservice.authenticate(data)
				session.authenticated = outcome === true
				result = { type: 'auth', value: outcome }
			} else if (!session.authenticated) {
				result = { type: 'auth', value: 'Please log in with Facebook' }
			} else {*/
				// we are authenticated, do something
				result = { type: 'apps', apps: nodereq.getApps() }
			//}
			socket.emit('fromgod', result)
		})
	})
}
