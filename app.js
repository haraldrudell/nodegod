// master.js
// master process for nodegod
// © Harald Rudell 2012

var establish = require('./lib/master/establish')
var uimanager = require('./lib/master/uimanager')
// http://nodejs.org/api/path.html
var path = require('path')

var theSignal = 'SIGUSR2'
var marker = path.basename(__filename, path.extname(__filename))
var fileId = marker + ':' + process.pid

// determine if this process should launch ui
console.log(fileId, 'starting')
process.on(theSignal, uimanager.signalHandler)
process.on('uncaughtException', processException)
establish.establish(marker, theSignal, masterResult)

function masterResult(isMaster) {
	if (isMaster) {
		console.log(fileId, 'launching ui process')
		uimanager.launchUi(fileId, __dirname)
	} else console.log(fileId, 'notified the master process')
}

function processException() {
	console.log(marker, 'uncaughtException')
	Array.prototype.slice.call(arguments).forEach(function (value, index) {
		console.log(index + ': ', value)
		if (value instanceof Error && value.stack) console.log(value.stack)
	})
}