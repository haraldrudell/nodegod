// godsocket.js
// Manage and authenticate socket connections
// © Harald Rudell 2011 MIT License

// https://github.com/LearnBoost/socket.io
var socketio = require('socket.io')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.GodSocket = GodSocket

/*
options: object
.app: express 2 server
.log: optional function: logging default.console.log

emits data json-object: for authenticated sockets
*/
function GodSocket(opts) {
	var self = this
	events.EventEmitter.call(this)
	this.send = send
	var socketManager = socketio.listen(opts.app)
	var log = opts.log || console.log

	socketManager.set('log level', 0)
	socketManager.sockets.on('connection', newConnection)
	opts = null

	function newConnection(socket) {
		var actionsAreAllowed = getWriteAllowed(socket)

		socket.on('togod', receiveAction)
			//.on('disconnect', 'reason')
			.on('error', socketErrorListener)

		function receiveAction(data) {
			if (actionsAreAllowed) self.emit('data', data, socketSend)
			else {
				log('Denined request:', data)
				socketSend({error: 'denied'})
			}
		}
		function socketErrorListener(etext) {
			log('socket error:', etext)
		}
		function socketSend(data) {
			socket.emit('fromgod', data)
		}
	}

	function send(update) {
		socketManager.sockets.emit('fromgod', update) // emit has no callback
	}

	function getWriteAllowed(socket) {
		// determine if writing is allowed for this socket
		// ie. from localhost
		var ip
		var sockid = socket.id
		if (sockid) {
			var hand = socket.manager && socket.manager.handshaken &&
				socket.manager.handshaken
			if (hand && hand[sockid] && hand[sockid].address) ip = hand[sockid].address.address
			log('Connecting ip:', ip)
		}
		return ip === '127.0.0.1'
	}
}
util.inherits(GodSocket, events.EventEmitter)
