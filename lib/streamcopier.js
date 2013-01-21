// streamcopier.js
// Provide a write stream that duplicates onto any number of write streams
// © Harald Rudell 2013 MIT License

// http://nodejs.org/api/stream.html
var stream = require('stream')
// http://nodejs.org/api/util.html
var util = require('util')

exports.StreamCopier = StreamCopier

/*
warn: an error on one of the pipes
error: all pipes are out
*/
function StreamCopier() {
	var self = this
	stream.Stream.call(this)
	this.writable = true
	this.log = log
	this.write = write
	this.setPrepend = setPrepend
	this.pLog = pLog
	this.addStream = addStream
	this.removeStream = removeStream
	this.end = end
	this.destroy = destroy
	var prepend
	var streamIndex = 0
	var streams = {}

	function pLog() {
		commonLog(Array.prototype.slice.call(arguments), prepend)
	}

	function log() {
		commonLog(Array.prototype.slice.call(arguments))
	}

	function commonLog(args, prepend) {
		var s = util.format.apply(this, args) + '\n'
		if (prepend) s = prepend + ' ' + s
		write(s)
	}

	function setPrepend(s) {
		prepend = s ? String(s) : ''
		return self
	}

	function addStream(stream, name) {
		if (self.writable) {
			var i = streamIndex++
			streams[i] = {
				stream: stream,
				name: name
			}
		} else self.emit('error', 'Stream not writable')
		return i
	}

	function removeStream(no) {
		delete streams[no]
	}

	function write(s) {
		var err
		var didCb
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null

		var cbCounter = Object.keys(streams).length + 1
		for (var streamNo in streams) doWrite(streamNo)
		end()

		function doWrite(streamNo) {
			var stream = streams[streamNo].stream
			if (stream.writable) stream.write.apply(stream, args.concat(writeResult))
			else streamLost()

			function writeResult(e) {
				if (!e) end()
				else streamLost(e) // a write resulted in error
			}

			function streamLost(e) {
				var isError = Object.keys(streams).length == 1 // if we lost the last stream, it's error

				// emit the event
				eventType = isError ? 'error' : 'warning'
				var msg = 'Stream ' + streams[streamNo].name + ' no longer writable'
				if (e) msg += ': ' + err.msg
				self.emit(eventType, msg)
				delete streams[streamNo]

				if (isError) {
					if (!e) e = new Error(msg)
					self.writable = false
					end(e)
				} else write(msg, end) // write to remaining streams
			}
		}

		function end(e) {
			if (!err && e) err = e
			if (!err) {
				if (!--cbCounter && cb) {
					cb()
				}
			} else if (!didCb && cb) {
				didCb = true
				cb(err)
			}
		}
	}

	function end(s) {
		var err
		var args = Array.prototype.slice.call(arguments)
		var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
		var cbCounter = Object.keys(streams).length + 1

		if (args.length) write.apply(this, args.concat(allWritten))
		else allWritten()

		function allWritten(e) {
			if (e && !err) err = e
			for (var streamNo in streams) doEnd(streamNo)
			end()
		}

		function doEnd(streamNo) {
			streams[streamNo].stream.end(endResult)

			function endResult(e) {
				if (e) {
					if (!err) err = e
					self.emit('error', 'Stream ' + streams[streamNo].name + ' end error: ' + e.message)
				}
				delete streams[streamNo]
				end()
			}
		}

		function end() {
			if (!--cbCounter) {
				self.writable = false
				if (cb)
					if (err) cb(err)
					else cb()
			}
		}
	}

	function destroy(cb) {
		var cbCounter = Object.keys(streams).length + 1
		for (var streamNo in streams) doDestroy(streamNo)
		end()

		function doDestroy(streamNo) {
			streams[streamNo].stream.destroy(endResult)

			function destroyResult(e) {
				if (e) {
					if (!err) err = e
					self.emit('error', 'Stream ' + streams[streamNo].name + ' destroy error: ' + e.message)
				}
				delete streams[streamNo]
				end()
			}
		}

		function end() {
			if (!--cbCounter) {
				self.writable = false
				if (cb)
					if (err) cb(err)
					else cb()
			}
		}
	}
}
util.inherits(StreamCopier, stream.Stream)
