// uimanager.js
// manages the ui process lifecycle and connects it with appconduit
// © Harald Rudell 2012

var appconduit = require('./appconduit')
var logger = require('./logger')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// http://nodejs.org/api/path.html
var path = require('path')

exports.interMasterSignalHandler = interMasterSignalHandler
exports.launchUi = launchUi

var time3Seconds = 3e3
var command = 'node'

var minChildDurationForRelaunch = time3Seconds
var timeToSigkill = time3Seconds
var interMasterSignalFn

/*
Launch and relaunch the webserver process
processName: string: name and process id for this process: 'nodegod:45'
uiModulename: string: name of .js file in same folder as the master script eg. 'webprocess'
*/
function launchUi(processName, uiModuleName) {
	var masterLaunch = Date.now()
	var launchFile = path.join(path.dirname(require && require.main && require.main.filename), uiModuleName)
	var currentUiPid
	var killFnMap = {}

	interMasterSignalFn = interMasterReceiver
	process.on('SIGINT', interMasterReceiver)
	appconduit.setLaunchData(processName, masterLaunch)
	launchWebProcess()

	function launchWebProcess() {
		var child
		var pid
		var uiLaunch

		try {
			// launch child process connected to appconduit
			child = child_process.spawn(command, [launchFile], {
				stdio: ['ignore', 'pipe', 'pipe', 'ipc']
			}).on('exit', uiExit)
				.on('message', appconduit.receiveFromUi)
				.on('disconnect', childDisconnect)
			// child.send is a function if this node.js supports ipc
			if (!child.send) throw new Error('ipc not available try node 0.8.9 or later')
			logger.addLogging(child, 'ui')
			appconduit.uiConnect(child.send.bind(child))
			pid = currentUiPid = child.pid
			uiLaunch = Date.now()
			killFnMap[pid] = killUi
			console.log(processName, 'ui:' + pid, 'launched at', new Date(uiLaunch).toISOString())
		} catch (e) {
			console.log(processName, arguments.callee.name, 'Exception:', e.message)
			restart()
		}

		var killTimer
		var didKill
		function killUi() {
			try {
				delete killFnMap[pid]
				didKill = true
				child.disconnect()

				// attempt graceful kill (ctrl-Break)
				killTimer = setTimeout(sigResult, timeToSigkill)
				process.kill(pid, 'SIGINT')
			} catch (e) {
				console.log(processName, arguments.callee.name, 'Exception:', e.message)
				restart()
			}

			function sigResult() {
				try {
					killTimer = null
					// now the evil sigterm
					process.kill(pid)
				} catch (e) {
					console.log(processName, arguments.callee.name, 'Exception:', e.message)
					restart()
				}
			}
		}

		function uiExit(exitCode) {
			try {
				delete killFnMap[pid]
				child.removeListener('exit', uiExit)
				if (killTimer) {
					clearTimeout(killTimer)
					killTimer = null
				}
				console.log(processName, 'ui:', pid, didKill ? 'relaunched' : 'crashed', 'exit code:', exitCode)

				// relaunch child as appropriate
				var elapsed = Date.now() - uiLaunch
				if (elapsed >= minChildDurationForRelaunch) process.nextTick(launchWebserverProcess)
				else console.log(processName, 'ui:', pid, 'fatal: child is crahsed after only', elapsed / 1e3, 's')
			} catch (e) {
				console.log(processName, arguments.callee.name, 'Exception:', e.message)
				restart()
			}
		}

		function childDisconnect() {
			child.removeListener('disconnect', childDisconnect)
			appconduit.uiDisconnect
		}
	}

	function restart() {
		for (var uiPid in killFnMap) if (killFnMap[uiPid]) killFnMap[uiPid]()
		process.nextTick(launchWebProcess)
	}

	// when we receive a signal from another master, we restart the ui
	function interMasterReceiver() {
		console.log(processName, 'received signal, relaunching ui:' + currentUiPid)
		var fn = killFnMap[currentUiPid]
		if (fn) fn()
		launchWebProcess()
	}
}

// signal receiver from another candidate master process
function interMasterSignalHandler() {
	if (typeof interMasterSignalFn == 'function') interMasterSignalFn.apply(this, Array.prototype.slice.call(arguments))
}