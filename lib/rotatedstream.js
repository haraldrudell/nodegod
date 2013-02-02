// rotatedstream.js
// Tee output to a log that is rotated
// © Harald Rudell 2013 MIT License

var perioder = require('./perioder')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/events.html
var events = require('events')

exports.RotatedStream = RotatedStream

var time2s = 2e3

var rotateAttemptWait = time2s
var maxRetry = 10
var defaults = {
	flags: { // options for fs.createWriteStream
		flags: 'a',
		encoding: 'utf-8',
		mode: 0660, // rw- rw- ---
	},
	logFile: 'applog', // default log file basename
	logSubfolder: 'log', // subfolder searched for in user's home folder, null to use path of logFile
	logFileExt: '.log',
	logSize: 1024 * 1024, // number max size of log file
	rotating: {
		schedule: 'month',
		at: 0,
		every: 1,
	},
}

/*
Write to a rotated file
opts: optional object
.flags: optional object: options for fs.createWriteStream
.logFile: optional string default log file path and filename
.logSubfolder: optional string subfolder searched for in user's home folder, '' to disable
.logFileExt: optional string default '.log',
.logSize: optional number max size of log file default 1M characters
.rotating: optional object for perioder

emits error
*/
function RotatedStream(opts) {
	if (!opts) opts = {}
	var self = this
	events.EventEmitter.call(this)
	this.writable
	this.filename = getFilename()
	this.write = write
	this.rotate = rotate
	this.close = close
	var stream
	var didWrite
	var periodTimer
	var buffer
	var maxBytesWritten
	var rotating

	var e = openStream()
	if (!e) {
		this.writable = true
		periodTimer = new perioder.TimeEmitter(opts.rotating || defaults.rotating)
			.on('time', rotateTimer)
	} else process.nextTick(function () {
			emitError(e)
		})

	function openStream() {
		var err
		try {
			stream = fs.createWriteStream(self.filename, opts.flags || defaults.flags)
				.once('error', emitError)
			if ((maxBytesWritten = opts.logSize || defaults.logSize) != null) stream.once('open', checkSize)
		} catch (e) {
			err = e
		}
		return err
	}

	function write(str) {
		var didCb
		var args = Array.prototype.slice.call(arguments)
		if (!self.writable) emitError('Stream unavailable')
		else {
			didWrite = true
			if (buffer) buffer.push(str)
			else {
				didCb = true
				stream.write.apply(stream, args)
				if (stream.bytesWritten > maxBytesWritten) {
					//** stream.write('rotateSize')
					rotate()
				}
			}
		}
		if (!didCb) {
			var cb = args.pop()
			if (typeof cb == 'function') cb()
		}
	}

	function rotateTimer() {
		//** if (self.writable) stream.write('rotatedTimer')
		rotate()
	}
	// rotate the log
	function rotate(cb) {
		var retryCount
		var newName

		if (self.writable && didWrite && !rotating) { // we wrote something to the log, and are not in process of rotating
			rotating = true
			retryCount = 0
			newName = getRotatedName()
			fs.stat(newName, doesNewNameExist) // see if the new filename already exist
		} else end()

		function doesNewNameExist(err, stat) {
			if (err instanceof Error && err.code === 'ENOENT') { // we can use newName!
				buffer = [] // start logging to memory instead of the stream
				closeStream('Log rotated to: ' + path.basename(newName) + '\n', renameLog)
			} else {
				if (!err) { // newFile already exists
					if (++retryCount < maxRetry) setTimeout(retry, rotateAttemptWait)
					else end(new Error('Renamed logfile exists'))
				} else end(err) // some other error
			}
		}

		function retry() {
			//** stream.write('retry')
			if (self.writable) {
				newName = getRotatedName()
				fs.stat(newName, doesNewNameExist) // see if the new filename already exist
			} else end()
		}

		function renameLog(err) { // we are in buffer mode, closed  stream
			if (self.writable && !err) fs.rename(self.filename, newName, createWriteStream)
			else flushBuffer(err)
		}

		function createWriteStream(err) {
			if (self.writable && !err)
				if (!(err = openStream()))
					while (buffer.length && self.writable) {
						stream.write(buffer.shift())
					}
			flushBuffer(err)
		}

		function flushBuffer(err) {
			//** stream.write('flushBuffer')
			buffer = null
			rotating = false
			end(err)
		}

		function end(err) {
			if (!err) {
				if (cb) cb()
			} else {
				emitError(err)
				if (cb) cb(err)
			}
		}
	}

	function close(cb) {
		self.writable = false
		if (periodTimer) {
			var p = periodTimer
			periodTimer = null
			p.cancel()
			p.removeListener('time', rotateTimer)
		}
		closeStream(null, cb)
	}

	function closeStream(endLine, cb) {
		if (stream) {
			var v = stream
			stream = null
			var args = [endClose]
			if (endLine) args.unshift(endLine)
			v.end.apply(v, args)
		} else if (cb) cb()

		function endClose(err) {
			v = null
			if (err) emitError(err)
			if (cb) cb(err)
		}
	}

	function streamErrorListener(err) {
		self.writable = false
		stream = null
		emitError(err)
	}

	function getFilename() {
		var result = opts.logFile || defaults.logFile

		// get folder
		var folder
		if (opts.logSubfolder !== '') {
			var logFolder = process.env[process.platform === 'win32' ?
				'USERPROFILE' :
				'HOME']
			if (typeof logFolder === 'string' && logFolder) {
				logFolder = path.join(logFolder, opts.logSubfolder || defaults.logSubfolder)
				if (getType(logFolder) === 1) folder = logFolder
			}
		}
		if (!folder) folder = process.cwd()

		if (!path.extname(result)) result += opts.logFileExt || defaults.logFileExt

		return path.resolve(folder, result)
	}

	function getRotatedName() {
		var extLength = path.extname(self.filename).length // a.log -> 4 '.log'
		var marker = (new Date).toISOString() // 2013-01-07T10:00:00.005Z

		return [ // file_20130107_100000.ext
			self.filename.slice(0, -extLength), '_',
			marker.substring(0, 4), marker.substring(5, 7), marker.substring(8, 10), '_',
			marker.substring(11, 13), marker.substring(14, 16), marker.substring(17, 19),
			self.filename.slice(-extLength),
			].join('')
	}

	function emitError(err) {
		self.writable = false
		self.emit('error', err)
		return err
	}

	function checkSize(fd) {
		fs.fstat(fd, parseStat)
	}

	function parseStat(err, stat) {
		if (!err) maxBytesWritten -= stat.size
		else emitError(err)
	}
}
util.inherits(RotatedStream, events.EventEmitter)

function getType(path1) {
	var result
	var stats
	try {
		stats = fs.statSync(path1)
	} catch (e) {
		var bad = true
		if (e instanceof Error && e.code == 'ENOENT') bad = false
		if (bad) {
			//console.error('Exception for:', typeof path1, path1, path1 != null && path1.length)
			throw e
		}
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = 1
	}
	return result
}
