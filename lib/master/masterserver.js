// masterserver.js
// Provide interprocess communication via tcp socket
// © Harald Rudell 2013

// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/net.html
var net = require('net')

exports.getServerMap = getServerMap
exports.MasterServer = MasterServer

/*
nodegod Master process server
port: number

'connect': server successfully listening. will emit 'end'
'error'
'fail': the port is busy, final event
'end': the server stopped servicing events, final event
'data': data someone sent something
.isUp() boolean: the server is accepting requests

Server createServer(options, connectionListener)
'listening'
'error' err.code == EADDRINUSE
'connection' Socket
'close'
note: if you get error, you don't get close
*/
var serverMap = {}
var serverId = 0
function MasterServer(port, interface) {
	var self = this
	var listeningFired
	var needClose
	var id = serverId++

	events.EventEmitter.call(this)
	this.shutdown = shutdown
	this.isUp = isUp

	var server = serverMap[id] = net.createServer(handleConnection)
		.on('error', errorListener)
		.once('close', closeListener)

	var listenArgs = [port]
	if (interface) listenArgs.push(interface)
	listenArgs.push(listeningListener)
	server.listen.apply(server, listenArgs)

	function listeningListener() {
		listeningFired = needClose = true
		self.emit('connect')
	}
	function closeListener() {
		cleanup()
		if (listeningFired) self.emit('end')
	}
	function errorListener(err) {
		needClose = false
		cleanup()
		if (!listeningFired && err.code == 'EADDRINUSE') self.emit('fail')
		else self.emit('error', err)
	}

	function shutdown(f) {
		if (needClose) {
			needClose = false
			server.close(f)
		} else if (f) f()
	}
	function isUp() {
		return needClose
	}

	function cleanup(f) {
		delete serverMap[id]
		server.removeListener('error', errorListener)
		server.removeListener('close', closeListener)
		if (needClose) server.close(f)
		else if (f) f()
	}

	// manage a connection, reponding to requests
	function handleConnection(socket) { // server 'connect'
		socket.setEncoding('utf-8')
		socket.on('data', requestResponder)

		function requestResponder(data) {
			socket.end(String(process.pid))
			self.emit('data', data)
		}
	}
}
util.inherits(MasterServer, events.EventEmitter)

function getServerMap() {
	var result = {}
	for (var id in serverMap) result[id] = serverMap[id]
	return result
}