// processfinder.js
// determine if an app already has a running master process
// © Harald Rudell 2012

exports.isProcessMaster = isProcessMaster

// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')

var pidFileName
/*
Establish if this is the master process

appIndentifier: string: the app name eg. 'nodegod'
interMasterSignal: string: the signal name for inter-process communication eg. 'SIGUSR2'
cb(boolean): function:
- true: this is the master process
- false: the master process has been notified to restart the user interface
*/
function isProcessMaster(appIndentifier, interMasterSignal, cb) {
	if (!pidFileName) pidFileName = getFileName(appIndentifier)
	fs.readFile(pidFileName, 'utf-8', pidFromFile)

	function pidFromFile(err, data) {
		var pid
		if (!err && data) {
			var num = parseInt(data)
			if (num > 0) { // there was a pid
				try { // signal to see if that process still exists
					process.kill(num, interMasterSignal)
					pid = num
				} catch (e) { // if process is missing, it's ok
					if (e.errno != 'ESRCH') throw e
				}
			}
		}

		if (!pid) { // we are taking over
			fs.writeFile(pidFileName, String(process.pid), writeResult)
		} else cb(pid) // we're not master exit
	}

	function writeResult(err) {
		if (err) console.log('writing pid:', err.toString())
		cb(true) // we're master exit
	}
}

// helper functions

function getFileName(appIndentifier) {
	return path.join(getTmpFolder(), appIndentifier + '.pid')
}

function getTmpFolder() {
	var folder = path.join(getHomeFolder(), 'tmp')
	if (getType(folder) !== 1) {
		folder = process.env.TEMP
		if (!folder || getType(folder) !== 1) {
			folder = '/tmp'
			if (getType(folder) !== 1) throw Error('no tmp folder found')
		}
	}

	return folder
}

function getHomeFolder() {
	return process.env[
		process.platform == 'win32' ?
		'USERPROFILE' :
		'HOME']
}

function getType(path1) {
	var result
	var stats
	try {
		stats = fs.statSync(path1)
	} catch (e) {
		var bad = true
		if (e instanceof Error && e.code == 'ENOENT') bad = false
		if (bad) {
			console.error('Exception for:', typeof path1, path1, path1 != null && path1.length)
			throw e
		}
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = 1
	}
	return result
}