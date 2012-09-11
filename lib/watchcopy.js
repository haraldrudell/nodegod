// watchcopy.js

// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')

module.exports = {
	watchCopy: watchCopy,
}

var slogan = path.basename(__filename, path.extname(__filename))

// set up a collection of copy
// copyObject: key: source folder, value: target folder
// folder: the base for relative paths
// restartFunc: invoked on conclusion of copy initated by change
function watchCopy(id) {
	var copy = []
	var time = 3000
	var timer
	var notifyFunc
	return {
		init: init,
		shutDown: shutDown,
		setTime: setTime,
		updateCopyObject: updateCopyObject,
	}

	function init(copyObject, folder, restartFunc, cb) {
		notifyFunc = restartFunc
		var count = final(cb, logCount)

		for (var to in copyObject)
			addInstance(
				newInstance(copyObject[to], to, folder),
				count)

		count.dec()
	}

	function logCount() {
		var copyWatchCount = 0
		copy.forEach(function (instance) {
			copyWatchCount += instance.watchers.length
		})
//console.log(arguments.callee.name, id, 'watchers:', copyWatchCount)
	}

	function addInstance(instance, count) {
		copy.push(instance)
		doCopy(instance, count, watchFunc)
	}

	function newInstance(from, to, folder) {
		var instance = {
			to: path.resolve(folder, String(to)),
			from: path.resolve(folder, String(from)),
			watchers: [],
		}
		return instance		
	}

	function setTime(newTime) {
		time = newTime
	}

	function shutDown() {
		copy.forEach(function (instance) {
			zapWatchers(instance)
		})
	}

	function zapWatchers(instance) {
		instance.watchers.forEach(function (watcher) {
			watcher.close()
		})
		instance.watchers = []
	}

	function watchFunc(event, filename) {
		console.log(arguments.callee.name, id, event, filename)
		if (!timer) timer = setTimeout(action, time)
	}

	function action() {
		timer = null
		var count = final(actionDone)

		// because files might have been added, copy everything
		copy.forEach(function (instance) {
			zapWatchers(instance)
			doCopy(instance, count, watchFunc)
		})
		count.dec()
	}

	function actionDone(err) {
		if (err) throw err
		else notifyFunc()
	}

	// an instance is identified by to and from
	// add and do copy for any new instances
	// remove instances that do not exist in updateObject
	function updateCopyObject(updateObject, folder, cb) {
		var count = final(preCb)
		var restart = false
		var keepThese = []

		for (var to in updateObject) {
			var updateInstance = newInstance(updateObject[to], to, folder)
			var index = getIndex(updateInstance)
			if (index === false) {

				// add new instance	
				restart = true
				index = copy.length
				addInstance(updateInstance, count)
			}

			// mark instance seen
			keepThese[index] = true
		}
		count.dec()

		function preCb(err) {
			copy.forEach(function (value, index) {
				if (!keepThese[index]) copy[index] = null
			})
			if (restart) restart = 'update to copy object'
			cb(err, restart)
		}
	}

	// false: not found
	// number: index in copy
	function getIndex(instance) {
		var result = false
		copy.some(function (copyInstance, index) {
			var found = copyInstance &&
				instance.to == copyInstance.to &&
				instance.from == copyInstance.from
			if (found) result = index
			return found
		})
		return result
	}
}

function doCopy(instance, count, watchFunc) {
	console.log(arguments.callee.name, instance.from, instance.to)
	// to must exist!
	var toType = haraldutil.getType(instance.to)
	if (toType === undefined) count.dec(Error('destination does not exist:' + instance.to))

	// from must exist!
	var fromType = haraldutil.getType(instance.from)
	if (fromType === undefined) count.dec(Error('source does not exist:' + instance.from))
	// if to is a file, from must be a file
	if (toType) {
		if (!fromType) count.dec(Error('Cannot copy folder onto this file:' + instance.to))

		// copy file to file
		copyFile(instance.from, instance.to)
	} else {
		// to is a folder, from is a file or a folder
		if (fromType) {

			// copy file to folder
			var toFile = path.join(instance.to, path.basename(instance.from))
			copyFile(instance.from, toFile)
		}

		// copy folder to folder
		copyFolder(instance.from, instance.to)
	}

	function copyFolder(from, to) {
		count.inc()
		fs.readdir(from, function (err, files) {
			if (!err) files.forEach(function (entry) {
				if (entry[0] != '.') {
					var from0 = path.join(from, entry)
					var to0 = path.join(to, entry)
					switch (haraldutil.getType(from0)) {
					case 1:
						if (haraldutil.getType(to0) === undefined) {
							count.inc()
							fs.mkdir(to0, function (err) {
								if (!err) copyFolder(from0, to0)
								count.dec(err)
							})
						} else {
							copyFolder(from0, to0)
						}
						break
					case true:
						copyFile(from0, to0)
					}
				}
			})
			count.dec(err)
		})

	}

	function copyFile(from, to) {
		count.inc()
		util.pump(
			fs.createReadStream(from),
			fs.createWriteStream(to),
			count.dec)
		instance.watchers.push(fs.watch(from, watchFunc))
	}
}

function final(cb, precb) {
	var pending = 1
	var done = false

	return {
		inc: function () {
			pending++
		},
		dec: function (err) {
			if (err) {
				done = true
				if (precb) precb(err)
				if (cb) cb(err)
				else throw err
			} else if (!done && --pending == 0) {
				done = true
				if (precb) precb()
				if (cb) cb()
			}
		},
	}
}