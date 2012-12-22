// uimanager.js
// manages the ui process
// © Harald Rudell 2012

var manager = require('./manager')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// http://nodejs.org/api/path.html
var path = require('path')

exports.signalHandler = signalHandler
exports.launchUi = launchUi

var time3Seconds = 3e3
var minElapsed = time3Seconds
var timeToSigkill = time3Seconds
var signalFunc

function launchUi(id, appFolder) {
	var masterLaunch = Date.now()
	var launchFile = path.join(appFolder, 'webprocess')
	var child
	var socket
	var childPid
	var childLaunch
	var pendingKill
	signalFunc = signalReceiver
	launchChild()

	function launchChild() {
		child = child_process.spawn('node', [launchFile], {
			stdio: [0, 1, 2, 'ipc']
		})
			.on('exit', uiExit)
			.on('message', manager.receiver, id)
		if (!child.send) throw new Error('ipc not available try node 0.8.9 or later')
		manager.setSend(child.send.bind(child))
		childLaunch = Date.now()
		socket = child.stdio[3]
		childPid = child.pid
		console.log(id, 'ui:', childPid, 'launched at', new Date(childLaunch))
	}

	function uiExit(exitCode, handle) {
		console.log(id, 'ui:', childPid, 'exit code:', exitCode)
		if (socket) {
			socket.destroy()
			socket = null
		}
		child = null
		pendingKill = null
		var elapsed = Date.now() - childLaunch
		if (elapsed >= minElapsed) launchChild()
		else console.log(id, 'child is crahsed after ' + (elapsed / 1e3) + ' s')
	}

	function signalReceiver() {
		console.log(id, 'stopping ui:', childPid)
		if (child && !pendingKill) {
			pendingKill = true
			process.kill(childPid, 'SIGINT')
			setTimeout(sendSigkill, timeToSigkill)
		} else if (!child) launchChild()
	}

	function sendSigkill() {
		if (pendingKill && child) {
			console.log(id, 'killing ui:', childPid)
			process.kill(childPid)
		}
	}
}

function signalHandler() {
	if (typeof signalFunc == 'function') signalFunc.apply(this, Array.prototype.slice.call(arguments))
}