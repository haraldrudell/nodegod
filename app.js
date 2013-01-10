// app.js
// master process for nodegod
// © Harald Rudell 2012

var rotatedlogger = require('./lib/master/rotatedlogger')
var processfinder = require('./lib/master/processfinder')
var uimanager = require('./lib/master/uimanager')
// http://nodejs.org/api/path.html
var path = require('path')

var appIndentifier = 'nodegodmaster'
var port = 1113
var interface = '127.0.0.1'
var ignoredSignals = ['SIGINT', 'SIGUSR2', 'SIGHUP']
var launchArray = ['node'/*, '--debug-brk'*/, path.join(__dirname, 'webprocess')]

var processName = appIndentifier + ':' + process.pid
var log = rotatedlogger.log
var launchTime = (new Date).toISOString()

// determine if this process should launch ui
log(processName, 'starting master candidate at', launchTime)
process.on('uncaughtException', processUncaughtExceptionListener)
ignoredSignals.forEach(function (signal) {
	process.on(signal, getSignalHandler(signal))
})
processfinder.isProcessMaster({port: port, interface: interface, processName: processName, log: log}, masterResult)
function masterResult(isMaster) {
	if (isMaster === true) { // we need to launch the Web ui
		rotatedlogger.init({logToFile: true, logFile: appIndentifier}) // start writing to the logFile
		log(processName, 'is master: launching ui', launchTime)
		processfinder.setResetUi(uimanager.getUiRelauncher())
		uimanager.launchUi({processName: processName, launchArray: launchArray, log: log})
	} else if (typeof isMaster == 'number' && isMaster) { // there is already another nodegod master running, it will launch the web ui
		log(processName, 'exiting: notified existing master with process id:', isMaster)
	} else log(processName, 'failure communicating with exiting master:', isMaster instanceof Error ? isMaster.message : isMaster)
}

function processUncaughtExceptionListener() {
	log(processName, 'uncaughtException')
	var text = []
	Array.prototype.slice.call(arguments).forEach(function (value, index) {
		var line = []
		var type = typeof value
		if (value && value.constructor && value.constructor.name) type += ':' + value.constructor.name
		line.push('arg#:', index, 'type:', type, 'value:', value)
		if (value && value.stack) line.push('stack:', value.stack)
		text.push(line.join(' '))
	})
	log(text.join('\n'))
}

function getSignalHandler(signal) {
	return notifySignal

	function notifySignal() {
		log(processName, 'ignoring:', signal)
	}
}