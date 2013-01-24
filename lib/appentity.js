// appentity.js
// Manage data for one app
// © Harald Rudell 2012 MIT License

var require = require('apprunner').getRequire(require)
var pidlink = require('./pidlink')
var watchit = require('./watchit')
var watchcopy = require('./watchcopy')
var applink = require('./applink')
var cloner = require('./cloner')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.AppEntity = AppEntity

minSecondsCrashToCrash = 3
var statesWithActiveWatchers = ['run', 'debug', 'crash']

/*
Node God's front-end object to manage one app
conf: object
.name: string application name eg. 'Node.js #3'
.id: string machine-friendly name eg. 'nodejs3'
.folder: string absolute path to the app's launch folder
.state: string intial state, one of 'run', 'debug', 'stop'
.start: array of string: commands to launch app to run state
.debug: array of string: commands to launch app to debug state
.watchFiles: array of string or RegExp: files watch for app restart
.watchCopy: object, key: string absolute destination path, value: string absolute source path
.signal: boolean if app handles SIGURS2 signal
*/
function AppEntity(conf, parentData) {
	var self = this
	events.EventEmitter.call(this)
	this.update = update
	this.write = write
	this.getState = getState
	this.close = close
	var hadParentData = !!parentData
	if (!parentData) parentData = {}
	var watchers = new watchit.WatchIt(doWatcherRestart, watchNotify, conf.folder)
	var watchCopy = new watchcopy.WatchCopy(conf.id, doWatcherRestart)
	var appLink = new applink.AppLink({appId: conf.id, launchCommand: conf.start, debugCommand: conf.debug, stateNow: parentData.state})
		.on('message', AppMessageListener)
	var dashboard = {
		name: conf.name,
		id: conf.id,
		state: parentData.state || 'stop',
		lastLaunch: parentData.lastLaunch,
		url: undefined,
		exitCode: parentData.exitCode,
		lastCrash: parentData.lastCrash,
		crashCount: parentData.crashCount || 0,
		pid: parentData.pid,
		watchCount: 0,
		port: undefined,
	}
	var lastDashboard = {}
	var watchCopyCount = 0
	var watchCount = watchers.updateFiles(conf.watchFiles, conf.watchFileExclude) // init file watchers
	updateWatcherCount()

	for (var p in dashboard) lastDashboard[p] = dashboard[p]

	if (~statesWithActiveWatchers.indexOf(parentData.state)) watchers.activate()
	watchCopy.init(conf.watchCopy, watchCopyResult) // init filesystem copy watcher

	function getState() {
		return cloner.clone(dashboard)
	}

	/*
	A command received on the web socket
	data.type: run stop debug restart
	*/
	function write(command, cb) {
self.emit(new Error('UPDATE'))
		appLink.afterThat(command)
		cb()
	}

	function update(o) { // update this app's configuration
		var doWatch
		var restart
		var cbCount = 2
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
		watchCount = watchers.updateFiles(conf.watchFiles = o.watchFiles, conf.watchFileExclude = o.watchFileExclude)
		updateWatcherCount()
		watchCopy.updateCopyObject(conf.watchCopy = o.watchCopy, cb)
		cb(null, restart)

		function cb(err, restartReason, x) {
			if (!err) {
				if (typeof restartReason === 'number') {
					watchCopyCount = restartReason
					updateWatcherCount()
					restartReason = x ? 'file watchers' : null
				}
				if (restartReason) restart = restartReason
				if (!--cbCount) {
					if (restart) console.log('Restarting ' + conf.name + ' on update due to ' + restart)
					appLink.afterThat(restart ? 'restart' : conf.state)
				}
			} else self.emit('error', err)
		}
	}

	function close() {
// TODO
	}

	function watchCopyResult(err, count) {
require('haraldutil').p('watchCopy', conf.id, count)
		if (!err) {
			watchCopyCount = count
			updateWatcherCount
			if (!parentData.state) appLink.afterThat(conf.state)
			if (hadParentData && // this process had a status in master nodegod
				parentData.state === 'run' && // and it is running
				conf.signal) { // and configured to receive signals
				pidlink.getData(dashboard.pid, conf.id, pidLinkListener) // send a signal that requests url and port for the running app
			}
		} else self.emit('error', err)
	}

	function updateWatcherCount() {
		dashboard.watchCount = watchCopyCount + watchCount
		updateDashboard()
	}

	function watchitTrigger() {
		watchers.updateFiles(conf.watchFiles, conf.folder)
		doWatcherRestart()
	}

	function watchCopyTrigger() {
		watchCopy.updateCopyObject(conf.watchCopy, conf.folder, watchCopyResult)
		doWatcherRestart()
	}

	function watchCopyResult(err, restart) {
		if (err) self.emit('error', err)
	}

	// restart due to file change or copy change
	function doWatcherRestart() {
require('haraldutil').p()
		if (dashboard.state != 'stop') {
			console.log('Restarting ' + conf.name + ' due to file watch trigger')
			appLink.afterThat('restart')
		} else console.log('Watcher restart ignored in stop state')
	}

	function pidLinkListener(err, data) {
		if (!err) {
			if (data) {
				if (data.url) dashboard.url = data.url
				if (data.URL) dashboard.url = data.URL
				if (data.port) dashboard.port = data.port
				if (data.PORT) dashboard.port = data.PORT
			}
			updateDashboard()
		} else self.emit('error', err)
	}

	/*
	message from master process' appconduit
	message: object
	top-level keys: state pid lastLaunch exit lastExit
	error-message-isConfig
	*/
	function AppMessageListener(message) {
		if (message.pid) { // get these for run and debug
			dashboard.pid = message.pid
			if (message.state === 'run'&& conf.signal) pidlink.getData(dashboard.pid, conf.id, pidLinkListener)
		}
		if (message.exit) dashboard.exitCode = message.exit
		if (message.lastLaunch) dashboard.lastLaunch = message.lastLaunch
		if (message.state) {
			dashboard.state = message.state
			if (message.state === 'stop') {
				watchers.deactivate() // no restarts on file changes
				dashboard.pid = 0
			}
			if (message.state === 'crash') {
				// crash notify
				var previousCrash = dashboard.lastCrash
				dashboard.lastCrash = message.lastExit
				dashboard.crashCount++
				dashboard.pid = 0

				// crash recovery
				var doRecovery = !previousCrash // true: always retry on first crash
				if (!doRecovery) { // check duration for subsequent crashes
					var elapsed = Math.floor((dashboard.lastCrash - previousCrash) / 1000)
					doRecovery = elapsed >= minSecondsCrashToCrash
				}
				if (doRecovery) appLink.recover()
			}
			if (message.state === 'run' ||
				message.state === 'debug' ||
				message.state === 'crash') {
				watchers.activate()
			}
			updateDashboard()
		}
	}

	function watchNotify(event, filename) {
		console.log(conf.id, event, filename)
	}

	function updateDashboard() {
		var diff = dashboardDifference() // always has id and name keys
		if (Object.keys(diff).length > 2) self.emit('data', diff)
	}

	function dashboardDifference() {
		var diff = {}
		for (var p in dashboard) if (dashboard[p] !== lastDashboard[p]) lastDashboard[p] = diff[p] = dashboard[p]

		// log
		if (Object.keys(diff).length) {
			var s = ['Update', conf.id + ':']
			for (var p in diff) {
				var v = diff[p]
				if (p === 'lastCrash' || p === 'lastLaunch') v = haraldutil.getISOPacific(new Date(v))
				s.push(p + ':', v)
			}
			console.log(s.join(' '))
		}

		// front-end needs name and id
		diff.name = dashboard.name
		diff.id = dashboard.id

		return diff
	}
}
util.inherits(AppEntity, events.EventEmitter)

// compare launch commands: array of string
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
