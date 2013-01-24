// commandqueue.js
// Connect AppEntity objects with the master process
// © Harald Rudell 2012 MIT License

var masterlink = require('./masterlink')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.AppLink = AppLink

var states = [ 'debug', 'run', 'stop', 'crash', 'stopping' ]
var commands = [ 'run', 'stop', 'debug', 'restart', 'nodebug' ]
var defaultDebug = '--debug-brk'

closeFns = []
appMessageReceivers = {} // key: app id, value: function

var master = masterlink.on('message', receiver)

/*
Maintain ui-side app state
opts: object
.appId: string eg. 'nodejs3'
.launchCommand: array of string, first element executable then arguments
.debugCommand: array of string, first element executable then arguments
.stateNow: optional string: known previous app state if not 'stop'
*/
function AppLink(opts) {
	var self = this
	events.EventEmitter.call(this)
	this.afterThat = afterThat
	this.recover = recover
	this.close = close
	var commandQueue = [] // commands affect state
	var state = opts.stateNow || 'stop'
	var lastRunOrDebug = opts.stateNow === 'debug' ? 'debug' : 'run'
	var appId = opts.appId

	appMessageReceivers[appId] = masterMessage
	closeFns.push(this.close)

	function afterThat(command) { // add a command to the queue
		var result = addValidCommands(command)
		doNextCommand()
		return result
	}

	function recover() {
		commandQueue.unshift(lastRunOrDebug)
	}

	function masterMessage(message) {
		if (message.state) { // a state change from the process
			state = message.state
			doNextCommand()
		}
		self.emit('message', message) // send to AppEntity
	}

	function close() {
		appMessageReceivers[opts.appId]
	}

	// true: command was valid, false: bad command
	function addValidCommands(command) {
		var result = false
		if (command && commands.indexOf(command) != -1) {
			result = true
			commandQueue.push(command)
		}
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
						lastRunOrDebug = command
						master.write({app: appId, launch: opts.launchCommand})	// launch process
						break
					}
					// put run back onto the command queue
					commandQueue.unshift(command)
					// flow through to stop
				case 'stop':
					if (state == 'stop') continue
					// run, debug, crash states
					master.write({app: appId, kill: true}) // once child dies, we will continue
					break
				case 'debug':
					if (state == 'debug') continue
					if (state == 'run') {
						commandQueue.splice(0, 0, 'stop', 'debug')
						continue
					}
					// stop or crash
					lastRunOrDebug = command
					master.write({app: appId, launch: opts.debugCommand, debug: true})	// launch process
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
}
util.inherits(AppLink, events.EventEmitter)

/*
Receive a message through ipc from the master process' appconduit
error, message
app, pid, state, lastLaunch
app, state (stopping)
app, exit, state, lastexit (exit)
appMap, lauchTime
*/
function receiver(message) {
	var ok
	if (message.app) {
		var receiveFn = appMessageReceivers[message.app]
		if (ok = typeof receiveFn === 'function') receiveFn(message)
	}
	if (message.appMap) ok = true // those are for godModel
	if (!ok) console.log('Uncaught message:', message)
}
