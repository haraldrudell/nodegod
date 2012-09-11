// requesturl.js
// fetch the port and url of another process
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// https://github.com/haraldrudell/greatjson
var greatjson = require('greatjson')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
if (!fs.exists) fs.exists = path.exists

exports.initApi = initApi

var emitter = new events.EventEmitter()
emitter.id = 'Request URL'

function initApi(opts, cb) {
	return {
		emitter: emitter,
		requestUrl: requestUrl,
		setTmpFolder: setTmpFolder,
	}
}

var tmpFolder

function requestUrl(pid, cb) {
	var result
	var err

	// must have pid and folder
	if (!tmpFolder || !pid) end()

	var file = path.join(tmpFolder, pid + '.json')
	readDelete(file, false, rmResult)

	function rmResult(err) {
		if (!err) {
			// allow 2 seconds for the app to start
			if (!err) setTimeout(sendSignal, 2000)
		} else end(err)
	}

	function sendSignal() {
		var isDone

		// instruct process to write to filesystem
		try {
			// returns true
//console.log(arguments.callee.name, pid)
			var x = process.kill(pid, 'SIGUSR2')
		} catch (e) {
			// if process can't be found, it probably died already
			if (e instanceof Error && e.code == 'ESRCH') end()
			else end(e)
			isDone = true
		}

		// allow 0.5 seconds for process to complete
		if (!isDone) setTimeout(fetchData, 500)
	}

	function fetchData() {
		readDelete(file, true, end)
	}

	function end(err, data) {
		if (err) emitter.emit.apply(this, ['error'].concat( Array.prototype.slice.call(arguments)))
		cb(err, data)
	}
}

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
			}
			else cb(obj)
		} else cb(err)
	}

	function rmResult(err) {
		cb(err, result)
	}
}

function setTmpFolder(folder) {
	tmpFolder = folder
}