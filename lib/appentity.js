// appentity.js

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

	// restart due to file change or copy change
	function doWatcherRestart() {
		console.log('Restarting ' + conf.name + ' due to file watch trigger')
		appState.doCommand('restart')
	}

	function childCallback(event, value) {
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
		}
	}

	function sendUpdate() {
		if (listener) listener(getState())
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