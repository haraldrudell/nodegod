// appentity.js

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
var watchit = require('./watchit')

module.exports = {
	AppEntity: AppEntity,
	eventListener: eventListener,
	setStore: setStore,
}

//
var listener = function () {}
var myStore
var states = [ 'debug', 'run', 'stop', 'crash', 'stopping' ]
var commands = [ 'run', 'stop', 'debug', 'restart', 'nodebug' ]

// min seconds between crashes
minSecondsCrashToCrash = 3

// app.state can be 'debug' 'run' 'stop' or undefined (not running)
// app.name is human readable string 'Node.js #3'
// app.id is identifier 'nodejs3'
// pid
// watching: ..

// internal
// app.child
// app.inState indicates confirmed state
// start how to start the app

function AppEntity(o) { debugger
	var self = this
	var child // child process object
	var commandQueue = [ ] // commands that affect state
	var watchFiles = o.watchFiles || [] // watch file data from json
	var folder = o.folder // base folder for this app
	var didKill // wether kill was issued to child process
	var start = o.start
	this.state = 'stop'
	this.name = o.name
	this.id = o.id
	this.crashCount = 0
	var myWatch = new watchit.WatchIt(doWatcherRestart)
	this.watchers = myWatch.updateFiles(watchFiles, folder)
	addValidCommands(o.state)

	// update this app's configuration
	this.update = function (o) {
		var doWatch
		var doRestart

		if (o.name) this.name = o.name
		if (o.start && stringOrArrayDifferent(start, o.start)) {
			start = o.start
			doRestart = true
		}
		if (o.watchFiles && o.watchFiles.length) {
			watchFiles = o.watchFiles
			doWatch = true
		}
		if (o.folder != folder) {
			folder = o.folder
			doWatch = true
			doRestart = true
		}
		if (doWatch) this.watchers = myWatch.updateFiles(watchFiles, folder)
		if (doRestart) addValidCommands('restart')
		this.doCommand(o.state)
	}

	// add to the command queue
	// 
	// inState can also be undefined or 'crashed'
	this.doCommand = function (command) {
		var result = addValidCommands(command)
		doNextCommand()
		return result
	}

	function doNextCommand () {
		var doMore = self.state != 'stopping'

		while (doMore) {
			// get the command to execute
			command = commandQueue.shift()
			if (command) { // there was something
				switch (command) {
				case 'nodebug':
					if (self.state == 'run') continue
					if (self.state == 'debug') {
						commandQueue.splice(0, 0, 'stop', 'run')
						continue
					}
					// flow through to run
				case 'run':
					if (self.state == 'run') continue
					if (self.state != 'debug') {
						// stop or crash states
						// we will now launch this app
						myWatch.activate() // activate watching of files
						launchChild()	// launch process
						break
					}
					// put run back onto the command queue
					commandQueue.unshift(command)
					// flow through to stop
				case 'stop':
					if (self.state == 'stop' ||
						self.state == 'crash') continue
					// run or debug states
					killChild() // once child dies, we will continue
					break
				case 'debug':
					if (self.state == 'debug') continue
					if (self.state == 'run') {
						commandQueue.splice(0, 0, 'stop', 'debug')
						continue
					}
					// stop or crash
					launchChild(true)	// launch process
					break
				case 'restart':
					if (self.state == 'stop' ||
						self.state == 'crash') {
						commandQueue.unshift('run')
						continue
					}
					// debug and run
					// stop, then reisssue same command
					commandQueue.splice(0, 0, 'stop', self.state)
					continue
				} // case
			}
			break
		} // while
	}

	// the child process recorded a state change
	function stateChange(toState) {

		switch (toState) {
		case 'crash':

			// crash notify
			var lastCrash = self.lastCrash
			self.lastCrash = Date.now()
			self.crashCount++
			var lastState = self.state
			self.state = toState
			listener(self, true)

			// crash recovery
			var doRecovery = lastCrash == null
			if (!doRecovery) {
				var elapsed = Math.floor((self.lastCrash - lastCrash) / 1000)
				doRecovery = elapsed >= minSecondsCrashToCrash
			}
			if (doRecovery) {
				// force run or debug again
				// push the state as a command onto the command queue
				commandQueue.unshift(lastState)
			}

			// two quick subsequent crashes
			// we are still watching, so a file write will relaunch
			// otherwise, give up for now
			break
		case 'run':
		case 'debug':
			// record launch time
			self.lastLaunch = Date.now()
			// flow into notify
		case 'stop':
		case 'stopping':
			self.state = toState
			listener(self)
		}

		doNextCommand()					
	}

	function doWatcherRestart() {
		self.doCommand('restart')
	}

	function launchChild(debug) {
		var args = Array.isArray(start) ? start : start.split(' ')
		if (debug) args.unshift('--debug-brk')
		didKill = false
		child = child_process.spawn('node', args)
		self.pid = child.pid
		if (myStore) {
			myStore.pids[self.id] = child.pid
			myStore.save()
		}
		child.stdout.on('data', function (data) {
			// data is Buffer

			console.log(self.id, data.slice(0, -1))
		})
		child.stderr.on('data', function (data) {
			// data is Buffer
			console.log(self.id, data.slice(0, -1))
		})
		child.on('exit', function (code) {
			// code is number
			console.log(self.id + ' exit:', code)
			if (myStore) {
				delete myStore.pids[self.id]
				myStore.save()
			}
			self.pid = 0
			self.exitCode = code
			if (didKill) {
				// we killed the process
				// next state is stop
				myWatch.deactivate()
			}
			// notify
			stateChange(didKill ? 'stop' : 'crash')
		})
		child.stderr.setEncoding('utf-8')
		child.stdout.setEncoding('utf-8')

		stateChange(debug ? 'debug' : 'run')
	}

	function killChild() {
		if (child && child.pid && !didKill) {
			didKill = true
			process.kill(child.pid)
			stateChange('stopping')
		}
	}

	// true: command was valid
	// false: bad command
	function addValidCommands(command) {
		var result = false
		if (command && commands.indexOf(command) != -1) {
			result = true
			commandQueue.push(command)
		}
		return result
	}

}

function stringOrArrayDifferent(o, o1) {
	var different = false
	if (o != o1) {
		if (Array.isArray(o) && Array.isArray(o1) &&
			o.length == o1.length) {
			// two arrays of the same length: examine elements
			// loop until true is returned
			different = o.some(function(element, index) {
				return element != o1[index]
			})
		} else different = true
	}
	return different
}

function isObject(o) {
	return o != null && typeof o.valueOf() == 'object'
}

// receive function for pushing model updates to clients
function eventListener(func) {
	listener = func
}

function setStore(store) {
	myStore = store
	if (store.pids) for (var app in store.pids) {
		var pid = myStore.pids[app]
		try {
			process.kill(pid)
			console.log('Killed app %s pid %s',
				app, pid)
		} catch (e) {}
	}
	store.pids = {}
}