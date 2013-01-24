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
	this.shutdown = shutdown
	this.updateCopyObject = updateCopyObject
	var copyObjectsIndex = 0
	var copyObjects = {}
	var graceTimeMs = 3000
	var timer
	var isError

	/*
	copyObject: object
	- key: string absolute path destination
	- value: string absolute path source
	cb(err): function
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
	an instance is identified by to and from
	add and do copy for any new instances
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

	function returnCount(cb, x) {
		var count = 0
		for (var index in copyObjects) count += copyObjects[index].getCount()
		cb(null, count, x)
	}

	function watchFunc(event, filename) {
		console.log(arguments.callee.name, id, event, filename)
		if (!timer) timer = setTimeout(action, graceTimeMs)
	}

	function action() {
		timer = null
		var count = final(actionDone)

		// because files might have been added, copy everything
		copyObjects.forEach(function (instance) {
			closeWatchers(instance)
			doCopy(instance, count, watchFunc)
		})
		count.dec()
	}

	function actionDone(err) {
		if (err) throw err
		else notifyFn()
	}

	// false: not found
	// number: index in copy
	function getIndex(instance) {
		var result = false
		copyObjects.some(function (copyInstance, index) {
			var found = copyInstance &&
				instance.to == copyInstance.to &&
				instance.from == copyInstance.from
			if (found) result = index
			return found
		})
		return result
	}
}
