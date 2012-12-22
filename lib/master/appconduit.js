// appconduit.js
// manage a child process for the ui
// © Harald Rudell 2012

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

exports.receiveFromUi = receiveFromUi
exports.setSend = setSend

var time3Seconds = 3e3
var graceKillPeriod = time3Seconds

var processName = 'master'

var sendToUi
setSend() // sets send to badSend

var childMap = {}

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
	if (message.app) {

		// get proc
		var proc = childMap[message.app]
		if (!proc) {
			childMap[message.app] = proc = {app: message.app}
		}

		// execute commands
		if (message.launch) {
			launchApp(proc, message.launch, message.debug)
			ok = true
		} else if (message.kill) {
			killApp(proc)
			ok = true
		} else if (message.getMap) {
			sendMap()
			ok = true
		} else if (message.del) {
			delete childMap[message.app]
			ok = true
		}
	}
	if (!ok) console.log(processName, 'Bad message', message)
}

function launchApp(proc, start, debug) {

	// get arguments for node
	var args = Array.isArray(start) ? start : start.split(' ')
	if (debug) args.unshift('--debug-brk')

	// launch app child process
	proc.didKill = false
	proc.child = child_process.spawn('node', args)
	var thisPid = proc.child.pid
	sendToUi({app: proc.app, pid: proc.child.pid, debug: debug})

	// add app process listeners
	proc.child.stdout.on('data', log)
	proc.child.stderr.on('data', log)
	proc.child.on('exit', function (code) {
		var isCurrent = !proc.child || proc.child.pid == thisPid // make sure we did not already relaunch
		if (isCurrent) {
			proc.child = null
			proc.pendingKill = false
			if (proc.killTimer) {
				clearTimeout(proc.killTimer)
				proc.killTimer = null
			}

			// update state, code is number
			sendToUi({app: proc.app, exit: code, state: (proc.didKill ? 'stop' : 'crash')})
		}
	})
	proc.child.stderr.setEncoding('utf-8')
	proc.child.stdout.setEncoding('utf-8')

	// update state
	sendToUi({app: proc.app, state: (debug ? 'debug' : 'run')})

	function log(string) {
		console.log(proc.app, string.slice(0, -1))
	}
}

// kill a possible app child process
function killApp(proc) {
	var t
	if (proc.child && proc.child.pid && !proc.didKill) {
		proc.didKill = true
		proc.pendingKill = true

		// update app state
		sendToUi({app: proc.app, state: 'stopping'})

		// attempt graceful kill (ctrl-Break)
		t = Date.now()
		proc.killTimer = setTimeout(sigResult, graceKillPeriod)
		// try the nice sigint first (ctrl-break)
		process.kill(proc.child.pid, 'SIGINT')
	}

	function sigResult() {
		proc.killTimer = null
		if (proc.pendingKill) { // the process did not die
			console.log(marker, proc.app, 'Force kill at: ' + (Date.now() - t) / 1e3)
			// now the evil sigterm
			process.kill(proc.child.pid)
		}
	}
}

function sendMap() {
	var data = {}
	for (var i in childMap) {
		var pid
		var child = childMap[i].child
		if (child && child.pid) pid = child.pid
		data[i] = pid
	}
	sendToUi({map: data})
}

function setSend(f, processName0) {
	sendToUi = typeof f == 'function' ? f : badSend
	if (processName0)  processName = processName0

	function badSend() {
		console.log(processName, 'No ipc available:', Array.prototype.slice.call(arguments))
	}
}