// uimanager.js
// manages the ui process lifecycle and connects it with appconduit
// © Harald Rudell 2012

var appconduit = require('./appconduit')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// http://nodejs.org/api/path.html
var path = require('path')

exports.interMasterSignalHandler = interMasterSignalHandler
exports.launchUi = launchUi

var time3Seconds = 3e3
var minChildDurationForRelaunch = time3Seconds
var timeToSigkill = time3Seconds
var interMasterSignalFn

/*
Launch the webserver process

processName: string: name and process id for this process: 'nodegod:45'
appFolder
*/
function launchUi(processName, uiModuleName) {
	var masterLaunch = Date.now()
	var launchFile = path.join(path.dirname(require && require.main && require.main.filename), uiModuleName)
	var child
	var ipcSocket
	var childPid
	var childLaunch
	var pendingKill
	var killTimer

	interMasterSignalFn = interMasterReceiver
	launchWebserverProcess()

	function launchWebserverProcess() {

		// launch child process with listeners
		child = child_process.spawn('node', [launchFile], {
			stdio: [0, 1, 2, 'ipc']
		})
			.on('exit', uiExit)
			.on('message', appconduit.receiveFromUi)

		// connect child process with appconduit
		// child.send is a function if this node.js supports ipc
		if (!child.send) throw new Error('ipc not available try node 0.8.9 or later')
		appconduit.setSend(child.send.bind(child), processName)

		// get child info
		childLaunch = Date.now()
		ipcSocket = child.stdio[3]
		childPid = child.pid
		console.log(processName, 'ui:' + childPid, 'launched at', new Date(childLaunch).toISOString())
	}

	function uiExit(exitCode, handle) {
		console.log(processName, 'ui:' + childPid, 'exit code:', exitCode)

		// clean up the child process that died
		appconduit.setSend()
		if (ipcSocket) {
			ipcSocket.destroy()
			ipcSocket = null
		}
		child = null
		pendingKill = null
		if (killTimer) {
			clearTimeout(killTimer)
			killTimer = null
		}

		// relaunch child as appropriate
		var elapsed = Date.now() - childLaunch
		if (elapsed >= minChildDurationForRelaunch) launchWebserverProcess()
		else console.log(processName, 'fatal: child is crahsed after ' + (elapsed / 1e3) + ' s')
	}

	// when we receive a signal from another master, we restart the ui
	function interMasterReceiver() {
		console.log(processName, 'stopping ui:' + childPid)
		if (child && !pendingKill) {
			pendingKill = true
			process.kill(childPid, 'SIGINT')
			killTimer = setTimeout(sendSigkill, timeToSigkill)
		} else if (!child) launchChild()
	}

	function sendSigkill() {
		if (pendingKill && child) {
			killTimer = null
			console.log(processName, 'killing ui:' + childPid)
			process.kill(childPid)
		}
	}
}

/*
This process receives a signal from another candidate master process
*/
function interMasterSignalHandler() {
	if (typeof interMasterSignalFn == 'function') interMasterSignalFn.apply(this, Array.prototype.slice.call(arguments))
}