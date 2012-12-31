// appconduit.js
// manage a child process for the ui
// © Harald Rudell 2012

var logger = require('./logger')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

exports.receiveFromUi = receiveFromUi
exports.uiDisconnect = uiDisconnect
exports.uiConnect = uiConnect
exports.setLaunchData = setLaunchData

var time3Seconds = 3e3
var graceKillPeriod = time3Seconds
var command = 'node'
var debugArg = '--debug-brk'
var options = ['ignore', 'pipe', 'pipe']

var processName = 'master'
var launchTime = Date.now()
var sendToUi = noIpc

/*
key: string app identifier
value: object:
.app string app identifier
.created: timeval
.crashCount: number
.killMap: key: pid, value: function
.pid: number
.lastLaunch: timeval
.state: string 'run' 'stop' 'stopping' 'crash'
.exitCode number
*/
var appMap = {}

function setLaunchData(processName0, masterLaunch) {
	processName = processName0
	launchTime = masterLaunch
	console.log(processName, 'appconduit still using console.log')
}

/*
Receive a command from the ui

message: object
.app: string: the app identifier the message pertains to
(.launch string or array of string: command line arguments)
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
		if (appState) {
			if (message.kill) {
				var fn = appState.killMap[appState.pid]
				if (fn) {
					fn()
					ok = true
				}
			}
			if (message.del) {
				if (proc.state.state == 'debug' || proc.state.state == 'run') killApp(proc)
				delete childMap[message.app]
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

	// obtain appState
	if (!appState) {
		appState = {
			app: appName,
			created: Date.now(),
			crashCount: 0,
			killMap: {}
		}
	} else if (appState.killFn) appState.killFn()

	// launch the app
	var args = Array.isArray(start) ? start : start.split(' ')
	if (debug) args.unshift(debugArg)
	var cleanUpCounter = 3
	var child = child_process.spawn(command, args, options)
		.on('exit', childExit)
	logger.addLogging(child, appName)
	var pid = appState.pid = child.pid
	appState.killMap[pid] = killChild
	var didKill
	var pendingKill
	var killTimer

	// update ui
	appState.lastLaunch = Date.now()
	appState.state = debug ? 'debug' : 'run'
	sendToUi({app: appName, pid: appState.pid, state: appState.state, lastLaunch:appState.lastLaunch})

	return appState

	function killChild() {
		delete appState.killFn[pid]

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
		delete appState.killFn[pid]
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
			sendToUi({app: proc.app, exit: proc.exitCode, state: proc.state.state, lastExit: appState.lastExit})
		}
		child = null
	}

}

function sendMap() {
	var data = {}
	for (var appName in childMap) {
		var appState = childMap[appName]
		var clone = {}
		for (var p in appState) if (p != 'killMap') clone[p] = appState[p]
		data[appName] = clone
	}
	sendToUi({appMap: data, launchTime: launchTime, pid: pid})
}

function uiConnect(f) {
	sendToUi = typeof f == 'function' ? f : noIpc
}

function uiDisconnect() {
	uiConnect(noIpc)
}

function noIpc() {
	console.log(processName, 'No ipc available:', Array.prototype.slice.call(arguments))
}