// masterlauncher.js
// Launch master process and display output
// © Harald Rudell 2013 MIT License

require = require('apprunner').getRequire(require, exports, {
	api: require('apprunner').getAppData().appName, initApi: initApi,
	ready: false})

var parentipc = require('./parentipc')
var listenermanager = require('./listenermanager')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')

var spawnOptions = {
	detached: true,
	stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
}

var log = console.log

function initApi(opts) {
	var lm = new listenermanager.ListenerManager
	var didStdinResume
	var isShutdown

	// launch and detach from child process
	var child = child_process.spawn(opts.spawn.file, opts.spawn.args, spawnOptions)
	var childPid = child.pid
	child.unref()

	// connect to child ipc
	var parentIpc = new parentipc.ParentIpc(child)
	child = null
	if (parentIpc.readable) {
		lm.addListener(parentIpc, 'on', 'data', process.stdout.write.bind(process.stdout))
		lm.addListener(parentIpc, 'once', 'end', ipcEndListener)
		lm.addListener(parentIpc, 'on', 'error', ipcErrorListener)
		lm.addListener(process.stdin, 'on', 'data', stdinDataListener)
		parentIpc.resume()
		didStdinResume = true
		process.stdin.resume()
		log('Launcher:', process.pid, ' master:', childPid, ' Press Enter to end display.')
	} else shutdown('Fatal: ipc link to child process: ' + childPid + ' missing.')

	function ipcEndListener() {
		shutdown('End of data')
	}
	function ipcErrorListener(err) {
		shutdown('Pipe read error: ' + err)
	}
	function stdinDataListener(data) {
		shutdown('Keystroke received: exiting')
	}

	function shutdown(s) {
		log(s)
		if (!isShutdown) {
			isShutdown = true
			if (didStdinResume) {
				didStdinResume = false
				process.stdin.pause()
			}
			parentIpc.destroy(exit)
		}
	}

	function exit(err) {
		if (err) log('Error shutting down ipc channel:', err)
		parentIpc = null
		if (lm) {
			lm.removeListeners()
			lm = null
		}
		apprunner.shutdown()
	}
}
