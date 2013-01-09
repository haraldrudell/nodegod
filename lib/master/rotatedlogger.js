// rotatedlogger.js
// tee output to a log that is rotated
// © Harald Rudell 2013

var perioder = require('./perioder')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

;[
init, log, write
].forEach(function (f) {exports[f.name] = f})

var writeStreamFlags = {
	flags: 'a', encoding: 'utf-8', mode: 0660,
}
var logSubfolder = 'log'
var logFile = 'applog.log'
var rotateSchedule = 'month'

var logToFile
var writeStreamIsError
var logToFileEnabled // affected by writeStreamIsError and logToFile
var logFilename
var writeStream
var stdoutIsError
var periodTimer
var streamBuffer

function init(opts) {
	var result = {
		writeStreamFlags: {},
		logSubfolder: logSubfolder,
		logFile: logFile,
		logFilename: logFilename,
		writeStreamIsError: writeStreamIsError,
		stdoutIsError: stdoutIsError,
		logToFile: logToFile,
	}
	for (var p in writeStreamFlags) result.writeStreamFlags[p] = writeStreamFlags[p]

	if (opts) {
		if (opts.writeStreamFlags) writeStreamFlags = opts.writeStreamFlags
		if (opts.logSubfolder !== undefined) logSubfolder = opts.logSubfolder
		if (opts.logFile) logFile = opts.logFile
		if (opts.logToFile != null) logToFileEnabled = logToFile = opts.logToFile
	}
	return result
}

function log() {
	// process console.log-style arguments to a single string
	write(util.format.apply(this, Array.prototype.slice.call(arguments)) + '\n'	)
}

// write console.log-style arguments to stdout and log file
function write(str) {

	// echo to stdout
	if (!stdoutIsError) {
		try {
			process.stdout.write(str)
		} catch (e) {
			stdoutIsError = true
			write('stdout error: ' + e.message)
		}
	}

	if (logToFileEnabled) {
		if (streamBuffer) streamBuffer.push(str)
		else {
			if (!writeStream) openStream()
			writeStream.write(str)
		}
	}
}

function openStream() {
	if (!logFilename) {

		// get folder
		var folder = process.cwd()
		if (logSubfolder != null)
			var homeFolder = process.env[
				process.platform == 'win32' ?
					'USERPROFILE' :
					'HOME']
			if (typeof homeFolder === 'string' && homeFolder) {
				if (typeof logSubfolder === 'string') homeFolder = path.join(homeFolder, logSubfolder)
				if (getType(homeFolder) === 1) folder = homeFolder
		}
		logFilename = path.join(folder, logFile)
	}

	writeStream = fs.createWriteStream(logFilename, writeStreamFlags)
		.on('error', writeStreamErrorListener)
	if (!periodTimer) periodTimer = new perioder.TimeEmitter({schedule: rotateSchedule})
		.on('time', rotateLog)
}

function rotateLog(cb) {
	if (logFilename && writeStream) { // did log something, rotate

		// see if the renamed filename already exist
		var newName = getRotatedName(logFilename, rotateSchedule)
		fs.stat(newName, fsResult)
	} else if (cb) cb()

	function fsResult(err, stat) {
		if (err instanceof Error && err.code == 'ENOENT') {

			// start logging to memory instead of the stream
			if (!streamBuffer) streamBuffer = [] // redirect writing to buffer

			writeStream.end('Log rotated to: ' + path.basename(newName) + '\n', endResult) // close the writeStream
		} else {
			if (!err) err = new Error('Renamed logfile exists')
			write('Rotating log: ' + err.message)
			if (cb) cb()
		}
	}

	function endResult(err) {
		if (!err) {
			writeStream = null
			writeStreamIsError = false
			logToFileEnabled = logToFile
			fs.rename(logFilename, newName, renameResult)
		} else {
			write('Closing log: ' + err.message)
			if (cb) cb()
		}
	}

	function renameResult(err) {
		if (!err) {

			// flush buffer
			if (streamBuffer.length) {
				openStream()
				while (!writeStreamIsError && streamBuffer.length)
					writeStream.write(streamBuffer.shift())
			}
			streamBuffer = null

		} else write('Renaming logs: ' + err.message)
		if (cb) cb()
	}
}

function getRotatedName(logFilename, rotateSchedule) {
	var marker = getDateMarker(rotateSchedule)

	var extLength = path.extname(logFilename).length // a.log -> 4 '.log'
	return logFilename.slice(0, -extLength) + '_' + marker + logFilename.slice(-extLength)
}

var indexMap = {
	'second': 15,
	'minute': 13,
	'hour': 11,
	'day': 8,
	'month': 6,
	'year': 4,
}
// schedule string eg. 'month'
// return value: string eg. '201301'
function getDateMarker(schedule) {
	// 2013-01-07T10:00:00.005Z
	var date = (new Date).toISOString()
	// 20130107_100000
	var marker = date.substring(0, 4) + date.substring(5, 7) + date.substring(8, 10) + '_' +
		date.substring(11, 13) + date.substring(14, 16) + date.substring(17, 19)
	return marker.substring(0, indexMap[schedule] || 15)
}

function writeStreamErrorListener(err) {
	if (!stdoutIsError) {
		try {
			process.stdout.write('WriteStream Error: ' + err.message)
		} catch (e)
		{}
	}
	writeStreamIsError = true
	logToFileEnabled = false
}

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