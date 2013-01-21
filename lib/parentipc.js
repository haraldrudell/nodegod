// parentipc.js
// Read the ipc from a child process
// © Harald Rudell 2013 <harald@therudells.com>  MIT License

// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/stream.html
var stream = require('stream')

exports.ParentIpc = ParentIpc

function ParentIpc(child) {
	var self = this
	stream.Stream.call(this)
	this.readable
	this.pause = pause
	this.resume = resume
	this.destroy = destroy
	var paused = true
	var buffer = []
	var childRemoveListener
	var childDisconnect
	var isConnected

	if (child.send) {
		child.once('disconnect', childDisconnectListener)
		child.on('message', childMessageListener)
		childDisconnect = child.disconnect.bind(child)
		childRemoveListener = child.removeListener.bind(child)
		isConnected = true
		this.readable = true
	}
	child = null

	function pause() {
		paused = true
	}
	function resume() {
		paused = false
		if (self.readable) emitBuffer()
	}
	function destroy(cb) {
		if (self.readable) {
			self.readable = false
			removeListeners()
			buffer = null
			self.emit('end')
		}
		if (cb) cb()
	}

	function emitBuffer() {
		while (self.readable && buffer.length) emitData(buffer.shift())
		if (self.readable && !isConnected) destroy()
	}
	function emitData(args) {
		self.emit('data', args[0]) // json object
		if (args[1] !== undefined) self.emit('handle', args[1])
	}
	function childDisconnectListener() {
		childDisconnect = null
		removeListeners(true)
		if (!buffer.length) destroy()
	}
	function removeListeners(skipDisconnect) {
		if (isConnected) {
			isConnected = false
			if (!skipDisconnect) {
				childRemoveListener('disconnect', childDisconnectListener)
				childDisconnect()
				childDisconnect = null
			}
			childRemoveListener('message', childMessageListener)
			childRemoveListener = null
		}
	}
	function childMessageListener(data) {
		if (self.readable) {
			var args = Array.prototype.slice.call(arguments)
			if (paused) buffer.push([args])
			else emitData(args)
		}
	}
}
util.inherits(ParentIpc, stream.Stream)
