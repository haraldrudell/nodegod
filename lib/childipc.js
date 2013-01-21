// childipc.js
// Write ipc to a child process
// © Harald Rudell 2013 <harald@therudells.com> MIT License

// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/stream.html
var stream = require('stream')

exports.ChildIpc = ChildIpc

/*
ipc write stream for child
if this.writable ipc is available
will emit drain, close and errors
final event is close or error
*/
function ChildIpc() {
	var self = this
	stream.Stream.call(this)
	this.writable
	this.write = write
	this.end = end
	this.destroy = destroy
	var didEmitError
	var isConnected

	if (process.send) { // process.once does not return process...
		process.on('error', processErrorListener)
			.once('disconnect', processDisconnectListener)
		isConnected = true
		this.writable = true
	}

	// write(message, handle, cb)
	function write(message, handle) {
		var result = false
		var err
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
		if (args.length > 1 && typeof handle === 'string') err = new Error('write handle argument cannot be string')
		else if (!self.writable) err = new Error('ipc not available')
		else {
			try {
				result = process.send.apply(process, args)
			} catch (e) {
				err = e
			}
			if (!err) self.emit('drain')
		}
		if (err) internalDestroy(cb, [err])
		else if (cb) {
			var cbArgs = []
			if (err) cbArgs.push(err)
			cb.apply(this, cbArgs)
		}
		return result
	}

	// end(message, handle, cb)
	function end() {
		var err
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
		if (self.writable && args.length) write.apply(this, args.concat(afterWrite))
		else afterWrite()

		function afterWrite(e) {
			if (e) err = e
			destroy(afterDestroy)
		}

		function afterDestroy(e) {
			if (e && !err) err = e
			if (cb) {
				var cbArgs = []
				if (err) cbArgs.push(err)
				cb.apply(this, cbArgs)
			}
		}
	}

	function destroy(cb) {
		internalDestroy(cb)
	}

	/*
	cb(err) optional funciton
	args: array of values, first may be instanceof Error
	*/
	function internalDestroy(cb, args) {
		var isError = Array.isArray(args) && args[0] instanceof Error
		if (self.writable) {
			self.writable = false
			if (isConnected) {
				isConnected = false
				process.disconnect()
				process.removeListener('disconnect', processDisconnectListener)
			}
			process.removeListener('error', processErrorListener)
			if (!isError) self.emit('close')
		}
		if (isError) self.emit.apply(self, ['error'].concat(args))
		if (cb) {
			var cbArgs = []
			if (isError) cbArgs.push(args[0])
			cb.apply(this, cbArgs)
		}
	}

	function processDisconnectListener() {
		isConnected = false
		internalDestroy()
	}
	function processErrorListener() {
		var args = Array.prototype.slice.call(arguments)
		if (!(args[0] instanceof Error)) args.unshift(new Error('process error'))
		internalDestroy(null, args)
	}
}
util.inherits(ChildIpc, stream.Stream)
