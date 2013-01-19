// rotatedlogger.js
// Configurable string logging to stdout and a rotated file
// © Harald Rudell 2013 MIT License

var rotatedstream = require('./rotatedstream')
var cloner = require('./cloner')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/events.html
var events = require('events')

exports.RotatedLog = RotatedLog

/*
Provide logging to process.stdout.write and a rotated file
emits error
*/
function RotatedLog(opts) {
	var self = this
	events.EventEmitter.call(this)
	this.configure = configure
	this.write = write
	this.end = end
	this.log = log
	this.close = close
	var streamOpts
	// write function state flags
	var writeToStdoutEnabled = true
	var writeStream
	if (opts) configure(opts)

	/*
	Configure rotatedlogger
	opts: optional object
	.streamOpts: optional object: options for RotatedStream
	.stdout: optional boolean, default true
	*/
	function configure(opts) {
		if (!opts) opts = {}
		var result = {
			filename: writeStream ? writeStream.filename : null,
			stdout: writeToStdoutEnabled,
			file: !!writeStream,
			streamOpts: cloner.clone(streamOpts)
		}
		if (opts) {
			if (opts.stdout != null) writeToStdoutEnabled = opts.stdout
			if (opts.streamOpts) streamOpts = opts.streamOpts
			if (opts.file != null) {
				if (opts.file) {
					if (!writeStream) writeStream = new rotatedstream.RotatedStream(streamOpts)
						.once('error', streamErrorListener)
				} else if (writeStream) close()
			}
		}

		return result
	}

	// logging with format feature and added newlines: like console.log
	function log() {
		write(util.format.apply(this, Array.prototype.slice.call(arguments)) + '\n')
	}

	function end() {
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
		write(util.format.apply(this, Array.prototype.slice.call(arguments)) + '\n', doClose)

		function doClose() {
			close.apply(self, cb)
		}
	}

	// logging of utf-8 string
	function write(s) {
		var err
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
		var cbCounter = 1
		if (writeToStdoutEnabled) {
			cbCounter++
			process.stdout.write(s, stdWr)
		}
		if (writeStream) {
			cbCounter++
			writeStream.write(s, wRes)
		}
		end()

		function stdWr(e) {
			if (e) {
				if (!err) err = e
				writeToStdoutEnabled = false
				write('stdout error: ' + e.message)
				self.emit('error', e)
			}
			end()
		}

		function wRes(e) {
			if (e) {
				if (!err) err = e
				writeStream = false
				write('stream error: ' + e.message)
				self.emit('error', e)
			}
			end()
		}

		function end() {
			if (!--cbCounter)
				if (cb)
					if (err) cb(err)
					else cb()
		}
	}

	function close(cb) {
		if (writeStream) {
			var v = writeStream
			writeStream = null
			v.close(isClosed)
		}

		function isClosed(err) {
			v = null
			if (!err) {
				if (cb) cb()
			} else {
				self.emit('error', err)
				cb(err)
			}
		}
	}

	function streamErrorListener(err) {
		writeToFileEnabled = false
		writeStream = null
		write('stream error:' + err.message)
		self.emit('error', err)
	}
}
util.inherits(RotatedLog, events.EventEmitter)