// childmanager.js
// manage a child process
// © Harald Rudell 2012

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

module.exports = {
	childManager: childManager,
}

/*
returns an object that can launch child processes
cb(pid): function receiving info
- 'pid' number: process id
- 'exit' number: exit code
- 'childLog' string: child output to stdout or stderr
statechange(state): function receiving string state names
*/
function childManager(cb, stateChange) {
	var child
	var didKill
	var pendingKill
	var killTimer

	return {
		launch: launch,
		kill: kill,
	}

	function launch(start, debug) {
		var args = Array.isArray(start) ? start : start.split(' ')
		if (debug) args.unshift('--debug-brk')
		didKill = false
		child = child_process.spawn('node', args)
		cb('pid', child.pid, debug)
		child.stdout.on('data', log)
		child.stderr.on('data', log)
		child.on('exit', function (code) {
			child = null
			pendingKill = false
			// code is number
			cb('exit', code)
			stateChange(didKill ? 'stop' : 'crash')
		})
		child.stderr.setEncoding('utf-8')
		child.stdout.setEncoding('utf-8')
		stateChange(debug ? 'debug' : 'run')
	}

	function kill() {
		var t
		if (child && child.pid && !didKill) {
			didKill = true
			pendingKill = true
			stateChange('stopping')
			t = Date.now()
			setTimeout(sigResult, 3000)
			// try the nice sigint first (ctrl-break)
			process.kill(child.pid, 'SIGINT')
		}

		function sigResult() {
			killTimer = null
			if (pendingKill) {
				cb('childLog', 'Force kill at: ' + (Date.now() - t) / 1e3)
				// now the evil sigterm
				process.kill(child.pid)
			}
		}
	}

	function log(string) {
		cb('childLog', string.slice(0, -1))
	}
}