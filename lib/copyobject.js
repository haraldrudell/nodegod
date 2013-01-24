// copyobject.js
// Manage one from-to watcher with copy
// © Harald Rudell 2011 MIT License

var graceperiod = require('./graceperiod')
var watchmanager = require('./watchmanager')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

var time1s = 1e3

exports.CopyObject = CopyObject

/*
Watch from and copy from-to on change
from: string: absolute path source
to: string: absolute path destination
notifyFn: function
*/
function CopyObject(from, to, notifyFn) {
	this.doCopy = doCopy
	this.getFrom = getFrom
	this.getTo = getTo
	this.getCount = getCount
	this.close = close
	var isFirst = true
	var wm = new watchmanager.WatchManager()
	var gracePeriod = new graceperiod.GracePeriod(time1s, endOfGrace)
	var watcherCount = 0
	var doCopyWatcherCount

	function getTo() {
		return to
	}

	function getFrom() {
		return from
	}

	function getCount() {
		return watcherCount
	}

	function close() {
		if (wm) {
			var w = wm
			wm = null
			w.removeListener('change', gracePeriod.trigger)
				.removeListener('rename', gracePeriod.trigger)
			w.close()
		}
	}

	function endOfGrace(absPath) { // after grace period: do the copy
		var watchCountBefore = watcherCount
		doCopy(doNotify) // copy files and update watchers

		function doNotify(err) {
			notifyFn(err, watcherCount - watchCountBefore) // provide change
		}
	}

	function doCopy(cb) { // copy from-to
		doCopyWatcherCount = 0
		var err
		var toType = haraldutil.getType(to)
		if (toType === undefined) err = new Error('destination does not exist: ' + to)
		else {
			var fromType = haraldutil.getType(from)
			if (fromType === undefined) err = new Error('source does not exist:' + instance.from)
			else if (toType === true) { // to is file
				if (fromType !== true) err = new Error('Cannot copy folder onto this file:' + instance.to)
				else copyFile(from, to, endOfDoCopy) // file-to-file
			} else { // to is folder, from is file or folder
				if (fromType === true) { // from file to folder
					var toFile = path.join(to, path.basename(from))
					copyFile(from, toFile, endOfDoCopy)
				} else copyFolder(from, to, endOfDoCopy) // folder to folder
			}
		}
		if (err) endOfDoCopy(err)

		function endOfDoCopy(err, result) {
			if (!err) {
				if (isFirst) {
					isFirst = false
					wm.on('change', gracePeriod.trigger)
						.on('rename', gracePeriod.trigger)
				}
				watcherCount = doCopyWatcherCount
				if (cb) cb(null, watcherCount)
			} else if (cb) cb(err)
		}
	}

	// cb(err, [from])
	function copyFolder(from, to, cb) {
		var isError
		var cbCounter = 1
		var result = []
		if (from !== to) copyAFolder(from, to)
		end()

		function copyAFolder(from, to) {
			cbCounter++
			fs.readdir(from, readdirResult)

			function readdirResult(err, files) {
				if (!err) {
					files.forEach(processEntry)
					end(null, from)
				} else end(err)
			}

			function processEntry(entry) {
				var from0 = path.join(from, entry)
				var to0 = path.join(to, entry)
				switch (haraldutil.getType(from0)) {
				case 1: // folder
					if (haraldutil.getType(to0) === undefined) fs.mkdir(to0, createdFolder)
					else copyAFolder(from0, to0)
					break
				case true: // file
					cbCounter++
					copyFile(from0, to0, end)
				}

				function createdFolder(err) {
					if (!err) copyAFolder(from0, to0)
					else end(err)
				}
			}
		}

		function end(err, from) {
			if (!err) {
				if (from) {
					doCopyWatcherCount++
					wm.add(from)
				}
				if (!--cbCounter) {
					cb(null)
				}
			} else if (!isError) {
				isError = true
				cb(err)
			}
		}
	}

	// cb(err, from)
	function copyFile(from, to, cb) {
		var err

		if (from !== to) {
			fs.createReadStream(from)
				.on('error', errorListener).pipe(
				fs.createWriteStream(to)
					.on('error', errorListener)
					.on('close', doneListener))
		} else {
			from = null
			doneListener()
		}

		function errorListener(e) {
			if (!err) err = e
		}

		function doneListener() {
			if (!err) {
				doCopyWatcherCount++
				wm.add(from)
				cb(null)
			} else cb(err)
		}
	}
}
