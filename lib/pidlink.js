// pidlink.js
// Request json-encoded information from another process
// © Harald Rudell 2012

// https://github.com/haraldrudell/greatjson
var greatjson = require('greatjson')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
if (!fs.exists) fs.exists = path.exists

;[
init, getData
].forEach(function (f) {exports[f.name] = f})

var time2s = 2e3
var time500ms = 5e2
var initialWait = time2s
var waitTime = time500ms
var signal = 'SIGUSR2'

var folder
var log = console.log

// let apprunner monitor errors
var require = require('apprunner').getRequire(require, null, {api: 'pidlink',})

/*
configure this api
folder0: optional string: fully qualified pathname to a folder where pid files will be read and written
signal0: optional string, default 'SIGURS2' the signal sent to pid
initialWait0: optional number, default 2,000 ms: the time to wait before sending signal
waitTime0: optional number, default 500 ms: the time to wait between signal and file read
log: function to be used for printing
*/
function init(opts) {
	var result = {
		folder: folder,
		signal: signal,
		initialWait: initialWait,
		waitTime: waitTime
	}
	if (opts) {
		if (opts.folder != null) folder = opts.folder
		if (opts.signal) signal = opts.signal
		if (opts.initialWait != null) initialWait = opts.initialWait
		if (opts.waitTime != null) waitTime = opts.waitTime
		if (typeof opts.log == 'function') log = opts.log
	}
	return result
}

/*
Get data from another process
pid: process id for the other process
slogan: optional string
cb(err, result) function, result: object from json parsing

Wait for 2 seconds to allow the other app time to start properly
send a signal to the process and it will write a file to the filesystem
best effort: if process can't be found or non-init, return undefined result
tmpfolder is used, files are named using the pid with '.json' extension
*/
function getData(pid, slogan, cb) {
	var result
	var err
	var invocation = new Error('invocationStack')

	// must have pid and folder
	pid = +pid
	if (!folder || isNaN(pid) || pid <1) end()

	var file = path.join(folder, pid + '.json')
	readDelete(file, false, erasedExistingFile)

	function erasedExistingFile(err) {
		if (!err) setTimeout(sendSignal, initialWait) // wait for app to start
		else end(err)
	}

	function sendSignal() {
		var signalSent

		try { // instruct process to write to filesystem
			var x = process.kill(pid, signal) // returns true
			var desc = slogan ? slogan + ':' + pid : pid
			log('Sent signal:', signal, 'to process:', desc)
			signalSent = true
		} catch (e) {
			// if process can't be found, it probably died already
			if (e instanceof Error && e.code == 'ESRCH') end()
			else end(e)
			isDone = true
		}
		if (signalSent) setTimeout(fetchData, waitTime)
	}

	function fetchData() {
		readDelete(file, true, end)
	}

	function end(err, data) {
		if (err) require.emitter.emit.apply(this, ['error', err, {
			invocation: invocation,
			pid: pid,
		}].concat(Array.prototype.slice.call(arguments).slice(1)))
		cb(err, data)
	}
}

/*
Get the json content of a file, then delete it
file: string fully qualified path
doRead: optional boolean default false: do read and parse the json
cb(err, result) function: result: parsed json

if the file does not exist, return undefined
*/
function readDelete(file, doRead, cb) {
	var result
	fs.exists(file, existsResult)

	function existsResult(exists) {
		if (exists) {
			if (doRead) fs.readFile(file, readResult)
			else fs.unlink(file, cb)
		} else cb()
	}

	function readResult(err, data) {
		if (!err) {
			var obj = greatjson.parse(data)
			if (!(obj instanceof Error)) {
				result = obj
				fs.unlink(file, rmResult)
			} else cb(obj)
		} else cb(err)
	}

	function rmResult(err) {
		cb(err, result)
	}
}