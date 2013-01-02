// pidgetter.js
// Fetch a pid using a tcp socket
// © Harald Rudell 2013

// http://nodejs.org/api/net.html
var net = require('net')

exports.getPidFromPort = getPidFromPort
exports.getSocketMap = getSocketMap

var socketTimeout = 1e3
/*
Fetch a pid using a tcp socket
opts: object
.port number port
.host optional string hostname
.timeout optional number ms socket timeout
cb(err, result) function, result: number on success
*/
var socketMap = {}
var socketId = 0
function getPidFromPort(opts, cb) {
	if (!opts) opts = {}
	var didCb
	var id = socketId++

	socketMap[id] = cleanup
	var args = [opts.port]
	if (opts.host) args.push(opts.host)
	args.push(connectionListener)
	var socket = net.connect.apply(this, args)
		.once('timeout', timeoutListener)
		.on('data', dataListener)
		.once('close', cleanup)
		.on('error', errorListener)
	socket.setTimeout(opts.timeout != null ? opts.timeout : socketTimeout)
	socket.setEncoding('utf-8')

	function connectionListener() {
		socket.end(String(process.pid)) // string or buffer
	}
	function dataListener(pidString) {
		var result
		var err
		var pid

		if (!isNaN(pid = Number(pidString))) result = pid
		else err = new Error('Master response corrupt')
		end(err, result)
	}
	function errorListener(e) {
		socket.destroy() // disconnect immediately, will get close
		end(e)
	}
	function timeoutListener() {
		socket.destroy() // disconnect immediately, will get close
		end(new Error('Master process not reponding'))
	}
	function end(err, pid) {
		if (!didCb) {
			didCb = true
			if (err) cb(err)
			else cb(err, pid)
		}
	}

	function cleanup(f) {
		delete socketMap[id]
		socket.destroy()
		socket.removeListener('timeout', timeoutListener)
		socket.removeListener('data', dataListener)
		socket.removeListener('close', cleanup)
		socket = null
		if (typeof f == 'function') f()
	}
}
function getSocketMap() {
	var result = {}
	for (var id in socketMap) result[id] = socketMap[id]
	return result
}