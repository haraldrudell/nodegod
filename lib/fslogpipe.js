// fslogpipe.js
// Log stdin to rotatedlogger
// © Harald Rudell 2013 MIT License

// http://nodejs.org/api/util.html
var util = require('util')

require = require('apprunner').getRequire(require, exports, {
	api: require('apprunner').getAppData().appName, initApi: initApi,
	ready: false})

var rotatedlogger = require('./rotatedlogger')

/*
Write stdin to a rotated log
opts: object
.logName: string identifier: name for log file
.processName: string: heading for log statements
*/
function initApi(opts) {
	var logMarker = require.emitter.id + ':' + process.pid
	var logger = new rotatedlogger.RotatedLog({stdout: false, file: true, streamOpts: {logFile: opts.logName}})

	process.stdin.on('data', echoData) // returns this
	process.stdin.setEncoding('utf-8') // returns undefined
	process.stdin.resume()
	if (process.send) process.send('ok')

	function echoData(data) {
		logger.write(data)
	}
}
