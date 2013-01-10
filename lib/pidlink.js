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

// this file is not an api, though we can have apprunner monitor errors
var require = require('apprunner').getRequire(require, null, {api: 'pidlink',})

/*
configure this api
folder0: optional string: fully qualified pathname to a folder where pid files will be read and written
signal0: optional string, default 'SIGURS2' the signal sent to pid
initialWait0: optional number, default 2,000 ms: the time to wait before sending signal
waitTime0: optional number, default 500 ms: the time to wait between signal and file read
log: function to be used for printing

the responder is in the apprunner module's appshutdown file.
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
pid: positive number: process id for the other process
slogan: optional string decsribing the pid process
cb(err, result) function, result: object from json parsing

Wait for 2 seconds to allow the other app time to start properly
send a signal to the process and it will write a file to the filesystem
wait 0.5 seconds to read the result
best effort: if process can't be found or non-init, return undefined result
tmpfolder is used, files are named using the pid with '.json' extension
*/
function getData(pid, slogan, cb) {
	var result
	var err
	var invocation = new Error('invocationStack')

	// filename: must have pid and folder
	if (!folder) end(new Error('Folder missing'))
	pid = +pid
	if (!(pid > 0)) end(new Error('Bad process id: ' + pid))
	var file = path.join(folder, pid + '.json')

	var cbCounter = 2
	fs.unlink(file, sendSignal) // delete any pre-existing file
	setTimeout(sendSignal, initialWait) // wait for app to start
	var otherProcess = slogan ? slogan + ':' + pid : pid

	function sendSignal(e) {
		if (e && e.code == 'ENOENT') e = null // ignore file not found
		if (!e && !err) {
			if (!--cbCounter) {
				try { // instruct process to write to filesystem
					var x = process.kill(pid, signal) // returns true

					log('Sent signal:', signal, 'to', otherProcess)
					setTimeout(fetchData, waitTime)
				} catch (e) { // if process can't be found, it probably died already
					end() //e.code == 'ESRCH'
				}
			}
		} else if (!err) end(err = e) // submit the first error
	}

	function fetchData() {
		fs.readFile(file, readResult)
	}

	function readResult(err, data) {
		if (!err) {
			var obj = greatjson.parse(data)
			if (!(obj instanceof Error)) {
				result = obj
				fs.unlink(file, end)
			} else end(obj)
		} else {
			if (err.code == 'ENOENT') {
				log('No data written by:', otherProcess)
				end()
			} else end(err)
		}
	}

	function end(err) {
		if (!err) cb(null, result)
		else {
			require.emitter.emit.apply(require.emitter, ['error', err, {
				invocation: invocation,
				pid: pid,
				slogan: slogan,
			}].concat(Array.prototype.slice.call(arguments).slice(1)))
			cb(err)
		}
	}
}