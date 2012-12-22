// manager.js
// manage a child process for the ui
// © Harald Rudell 2012

exports.receiver = receiver
exports.setSend = setSend

var send
var marker = 'master'
setSend()

var childMap = {}

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

function launch(proc, start, debug) {
	var args = Array.isArray(start) ? start : start.split(' ')
	if (debug) args.unshift('--debug-brk')
	proc.didKill = false
	proc.child = child_process.spawn('node', args)
	var thisPid = proc.child.pid
	send({app: proc.app, pid: proc.child.pid, debug: debug})
	proc.child.stdout.on('data', log)
	proc.child.stderr.on('data', log)
	proc.child.on('exit', function (code) {
		var isCurrent = !proc.child || proc.child.pid == thisPid
		if (isCurrent) {
			proc.child = null
			proc.pendingKill = false
			// code is number
			send({app: proc.app, exit: code, state: (proc.didKill ? 'stop' : 'crash')})
		}
	})
	proc.child.stderr.setEncoding('utf-8')
	proc.child.stdout.setEncoding('utf-8')
	send({app: proc.app, state: (debug ? 'debug' : 'run')})

	function log(string) {
		console.log(proc.app, string.slice(0, -1))
	}
}

function kill(proc) {
	var t
	if (proc.child && proc.child.pid && !proc.didKill) {
		proc.didKill = true
		proc.pendingKill = true
		send({app: proc.app, state: 'stopping'})
		t = Date.now()
		setTimeout(sigResult, 3000)
		// try the nice sigint first (ctrl-break)
		process.kill(proc.child.pid, 'SIGINT')
	}

	function sigResult() {
		proc.killTimer = null
		if (proc.pendingKill) {
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
	send({map: data})
}

function receiver(message) {
	var ok
	if (message.app) {
		var proc = childMap[message.app]
		if (!proc) {
			childMap[message.app] = proc = {app: message.app}
		}
		if (message.launch) {
			launch(proc, message.launch, message.debug)
			ok = true
		} else if (message.kill) {
			kill(proc)
			ok = true
		} else if (message.getMap) {
			sendMap()
			ok = true
		} else if (message.del) {
			delete childMap[message.app]
		}
	}
	if (!ok) console.log(marker, 'Bad message', message)
}

function setSend(f, marker0) {
	send = typeof f == 'function' ? f : badSend
	if (marker0)  marker = marker0

	function badSend() {
		console.log(marker, 'No ipc available:', Array.prototype.slice.call(arguments))
	}
}