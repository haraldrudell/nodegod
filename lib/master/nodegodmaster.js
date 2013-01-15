// nodegodmaster.js
// Master process of nodegod
// © Harald Rudell 2013

var rotatedlogger = require('./rotatedlogger')
var processfinder = require('./processfinder')
var uimanager = require('./uimanager')
// http://nodejs.org/api/path.html
var path = require('path')

var log = rotatedlogger.log
var processName = process.pid

exports.run = run

function run(opts) {

	// set up signal handling
	var launchTime = (new Date).toISOString()
	processName = opts.appIndentifier + ':' + process.pid
	process.on('uncaughtException', processUncaughtExceptionListener)
	opts.ignoredSignals.forEach(function (signal) {
		process.on(signal, getSignalHandler(signal))
	})
	log(processName, 'starting master candidate at', launchTime)

	processfinder.isProcessMaster({port: opts.port, interface: opts.interface, processName: processName, log: log}, masterResult)

	function masterResult(isMaster) {
		if (isMaster === true) { // we need to launch the Web ui
			rotatedlogger.init({logToFile: true, logFile: opts.appIndentifier}) // start writing to the logFile
			log(processName, 'is master: launching ui', launchTime)
			processfinder.setResetUi(uimanager.getUiRelauncher())
			uimanager.launchUi({processName: processName, launchArray: opts.launchArray, log: log})
		} else if (typeof isMaster === 'number' && isMaster) { // there is already another nodegod master running, it will launch the web ui
			log(processName, 'exiting: notified existing master with process id:', isMaster)
		} else log(processName, 'failure communicating with exiting master:', isMaster instanceof Error ? isMaster.message : isMaster)
	}
}

function processUncaughtExceptionListener() {
	log(processName, 'uncaughtException')
	var text = []
	Array.prototype.slice.call(arguments).forEach(function (value, index) {
		var valuePoints = []
		var type = typeof value
		if (value && value.constructor && value.constructor.name) type += ':' + value.constructor.name
		valuePoints.push(['arg#:', index].join(' '))
		valuePoints.push(['type:', type].join(' '))
		valuePoints.push(['value:', value].join(' '))
		if (value && value.stack) valuePoints.push(['stack:', value.stack].join(' '))
		text.push(valuePoints.join(', '))
	})
	log(text.join('\n'))
}

function getSignalHandler(signal) {
	return notifySignal

	function notifySignal() {
		log(processName, 'ignoring signal:', signal)
	}
}