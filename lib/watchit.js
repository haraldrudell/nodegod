// watchit.js
// Watch file modifications
// © Harald Rudell 2012 MIT License

var graceperiod = require('./graceperiod')
var watchmanager = require('./watchmanager')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

var time1s = 1e3 // delay in ms allowing for additional file writes

exports.WatchIt = WatchIt

function WatchIt(restartAppFn, displayChangeFn, launchFolder) {
	this.updateFiles = updateFiles
	this.activate = activate
	this.deactivate = deactivate
	this.getCount = getCount
	this.close = close
	var gracePeriod = new graceperiod.GracePeriod(time1s, endOfGrace)
	var wm = new watchmanager.WatchManager()
		.on('change', gracePeriod.trigger)
		.on('rename', gracePeriod.trigger)
		.on('change', getListener('change'))
		.on('rename', getListener('rename'))
	var includeList = []
	var excludeList = []
	var watcherCount = 0

	/*
	includeList: array of string: absolute path to file or folder
	excludeList: array of string: items that starts with any of these are excluded
	return value: number of files being watched
	*/
	function updateFiles(anIncludeList, anExcludeList) {
		if (!arraysDeepEqual(anIncludeList, includeList) ||
			!arraysDeepEqual(anExcludeList, excludeList)) { // some change
			includeList = anIncludeList
			excludeList = anExcludeList
			createWatchers()
		}
		return watcherCount
	}

	function activate() {
		if (!gracePeriod.enable()) { // were disabled
			gracePeriod.enable(true)
			createWatchers()
		}
	}

	function deactivate() {
		gracePeriod.enable(false)
	}

	function getCount() {
		return watcherCount
	}

	function close() {
		wm.removeAllListeners()
		wm.close()
		gracePeriod.close()
	}

	function createWatchers() {
		watcherCount = 0
		wm.clear()
		includeList.forEach(makeAbsolutePath)

		function makeAbsolutePath(aPath) {
			doPath(path.resolve(launchFolder, aPath))
		}

		function doPath(absPath) {
			if (filterPath(absPath)) { // this path is not exluded
				var type = haraldutil.getType(absPath)
				if (type === undefined) console.log('Watch entry does not exist: ' + absPath)
				else {
					addFsWatcher(absPath) // add watcher
					if (type === 1) { // it's a folder
						var entries = []
						try {
							entries = fs.readdirSync(absPath) // recurse into folder
						} catch (e) {
							console.log('Exception: ' + e.message + ' for: ' + absPath)
						}
						entries.forEach(processEntry)
					}
				}
			}

			function processEntry(entry) {
				doPath(path.join(absPath, entry))
			}
		}

		function addFsWatcher(absPath) {
			watcherCount++
			wm.add(absPath)
		}
	}

	// return value: true: should be used
	function filterPath(absPath) {
		var relPath = path.relative(launchFolder, absPath)
		var result = excludeList.every(checkExclusion)

		return result

		function checkExclusion(exclusion) { // true: keep the path
			return relPath.substring(0, exclusion.length) != exclusion
		}
	}

	function endOfGrace() {
		createWatchers()
		restartAppFn(null, watcherCount)
	}

	function getListener(event) {
		return listener

		function listener(absPath) {
			if (gracePeriod.enable()) displayChangeFn(event, absPath)
		}
	}
}

function arraysDeepEqual(a1, a2) {
	var same = a1.length === a2.length
	if (same && a1.length) same = a1.every(checkA2) // same non-zero length, check elements
	return same

	function checkA2(a1Value, index) {
		return a1Value === a2[index]
	}
}
