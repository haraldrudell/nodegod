// appentity.js
// © Harald Rudell 2012

var requesturl = require('apprunner').getApi({api: 'requesturl'})
var watchit = require('./watchit')
var watchcopy = require('./watchcopy')
var appstate = require('./appstate')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	AppEntity: AppEntity,
	eventListener: eventListener,
	setStore: setStore,
}

var listener
var myStore

// min seconds between crashes
minSecondsCrashToCrash = 3

// constructor
// conf object that the created object takes over
// .name: string application name eg. 'Node.js #3'
// .id: string machine-friendly name eg. 'nodejs3'
// .folder: string fully qualified path to this app's folder
// .start: string or array of string: command to launch this app eg '.../app.js'
// .watchFiles
// .watchCopy: key: to file or folder, value: from file or folder, may be relative to conf.folder
// .state
function AppEntity(conf) {
	var crashCount = 0
	var exitCode
	var appState = appstate.appState(childCallback, conf.start)
	var lastLaunch
	var lastCrash
	var pid
	var webInfo = {
		PORT: 0,
		URL: '',
	}
	var lastState = {}

	// init file watchers
	var myWatch = new watchit.WatchIt(doWatcherRestart, watchNotify)
	myWatch.updateFiles(conf.watchFiles || [], conf.folder)

	// init filesystem copy watcher
	var watchCopy = watchcopy.watchCopy(conf.id)
	watchCopy.init(conf.watchCopy || {}, conf.folder, doWatcherRestart, function (err) {
		if (err) throw err
		appState.doCommand(conf.state)
	})

	return {
		update: update,
		doCommand: appState.doCommand,
		getState: getState,
	}

	// update this app's configuration
	function update(o) {
		var doWatch
		var restart
		var count = 0
		conf.signal = o.signal

		conf.name = o.name
		if (stringOrArrayDifferent(conf.start, o.start)) {
			conf.start = o.start
			restart = 'start command change'
		}
		if (o.folder != conf.folder) {
			conf.folder = o.folder
			restart = 'folder change'
		}
		myWatch.updateFiles(conf.watchFiles = o.watchFiles, conf.folder)
		watchCopy.updateCopyObject(conf.watchCopy = o.watchCopy || {}, conf.folder, cb)
		cb(null, restart)

		function cb(err, restartReason) {
			if (err) throw err
			if (restartReason) restart = restartReason
			if (++count == 2) {
				if (restart) console.log('Restarting ' + conf.name + ' on update due to ' + restart)
				appState.doCommand(restart ? 'restart' : conf.state)
			}
		}
	}

	function watchitTrigger() {
		myWatch.updateFiles(conf.watchFiles, conf.folder)
		doWatcherRestart()
	}

	function watchCopyTrigger() {
		watchCopy.updateCopyObject(conf.watchCopy, conf.folder, function (err, restart) {
			if (err) throw err // TODO fix
		})
		doWatcherRestart()
	}

	// restart due to file change or copy change
	function doWatcherRestart() {
		console.log('Restarting ' + conf.name + ' due to file watch trigger')
		appState.doCommand('restart')
	}

	function webInfoCb(err, data) {
		if (!err) {
			if (!isSame(webInfo, data)) {
				webInfo = data
				sendUpdate()
			}
		} else console.error(err) // TODO
	}

	function isSame(o1, o2) {
		var t1 = typeof o1
		var same = t1 == typeof o2
		if (same && t1 == 'object') {
			var keys = Object.keys(o1)
			var same = keys.length == Object.keys(o2).length
			if (same) {
				same = keys.every(function (prop) {
					return o1[prop] == o2[prop]
				})
			}
		}
		return same
	}

	function childCallback(event, value, val2) {
		switch (event) {
		case 'exit':
			exitCode = value
			value = 0
		case 'pid':
			pid = value
			var write = true
			if (myStore) {
				if (pid) myStore.pids[conf.id] = pid
				else if (typeof myStore.pids[conf.id] == 'number') delete myStore.pids[conf.id]
				else write = false
				if (write) myStore.save()		
			}
			if (pid && !val2 && conf.signal) requesturl.requestUrl(pid, webInfoCb)
			break
		case 'state':
			switch (value) {
			case 'stop': // child process was intentionally stopped
				myWatch.deactivate() // no restarts on file changes
			case 'stopping':
				break
			case 'run':
			case 'debug':
				lastLaunch = Date.now()
				myWatch.activate() // activate watching of files
				break
			case 'crash':
				// crash notify
				var previousCrash = lastCrash
				lastCrash = Date.now()
				crashCount++

				// crash recovery
				var doRecovery = !previousCrash
				if (!doRecovery) {
					var elapsed = Math.floor((previousCrash - lastCrash) / 1000)
					doRecovery = elapsed >= minSecondsCrashToCrash
				}
				if (doRecovery) appState.recover()
				break
			default:
				throw Error('Bad state:' + value)
			}
			sendUpdate()
			break
		case 'childLog':
			console.log(conf.id, value)
			break
		default:
			throw Error('Bad event:' + event)
		}
	}

	function watchNotify(event, filename) {
		console.log(conf.id, event, filename)
	}

	function getState() {
		return {
			state: appState.getState(),
			name: conf.name,
			id: conf.id,
			crashCount: crashCount,
			lastLaunch: lastLaunch,
			lastCrash: lastCrash,
			exitCode: exitCode,
			pid: pid,
			watchers: myWatch.getCount(),
			port: webInfo && webInfo.PORT || 0,
			url: webInfo && webInfo.URL || '',
		}
	}

	function sendUpdate() {
		var state = logDifference(getState())
		if (listener) listener(state)
	}

	function logDifference(state) {
		var s = ['Update', state.name + ':']
		for (var p in state) if (state[p] != lastState[p]) s.push(p + ':', state[p])
		console.log(s.join(' '))
		return lastState = state
	}
}

// compare launch commands
// arguments are either string or array
function stringOrArrayDifferent(o, o1) {
	var different = false

	// check if same
	// note: two arrays will not be same even if values are same
	if (o != o1) {
		if (Array.isArray(o) && Array.isArray(o1) &&
			o.length == o1.length) {

			// two arrays of the same length: examine elements
			// loop until true is returned
			different = o.some(function(element, index) {
				return element != o1[index]
			})
		} else different = true
	}
	return different
}

// receive function for pushing model updates to clients
function eventListener(func) {
	listener = func
}

// store that can possibly have previously monitored pids
function setStore(store) {
	myStore = store
	for (var app in store.pids) {
		var pid = myStore.pids[app]
		try {
			process.kill(pid)
			console.log('Killed app %s pid %s',
				app, pid)
		} catch (e) {}
	}
	store.pids = {}
}