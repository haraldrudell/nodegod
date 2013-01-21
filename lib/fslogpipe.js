// fslogpipe.js
// Log stdin to rotatedlogger
// © Harald Rudell 2013 MIT License

require = require('apprunner').getRequire(require, exports, {
	api: require('apprunner').getAppData().appName, initApi: initApi,
	ready: false})

var rotatedlogger = require('./rotatedlogger')
// http://nodejs.org/api/util.html
var util = require('util')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')

var log = console.log

/*
Write stdin to a rotated log
opts: object
.logName: string identifier: name for log file
.processName: string: heading for log statements
*/
function initApi(opts) {
	var logMarker = require.emitter.id + ':' + process.pid
	log = function () {
		console.log(logMarker, util.format.apply(this, Array.prototype.slice.call(arguments)))
	}
	var logger

	if (Array.isArray(opts.ignoredSignals)) 	opts.ignoredSignals.forEach(function (signal) {
		process.on(signal, getSignalHandler(signal))
	})


	if (process.send) {
		logger = new rotatedlogger.RotatedLog({stdout: false, file: true, streamOpts: {logFile: opts.logName}})

		process.stdin.setEncoding('utf-8') // returns undefined
		process.stdin.on('data', stdinDataListener) // returns this
			.once('close', stdinCloseListener)
			.resume()
		process.send('ok') // let parent know we are ready
	} else {
		log('Fatal: ipc not available')
		shutdown()
	}

	function stdinDataListener(data) {
		logger.write(data)
	}
	function stdinCloseListener() {
		log('Detected pipe close')
		logger.write('Log pipe close event ' + (new Date).toISOString())
		logger.close(cleanup)
	}

	function cleanup(err) {
		if (err) log('logger.close:', err)
		process.stdin.removeListener('data', stdinDataListener)
		process.stdin.removeListener('close', stdinCloseListener)
		process.stdin.pause()
		logger = null
		shutdown()
	}

	function shutdown() {
		apprunner.shutdown()
	}
}

function getSignalHandler(signal) {
	return notifySignal

	function notifySignal() {
		log('Ignoring signal:', signal)
	}
}
