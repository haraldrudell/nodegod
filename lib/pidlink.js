// pidlink.js
// Request json-encoded information from another process
// © Harald Rudell 2012

// https://github.com/haraldrudell/greatjson
var greatjson = require('greatjson')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

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

// get error emitter without being an api
var r = require; var require = require('apprunner').getRequire(r, null, {emScope: 'pidlink',})

/*
Configure pidlink
opts: optional object
.folder: optional string: fully qualified pathname to a folder where pid files will be read and written
.signal: optional string, default 'SIGURS2' the signal sent to pid
.initialWait: optional number, default 2,000 ms: the time to wait before sending signal
.waitTime: optional number, default 500 ms: the time to wait between signal and file read
.log: optional function used for printing

The signal handler in the other process is the apprunner module's appshutdown file.
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
slogan: optional string decsribing the other process
cb(err, result) function, result: object from json parsing

Wait for 2 seconds to allow the other app time to start properly
Send a signal to the process causing it to write a file to the filesystem
Wait 0.5 seconds to read the result
Return data from the file

If process can't be found or does not write the file, reult has undefined value
Files are in tmpfolder, named using the process id number and a '.json' extension
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

	function readResult(e, data) {
		if (!e) {
			var obj = greatjson.parse(data)
			if (!(obj instanceof Error)) result = obj
			else err = obj // saving parsing trouble
			fs.unlink(file, end)
		} else {
			if (e.code == 'ENOENT') {
				log('No data written by:', otherProcess)
				end()
			} else end(e)
		}
	}

	function end(e) {
		if (!e && err) e = err // pick up saved error
		if (!e) cb(null, result) // good return
		else {
			require.emitter.emit.apply(require.emitter, ['error', e, {
				invocation: invocation,
				pid: pid,
				slogan: slogan,
			}].concat(Array.prototype.slice.call(arguments).slice(1)))
			cb(e) // bad return
		}
	}
}