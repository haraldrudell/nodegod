// master.js
// master process for nodegod
// © Harald Rudell 2012

var processfinder = require('./lib/master/processfinder')
var uimanager = require('./lib/master/uimanager')
// http://nodejs.org/api/path.html
var path = require('path')

var interMasterSignal = 'SIGUSR2'
var appIndentifier = 'nodegodmaster'
var processName = appIndentifier + ':' + process.pid

// determine if this process should launch ui
console.log(processName, 'starting master candidate at', (new Date).toISOString())
process.on(interMasterSignal, uimanager.interMasterSignalHandler)
process.on('uncaughtException', processException)

processfinder.isProcessMaster(appIndentifier, interMasterSignal, masterResult)

function masterResult(isMaster) {
	if (isMaster === true) { // we need to launch the Web ui
		console.log(processName, 'confirmed master: launching ui process')
		uimanager.launchUi(processName, 'webprocess')
	} else { // there is already another nodegod master running, it will launch the web ui
		console.log(processName, 'exiting: notified existing master, process id:', isMaster)
	}
}

// uncaught exception in this master process: output all information to log
function processException() {
	console.log(processName, 'uncaughtException')
	Array.prototype.slice.call(arguments).forEach(function (value, index) {
		console.log(index + ': ', value)
		if (value instanceof Error && value.stack) console.log(value.stack)
	})
}