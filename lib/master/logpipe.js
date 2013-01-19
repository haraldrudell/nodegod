// logpipe.js
// Create a log object connected to the log process
// © Harald Rudell 2013 MIT License

var streamcopier = require('../streamcopier')

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

function LogPipe(processName, launchArray) {
	var self = this
	streamcopier.StreamCopier.call(this)
	self.connectPipe = connectPipe
	var log = self.pLog
	var pipeIndex

	self.on('warning', copierWarningListener)
		.on('error', copierErrorListener)
		.setPrepend(processName)
	self.addStream(process.stdout, 'stdout')

	function connectPipe(cb) {
		var child
		var timer
		var didCb
		try {
			var child = child_process.spawn(launchArray[0], launchArray.slice(1), spawnOptions)
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

	function copierWarningListener() {
		console.log(arguments.callee.name, Array.prototype.slice.call(arguments))
	}

	function copierErrorListener() {
		console.log(arguments.callee.name, Array.prototype.slice.call(arguments))
	}
}
util.inherits(LogPipe, streamcopier.StreamCopier)
