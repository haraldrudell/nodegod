// processfinder.js
// determine if an app already has a running master process
// © Harald Rudell 2012 MIT License

var masterserver = require('./masterserver')
var pidgetter = require('./pidgetter')
// http://nodejs.org/api/net.html
var net = require('net')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/events.html
var events = require('events')

exports.isProcessMaster = isProcessMaster
exports.setResetUi = setResetUi

var processName = process.pid + ':'

var resetUiFn
var log = console.log

/*
Establish if this is the master process
opts: object
.port number port number
.interface optional string: interface for server to listen on
.processName log marker
.log logging function
cb(result): function:
- true: this is the master process
- number: the master process pid. It has been notified to restart the user interface
*/
function isProcessMaster(opts, cb) {
	if (!opts) opts = {}
	var gotClose
	if (typeof opts.log == 'function') log = opts.log
	var processName = opts.processName || process.pid + ':' +
		path.basename(__filename, path.extname(__filename))

	var server = new masterserver.MasterServer(opts.port, opts.interface)
		.on('connect', isMaster)
		.on('fail', isNotMaster)
		.on('error', errorLogger)
		.on('end', serverDiedLogger)
		.on('data', resetUi)

	function isMaster() {
		cb(true, closeServer)
	}
	function isNotMaster() {
		pidgetter.getPidFromPort({port: opts.port, host: opts.interface}, hazMasterPid)
	}
	function hazMasterPid(err, result) {
		cb(err ? err : result)
	}
	function resetUi(data) { // got a connection and a process id from candidate master
		var text
		var pid = +data
		if (!isNaN(pid) && pid > 0) text = 'from process: ' + pid
		else text = 'from another process'
		log(processName, (new Date).toISOString(), 'ui reset requested', text)

		if (typeof resetUiFn == 'function') resetUiFn()
	}

	function errorLogger(err) { // error during server operation
		log(processName, (new Date).toISOString(), 'error', err.message)
	}
	function serverDiedLogger() {
		log(processName, (new Date).toISOString(), 'master server', gotClose ? 'shut down' : 'died')
	}

	function closeServer() {
		gotClose = true
		server.shutdown()
	}
}

function setResetUi(f) {
	resetUiFn = f
}