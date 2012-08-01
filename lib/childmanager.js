// childmanager.js

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

module.exports = {
	childManager: childManager,
}

function childManager(cb, stateChange) {
	var child
	var didKill

	return {
		launch: launch,
		kill: kill,
	}

	function launch(start, debug) {
		var args = Array.isArray(start) ? start : start.split(' ')
		if (debug) args.unshift('--debug-brk')
		didKill = false
		child = child_process.spawn('node', args)
		cb('pid', child.pid)
		child.stdout.on('data', log)
		child.stderr.on('data', log)
		child.on('exit', function (code) {
			child = null
			// code is number
			cb('exit', code)
			stateChange(didKill ? 'stop' : 'crash')
		})
		child.stderr.setEncoding('utf-8')
		child.stdout.setEncoding('utf-8')
		stateChange(debug ? 'debug' : 'run')
	}

	function kill() {
		if (child && child.pid && !didKill) {
			didKill = true
			process.kill(child.pid)
			stateChange('stopping')
		}
	}

	function log(string) {
		cb('childLog', string.slice(0, -1))
	}
}