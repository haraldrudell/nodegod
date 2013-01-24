// watchmanager.js
// Manage fs.Watchers, emit events and close watchers
// © Harald Rudell 2013 <harald@allgoodapps.com>  MIT License

// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.WatchManager = WatchManager

/*
Manages file and folder watching
.add(string): watch a fully qualified path, returns a numbre identifying the watcher
.remove(number): close the watcher number
.close(): close all watchers

emits events from its watchers, argument is fully qualified path
*/
function WatchManager() {
	var self = this
	events.EventEmitter.call(this)
	this.add = add
	this.remove = remove
	this.getCount = getCount
	this.close = close
	this.clear = close
	var marker = arguments.callee.name
	var watcherIndex = 0
	var watchers = {}

	function add(fqPath) {
		var result = watcherIndex
		var watcher = fs.watch(fqPath, getWatchListener(fqPath))
		if (!watcher) throw new Error(marker +  ' fs.watch failed for: ' + fqPath)
		if (!(typeof watcher.close === 'function')) throw new Error(marker +  'fs.Watch result did not have close function')
		watchers[watcherIndex++] = watcher
		return result
	}
	function remove(index) {
		var watcher = watchers[index]
		if (watcher) {
			delete watchers[index]
			closeWatcher(watcher)
		}
	}
	function getCount() {
		return Object.keys(watchers).length
	}
	function close() {
		if (watcherIndex) {
			var w = watchers
			watchers = {}
			watcherIndex = 0
			for (var index in w) {
				closeWatcher(w[index])
			}
		}
	}
	function getWatchListener(fqPath) {
		var result = watchListener
		result.getPath = getPath
		return result

		function watchListener(event, filename) { // filename is unreliable
			self.emit(event, fqPath)
		}

		function getPath() {
			return fqPath
		}
	}
	function closeWatcher(watcher) {
		watcher.close()
	}
}
util.inherits(WatchManager, events.EventEmitter)
