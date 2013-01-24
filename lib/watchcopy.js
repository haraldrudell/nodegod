// watchcopy.js
// Watchers that copy files
// © Harald Rudell 2011 MIT License

var copyobject = require('./copyobject')

exports.WatchCopy = WatchCopy

/*
Manage one set of watch and copy instructions
id: string identifier for this instance
notifyFn(fqPath): function: invoked after a detected file change and its required copying

set up a collection of copy
copyObject: key: source folder, value: target folder
*/
function WatchCopy(id, notifyFn) {
	this.init = init
	this.updateCopyObject = updateCopyObject
	this.shutdown = shutdown
	var copyObjectsIndex = 0
	var copyObjects = {}
	var graceTimeMs = 3000
	var timer
	var isError

	/*
	Initialize watch and copy to multiple destinations
	copyObject: object
	- key: string absolute path destination
	- value: string absolute path source
	cb(err, result): function: result is number of file watchers
	*/
	function init(copyObject, cb) {
		var result = 0
		isError = false
		var cbCounter = 1
		for (var to in copyObject) {
			var o = copyObjects[copyObjectsIndex++] =
				new copyobject.CopyObject(copyObject[to], to, notifyFn)
			cbCounter++
			o.doCopy(copyResult)
		}
		copyResult()

		function copyResult(err, count) {
			if (!err) {
				if (count) result += count
				if (!--cbCounter && cb) cb(null, result)
			} else if (!isError) {
				isError = true
				if (cb) cb(err)
			}
		}
	}

	/*
	Update detinations and watchers
	copyObject: object
	- key: string absolute path destination
	- value: string absolute path source
	cb(err, result): function: result is number of file watchers

	each copy instruction is identified by to and from
	add instances that did not exist before
	keep instances that are the same
	remove instances that do not exist in updateObject
	*/
	function updateCopyObject(updateObject, cb) {
		var result = 0
		isError = false
		var cbCounter = 1
		var restartNeeded = false

		var remaining = {}
		var toMap = {}
		for (var index in copyObjects) {
			remaining[index] = true
			var o = copyObjects[index]
			var to = o.getTo()
			var from = o.getFrom()

			var map = toMap[to]
			if (!map) {
				toMap[to] = map = {}
				map[from] = [index]
			} else if (map[from]) map[from].push(index)
			else map[from] = [index]
		}

		for (var to in updateObject) {
			var from = updateObject[to]

			var index
			var map = toMap[to]
			if (map && map[from]) index = map[from].shift()

			if (index == null) { // a new copy instruction
				restartNeeded = true
				var o = copyObjects[copyObjectsIndex++] =
					new copyobject.CopyObject(from, to, notifyFn)
				cbCounter++
				o.doCopy(copyResult)
			} else {
				result += copyObjects[index].getCount()
				delete remaining[index]
			}
		}

		for (var index in remaining) {
			var o = copyObjects[index]
			delete copyObjects[index]
			o.close()
		}
		copyResult()

		function copyResult(err, count) {
			if (!err) {
				if (count) result += count
				if (!--cbCounter && cb) cb(null, count)
			} else if (!isError) {
				isError = true
				if (cb) cb(err)
			}
		}
	}

	function shutdown() {
		if (Object.keys(copyObjects)) {
			var c = copyObjects
			copyObjects = {}
			copyObjectsIndex = 0
			for (var index in c) c[index].close()
		}
	}
}
