// appstate.js

var childmanager = require('./childmanager')

module.exports = {
	appState: appState,
}

var states = [ 'debug', 'run', 'stop', 'crash', 'stopping' ]
var commands = [ 'run', 'stop', 'debug', 'restart', 'nodebug' ]

function appState(childCallback, launchCommand) {
	var childManager = childmanager.childManager(childCallback, stateChange)
	var commandQueue = [] // commands affect state
	var state = 'stop'
	var lastCommand

	return {
		addValidCommands: addValidCommands,
		doCommand: doCommand,
		getState: getState,
		recover: recover,
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

	function getState() {
		return state
	}

	// add to the command queue
	// 
	// inState can also be undefined or 'crashed'
	function doCommand(command) {
		var result = addValidCommands(command)
		doNextCommand()
		return result
	}

	function doNextCommand () {
		var doMore = state != 'stopping'

		while (doMore) {
			// get the command to execute
			command = commandQueue.shift()
			if (command) { // there was something
				switch (command) {
				case 'nodebug':
					if (state == 'run') continue
					if (state == 'debug') {
						commandQueue.splice(0, 0, 'stop', 'run')
						continue
					}
					// flow through to run
				case 'run':
					if (state == 'run') continue
					if (state != 'debug') {
						// stop or crash states
						// we will now launch this app
						lastCommand = command
						childManager.launch(launchCommand)	// launch process
						break
					}
					// put run back onto the command queue
					commandQueue.unshift(command)
					// flow through to stop
				case 'stop':
					if (state == 'stop' ||
						state == 'crash') continue
					// run or debug states
					childManager.kill() // once child dies, we will continue
					break
				case 'debug':
					if (state == 'debug') continue
					if (state == 'run') {
						commandQueue.splice(0, 0, 'stop', 'debug')
						continue
					}
					// stop or crash
					lastCommand = command
					childManager.launch(launchCommand, true)	// launch process
					break
				case 'restart':
					if (state == 'stop' ||
						state == 'crash') {
						commandQueue.unshift('run')
						continue
					}
					// debug and run
					// stop, then reisssue same command
					commandQueue.splice(0, 0, 'stop', state)
					continue
				} // case
			}
			break
		} // while
	}

	function recover() {
		commandQueue.unshift(lastCommand)
	}

	// the child process recorded a state change
	function stateChange(toState) {
		state = toState
		childCallback('state', state)
		doNextCommand()
	}
}