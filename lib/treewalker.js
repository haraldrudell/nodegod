// treewalker.js
// Traverse a filesystem path emitting folder and file events
// © Harald Rudell 2013 <harald@allgoodapps.com>  MIT License

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.TreeWalker = TreeWalker

/*
Traverse a filesystem path emitting folder and file events
opts: optional object
.path: optional string, default process.cwd: path to traverse, absolute path or path relative to process.cwd
.files: optinal boolean default true: emit file events
.folders: optinal boolean default true: emit folder events

An event is issued for the initial folder, too.

events
'file' fully-qualified path to file, filename with extension, fully qualified path to folder
'folder' full;y qualified path to folder, folder name, fully qualified path to parent folder
'end' all results have been submitted
'error' Error, explanatory object
final events are error and end
*/
function TreeWalker(opts) {
	if (!opts) opts = {}
	var self = this
	this.destroy = destroy
	events.EventEmitter.call(this)
	var cbCounter = 1
	var isError

	var fqPath = opts.path != null ? path.resolve(String(opts.path)) : process.cwd()
	var files = opts.files != null ? !!opts.files : true
	var folders = opts.folders != null ? !!opts.folders : true
	opts = null

	if (files || folders) {
		readdir(fqPath)
		end()
	} else process.nextTick(end)

	function readdir(folder) {
		cbCounter++
		self.emit('folder', folder, path.basename(folder), path.dirname(folder))
		fs.readdir(folder, readdirResult)

		function readdirResult(err, files) {
			if (!err) {
				if (!isError) {
					files.forEach(function (entry) {
						var fqEntry = path.join(folder, entry)
						var type = haraldutil.getType(fqEntry)
						if (type === true && files) self.emit('file', fqEntry, entry, folder)
						else readdir(fqEntry)
					})
					end()
				}
			} else end (err, {when: 'fs.readdir on ' + folder})
		}
	}

	function end(err) {
		if (!err) {
			if (!--cbCounter) self.emit('end')
		} else {
			isError = true
			self.emit.apply(self, ['error'].concat(Array.prototype.slice.call(arguments)))
		}
	}

	function destroy() {
		isError = true
	}
}
util.inherits(TreeWalker, events.EventEmitter)
