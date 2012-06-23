// watchit.js
// watch file modifications

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
var getfilenames = require('./getfilenames')

// delay in seconds (for additional writes)
var delay = 3

module.exports = {
	WatchIt: WatchIt,
}

function WatchIt(restartFunc) {
	var files = []
	var watchers = []
	var active
	var timer

	// return value: number of files being watched
	this.updateFiles = function(fileValue, folder) {
		var newFiles = []
		if (fileValue) newFiles = getfilenames.getFileArray(fileValue, folder, 'js')
		if (!areStringArraysSame(files, newFiles)) {
			files = newFiles
			if (active) {
				dropWatchers()
				createWatchers()
			}			
		}
		return files.length
	}

	this.activate = function () {
		active = true
		createWatchers()
	}

	this.deactivate = function () {
		active = false
	}

	function watchFunc(event, filename) {
		console.log(event, filename)
		if (active && !timer) timer = setTimeout(trig, delay * 1000)
	}

	function createWatchers() {
		if (watchers.length != files.length) {
			files.forEach(function(file) {
				watchers.push(fs.watch(file, watchFunc))
			})
		}
	}

	function dropWatchers() {
		watchers.forEach(function(watcher) {
			watcher.close()
		})
		watchers = []
	}

	function trig() {
		timer = undefined
		restartFunc()
	}

	function areStringArraysSame(a1, a2) {
		var same = false
		var max = a1.length

		// compare array lengths
		if (max == a2.length) {

			// compare each element
			for (var index = 0; index < max; index++) {
				if (a1[index] != a2[index]) break
			}
			same = index == max
		}

		return same
	}
}