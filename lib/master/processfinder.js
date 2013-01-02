// processfinder.js
// determine if an app already has a running master process
// © Harald Rudell 2012

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

/*
Establish if this is the master process
opts: object
.port number port number
.interface optional string: interface for server to listen on
.processName log marker
cb(result): function:
- true: this is the master process
- number: the master process pid. It has been notified to restart the user interface
*/
function isProcessMaster(opts, cb) {
	if (!opts) opts = {}
	if (!opts.processName) opts.processName = process.pid + ':' +
		path.basename(__filename, path.extname(__filename))

	var server = new masterserver.MasterServer(opts.port, opts.interface)
		.on('connect', isMaster)
		.on('fail', isNotMaster)
		.on('error', errorLogger)
		.on('end', serverDiedLogger)
		.on('data', resetUi)

	function isMaster() {
		cb(true)
	}
	function isNotMaster() {
		pidgetter.getPidFromPort({port: opts.port, host: opts.interface}, hazMasterPid)
	}
	function hazMasterPid(err, result) {
		cb(err ? err : result)
	}
	function resetUi(data) {
		if (typeof resetUiFn == 'function') resetUiFn()
	}

	function errorLogger(err) { // error during server operation
		console.log(opts.processName, 'error', err.message)
	}
	function serverDiedLogger() {
		console.log(opts.processName, (new Date).toISOString(), 'master server died')
	}
}

function setResetUi(f) {
	resetUiFn = f
}