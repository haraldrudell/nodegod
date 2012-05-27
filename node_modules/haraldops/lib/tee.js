// tee.js
// forward console printout to file with rotate

// imports
var jsonloader = require('./jsonloader')
// http://nodejs.org/docs/latest/api/process.html#process_process_stdout
var fs = require('fs')

// exports
module.exports = {
	tee: tee,
	unTee: unTee,
}

// class variables
var defaultOpts = { logFolder: jsonloader.getHomeFolder(),
	logFile: 'nodelog', logRotate: 'day' }
var writeStreamFlags = {
	flags: 'a', encoding: 'utf-8', mode: 0666,
}
var minRotate = 60
var globalStream
var isTeed
var periods = { 'minute': 60, 'hour': 3600, 'day': 86400, 'month': 0, 'year': 0 }
var didWrite
var logFilename

function tee(opts) {
	var opts = jsonloader.getOpts(opts, defaultOpts)
	if (opts.logRotate && !periods.hasOwnProperty(opts.logRotate)) {
		throw(Error('Incorrect period keyword for rotation'))
	}

	// open or create the log file
	try {
		logFilename = opts.logFile
		if (logFilename.indexOf('/') == -1) logFilename = opts.logFolder + '/' + logFilename
		var logStream = fs.createWriteStream(logFilename, writeStreamFlags)
		if (!logStream) throw(Error('createWriteStream failed'))
		var otherStream = globalStream
		globalStream = logStream
		if (otherStream) unTee(otherStream)
	} catch(e) {
		throw(e)
	}

	if (!isTeed) {
		doTee('stdout')
		doTee('stderr')
		isTeed = true
		if (opts.logRotate) {
			invokePeriodically(rotate, opts.logRotate)
		}
	}

	function doTee(streamName) {
		var modifiedStream = process[streamName]
		var hisWrite = modifiedStream.write
		modifiedStream.write = function() {
			var argumentsArray = Array.prototype.slice.call(arguments)
			if (globalStream) {
				didWrite = true
				globalStream.write.apply(globalStream, argumentsArray)
			}
			hisWrite.apply(this, argumentsArray)
		}
		process.__defineGetter__(streamName, function() {
			return modifiedStream
		})
	}
}

function unTee(stream) {
	var logStream = stream || globalStream
	if (logStream) {
		if (!stream) globalStream = undefined
		logStream.destroySoon()
	}
}

function memWrite(data, arg1, arg2) {
	var encoding, cb
	if (arg1) {
		if (typeof arg1 === 'string') {
			encoding = arg1
			cb = arg2
		} else if (typeof arg1 === 'function') {
			cb = arg1
		}
	} else {
		throw new Error("bad arg")
	}

	if (typeof data === 'string') {
		data = new Buffer(data, encoding)		
	} else if (!Buffer.isBuffer(data)) {
		throw new TypeError("First argument must be a buffer or a string.")
	}

	this.queue.push([data, encoding, cb])
	return false
}

function rotate() {
	if (didWrite && globalStream) {
		// check if file to rotate to already exists
		// file.yymmdd_hhmmss
		var theStats = fs.statSync(logFilename)
		var cString = theStats.ctime.toISOString()
		var shouldNotExist
		var rotatedName = logFilename + '.' + 
			cString.substring(0, 4) + cString.substring(5, 7)  + cString.substring(8, 10) +
			'_' +
			cString.substring(11, 13) + cString.substring(14, 16) + cString.substring(17, 19)
		try {
			 shouldNotExist = fs.statSync(rotatedName)
		} catch(e) {
			var bad = true
			if (e instanceof Error && e.code == 'ENOENT') bad = false
			if (bad) throw e
		}
		if (shouldNotExist) throw Error('Can not rotate: file exists:' + rotatedName)

		// redirect to temporary stream
		var tempStream = { write: memWrite, queue: [] } // create a memory stream
		var currentStream = globalStream
		globalStream = tempStream

		// close the current stream
		currentStream.on('close', function() {

			// now closed: rename old log file
			fs.renameSync(logFilename, rotatedName)
			// make sure no logFile
			try {
				shouldNotExist = fs.statSync(logFilename)
			} catch(e) {
				var bad = true
				if (e instanceof Error && e.code == 'ENOENT') bad = false
				if (bad) throw e
			}
			if (shouldNotExist) throw Error('Rotate failed, file still exists:' + logFilename)

			// create new log file
			var logStream = fs.createWriteStream(logFilename, writeStreamFlags)
			if (!logStream) throw(Error('createWriteStream failed'))
			globalStream = logStream

			// flush tempStream to logStream
			tempStream.queue.forEach(function(item) {
				globalStream.write(item[0], item[1], item[2])
			})
		})
		currentStream.destroySoon()
	}
}

function invokePeriodically(func, period) {
	var isFixed = periods[period]
	var timer
	var interval

	if (isFixed) {
		// it is a fixed amount of seconds even divisible by full day
		// first align to the end of the current period
		// then use the fixed value
		var now = Math.floor(Date.now() / 1000)
		var seconds = (isFixed - now % isFixed) % isFixed
		if (seconds > 0) timer = setTimeout(endOfInitialPeriod, seconds * 1000)
		else scheduleInterval()
	} else {
		scheduleNextDate()
	}

	function scheduleNextDate() {
		// it is calendar dependent
		// each time, use time to the next period
		var nowDate = new Date()
		var year =  nowDate.getYear()
		var month = nowDate.getMonth()
		if (period == 'month') {
			if (++month > 12) {
				month = 1
				year++
			}
		} else {
			year++
			month = 1
		}
		var nextDate = new Date(year, month)
		var seconds = Math.floor((nextDate - nowDate) / 1000)

		timer = setTimeout(nextCalendar, seconds * 1000)
	}

	function endOfInitialPeriod() {
		scheduleInterval()
		invokeFunc()
	}

	function scheduleInterval() {
		timer = undefined
		interval = setInterval(invokeFunc, isFixed * 1000)
	}

	function nextCalendar() {
		scheduleNextDate()
		invokeFunc()
	}

	function invokeFunc() {
		func()
	}

}
