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

	// logging of utf-8 string
	function write(str, cb) {
		if (writeToStdoutEnabled) {
			try {
				process.stdout.write(str)
			} catch (e) {
				writeToStdoutEnabled = false
				write('stdout error: ' + e.message)
				self.emit('error', e)
			}
		}

		if (writeStream) writeStream.write(str, cb)
		else if (cb) cb()
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