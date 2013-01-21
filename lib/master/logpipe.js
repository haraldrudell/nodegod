// logpipe.js
// Create a log object connected to the log process
// © Harald Rudell 2013 MIT License

var streamcopier = require('../streamcopier')
var childipc = require('../childipc')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

exports.LogPipe = LogPipe

var time3s = 3e3
var waitMessage = time3s
var spawnOptions = {
	stdio: ['pipe', 1, 2, 'ipc'],
}

function LogPipe(processName, spawn) {
	var self = this
	streamcopier.StreamCopier.call(this)
	this.connectPipe = connectPipe
	var log = this.setPrepend(processName).pLog

	// stream to parent
	var childIpc = new childipc.ChildIpc()
	if (childIpc.writable) this.addStream(childIpc, 'parent pipe')
	else {
		childIpc.destroy()
		childIpc = null
	}

	function connectPipe(cb) { // spawn and connect to log process
		var child
		var timer
		var didCb
		try {
			var child = child_process.spawn(spawn.file, spawn.args, spawnOptions)
		} catch (err) {
			cb(err)
		}
		if (child) {
			child.once('exit', childExitListener)
				.once('error', childErrorListener)
			if (!child.send) throw new Error('ipc not available try node 0.8.9 or later')
			child.once('message', childReady)
			timer = setTimeout(messageTimeout, waitMessage)

			var emit = child.emit
			child.emit = function (e, f) {
				console.log('ChildEmit', Array.prototype.slice.call(arguments))
				emit.apply(child, Array.prototype.slice.call(arguments))
			}
		}

		function childReady() {
			if (timer) {
				var t = timer
				timer = null
				clearTimeout(t)
			}
			pipeIndex = self.addStream(child.stdin, 'pipe:' + child.pid)
			if (!didCb) {
				didCb = true
				cb(null, child.pid)
			}
		}

		function messageTimeout() {
			timer = null
			var e = new Error('Timeout on child launch: ' + child.pid)
			log(e.message)
			didCb = true
			cb(e)
		}

		function childExitListener(exitCode) {
			child = null
			if (pipeIndex != null) {
				self.removeStream(pipeIndex)
				pipeIndex = null
			}
			log('Logging process died: ' + exitCode)
		}

		function childErrorListener(err) {
			if (pipeIndex != null) {
				self.removeStream(pipeIndex)
				pipeIndex = null
			}
			log('Child error: ', err, err.stack)
		}
	}
}
util.inherits(LogPipe, streamcopier.StreamCopier)
