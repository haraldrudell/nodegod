// appconduit.js
// manage a child process for the ui
// © Harald Rudell 2012 MIT License

var streamlabeller = require('./streamlabeller')

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

;[
receiveFromUi, uiDisconnect, uiConnect, setLaunchData, getState,
].forEach(function (f) {exports[f.name] = f})

var time3Seconds = 3e3
var graceKillPeriod = time3Seconds
var options = {
	detached: true,
	stdio: ['ignore', 'pipe', 'pipe'],
}

var processName = 'master'
var launchTime = Date.now()
var sendToUi = noIpc
var log = console.log
var write

/*
key: string app identifier
value: object:
.app string app identifier
.created: timeval
.crashCount: number
.killMap: key: pid, value: function
.pid: number
.lastLaunch: timeval
.lastCrash: timeval
.state: string 'run' 'stop' 'stopping' 'crash'
.exitCode number
*/
var appMap = {}

function setLaunchData(opts) {
	processName = opts.processName
	launchTime = opts.masterLaunch
	log = opts.rlog.log
	write = opts.rlog.write
}

/*
Receive a command from the ui

message: object
.app: string: the app identifier the message pertains to
(.launch array of string: command and arguments)
(.debug: boolean: true if launch to debug mode)
(.kill: boolean: true to kill the child process)
(.getMap: boolean: true to send process map to ui)
(.del boolean: true to delete an app from procMap)
*/
function receiveFromUi(message) {
	var ok

	if (message.getMap) {
		sendMap()
		ok = true
	}
	if (message.app) {
		var appState = appMap[message.app]
		if (message.launch) {
			var newAppState = launchApp(message.app, appState, message.launch, message.debug)
			if (newAppState != appState) appMap[message.app] = appState = newAppState
			ok = true
		}
		if (appState) { // allow kill and del only if the app ever launched
			if (message.kill) {
				var fn = appState.killMap[appState.pid]
				if (fn) {
					fn()
					ok = true
				} else if (appState.state == 'crash') {
					appState.state = 'stop'
					sendToUi({app: appState.app, state: appState.state})
					ok = true
				}
			}
			if (message.del) {
				if (appState.state == 'debug' || appState.state == 'run') {
					for (var aPid in appState.killMap) appState.killMap[aPid]()
				}
				delete appMap[message.app]
				ok = true
			}
		}
	}
	if (!ok) sendToUi({error: 'failed', message: message})
}

/*
Launch the managed app
 proc: object
 start: string or array of string
 debug: boolean
 */
function launchApp(appName, appState, start, debug) {

	if (Array.isArray(start)) {

		// obtain appState
		if (!appState) {
			appState = {
				app: appName,
				created: Date.now(),
				crashCount: 0,
				killMap: {}
			}
		} else for (var aPid in appState.killMap) appState.killMap[aPid]()

		// launch the app
		var args = start.slice() // clone the array
		var command = args.shift() // extract command
		var child = child_process.spawn(command, args, options)
			.on('exit', childExit)
		streamlabeller.logChild(child, appName, write)
		var pid = appState.pid = child.pid
		appState.killMap[pid] = killChild
		var didKill
		var pendingKill
		var killTimer

		// update ui
		appState.lastLaunch = Date.now()
		appState.state = debug ? 'debug' : 'run'
		sendToUi({app: appName, pid: appState.pid, state: appState.state, lastLaunch: appState.lastLaunch})

	} else sendToUi({error: 'Bad launch command', isConfig: true, message: {app: appName}})

	return appState

	function killChild() {
		delete appState.killMap[pid]

		var t
		if (!didKill) {
			didKill = true
			pendingKill = true

			// update ui
			if (appState.pid == pid) {
				appState.state = 'stopping'
				sendToUi({app: appName, state: appState.state})
			}

			// attempt graceful kill (ctrl-Break)
			t = Date.now()
			killTimer = setTimeout(sigResult, graceKillPeriod)
			process.kill(pid, 'SIGINT')
		}

		function sigResult() {
			killTimer = null
			if (pendingKill) { // the process did not die
				//console.log(processName, proc.app, 'Force kill at: ' + (Date.now() - t) / 1e3)
				// now the evil sigterm
				process.kill(pid)
			}
		}
	}

	function childExit(code) {
		delete appState.killMap[pid]
		child.removeListener('exit', childExit)
		pendingKill = false
		if (killTimer) {
			clearTimeout(killTimer)
			killTimer = null
		}
		if (!didKill) appState.crashCount++
		if (appState.pid == pid) {
			appState.pid = 0
			appState.exitCode = code
			appState.lastExit = Date.now()
			appState.state = didKill ? 'stop' : 'crash'
			if (!didKill) appState.lastCrash = appState.lastExit
			sendToUi({app: appName, exit: appState.exitCode, state: appState.state, lastExit: appState.lastExit})
		}
		child = null
	}

}

function sendMap() {
	sendToUi({appMap: getMap(), launchTime: launchTime})
}

function uiConnect(f) {
	sendToUi = typeof f == 'function' ? f : noIpc
}

function uiDisconnect() {
	uiConnect(noIpc)
}

function noIpc() {
	log(processName, 'No ipc available:', Array.prototype.slice.call(arguments))
}

function  getMap(withKill) {
	var data = {}
	for (var appName in appMap) {
		var appState = appMap[appName]
		var clone = {}
		for (var p in appState) if (p != 'killMap' || withKill) clone[p] = appState[p]
		data[appName] = clone
	}
	return data
}

function getState(graceKillPeriod0, appMap0) {
	if (graceKillPeriod0 != null) graceKillPeriod = graceKillPeriod0
	var result = {map: getMap(true)}
	if (appMap0) appMap = appMap0
	return result
}