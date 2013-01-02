// app.js
// master process for nodegod
// © Harald Rudell 2012

var processfinder = require('./lib/master/processfinder')
var uimanager = require('./lib/master/uimanager')

var appIndentifier = 'nodegodmaster'
var port = 1113
var interface = '127.0.0.1'
ignoredSignals = ['SIGINT', 'SIGUSR2']

var processName = appIndentifier + ':' + process.pid

// determine if this process should launch ui
console.log(processName, 'starting master candidate at', (new Date).toISOString())
process.on('uncaughtException', processUncaughtExceptionListener)
ignoredSignals.forEach(function (signal) {
	process.on(signal, getSignalHandler(signal))
})
processfinder.isProcessMaster({port: port, interface: interface, processName: processName}, masterResult)
function masterResult(isMaster) {
	if (isMaster === true) { // we need to launch the Web ui
		console.log(processName, 'confirmed master: launching ui process')
		processfinder.setResetUi(uimanager.getUiRelauncher())
		uimanager.launchUi(processName, 'webprocess')
	} else if (typeof isMaster == 'number' && isMaster) { // there is already another nodegod master running, it will launch the web ui
		console.log(processName, 'exiting: notified existing master with process id:', isMaster)
	} else console.log(processName, 'failure communicating with exiting master:', isMaster instanceof Error ? isMaster.message : isMaster)
}

function processUncaughtExceptionListener() {
	console.log(processName, 'uncaughtException')
	Array.prototype.slice.call(arguments).forEach(function (value, index) {
		console.log(index + ': ', value)
		if (value instanceof Error && value.stack) console.log(value.stack)
	})
}

function getSignalHandler(signal) {
	return notifySignal

	function notifySignal() {
		console.log(processName, 'ignoring:', signal)
	}
}