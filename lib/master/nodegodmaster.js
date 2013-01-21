// nodegodmaster.js
// Master process of nodegod
// © Harald Rudell 2013 MIT License

var logpipe = require('./logpipe')
var processfinder = require('./processfinder')
var uimanager = require('./uimanager')
// http://nodejs.org/api/path.html
var path = require('path')

var log = console.log
var processName = process.pid

exports.run = run

function run(opts) {
	var masterLaunchTime = Date.now()

	// set up signal handling
	process.on('uncaughtException', processUncaughtExceptionListener)
	opts.ignoredSignals.forEach(function (signal) {
		process.on(signal, getSignalHandler(signal))
	})

	// setup logging
	processName = opts.appIdentifier + ':' + process.pid
	var logger = new logpipe.LogPipe(processName, opts.spawnLog)
	log = logger.pLog
	var launchISO = new Date(masterLaunchTime).toISOString()
	log('Starting master candidate at:', launchISO)

	// find out if this process is master
	processfinder.isProcessMaster({port: opts.port, interface: opts.interface, processName: processName, log: log}, masterResult)

	function masterResult(isMaster, closeServerFn) {
		if (isMaster === true) {
			log('Is master: launching log process')
			logger.connectPipe(master) // start writing to the logFile, not only console
		} else {
			if (typeof isMaster === 'number' && isMaster) log('Exiting: notified existing master with process id:', isMaster) // the master will relaunch its web ui
			else log('Failure communicating with exiting master:', isMaster instanceof Error ? isMaster.message : isMaster)
			logger.end()
		}

		function master(err, loggingPid) { // we need to launch the Web ui
			if (!err) {
				log('Logging process:', loggingPid, 'Launching ui', launchISO)
				processfinder.setResetUi(uimanager.getUiRelauncher())
				uimanager.launchUi({spawn: opts.spawnWeb, rlog: logger, launchTime: masterLaunchTime})
			} else {
				log('Log process failed:', err.message)
				closeServerFn()
				logger.end()
			}
		}
	}
}

function processUncaughtExceptionListener() {
	log('uncaughtException')
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
		log('Ignoring signal:', signal)
	}
}
