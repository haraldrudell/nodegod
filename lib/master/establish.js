// establish.js
// establish a nodegod parent process without any dependencies
// © Harald Rudell 2012

exports.establish = establish

// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')

var pidFile
/*
Establish if this is the master process
marker: string: the id for pid file
cb(boolean): function:
- true: this is the master process
- false: the master process has been notified to restart the user interface
*/
function establish(marker, theSignal, cb) {
	if (!pidFile) pidFile = getFileName(marker)
	fs.readFile(pidFile, 'utf-8', pidFromFile)

	function pidFromFile(err, data) {
		var pid
		if (!err && data) {
			var num = parseInt(data)
			if (num > 0) { // there was a pid
				try { // signal to see if that process still exists
					process.kill(num, theSignal)
					pid = num
				} catch (e) {
					// if process is missing, it's ok
					if (e.errno != 'ESRCH') throw e
				}
			}
		}

		if (!pid) { // we are taking over
			fs.writeFile(pidFile, String(process.pid), writeResult)
		} else cb(false) // we're not master exit
	}

	function writeResult(err) {
		if (err) console.log('writing pid:', err.toString)
		cb(true) // we're master exit
	}
}

// helper functions

function getFileName(marker) {
	var f = path.basename(__filename, path.extname(__filename))
	return path.join(getTmpFolder(), f + '.pid')
}

function getTmpFolder() {
	folder = path.join(getHomeFolder(), 'tmp')
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