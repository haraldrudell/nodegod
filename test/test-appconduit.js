// test-appconduit.js
// © Harald Rudell 2012

var appconduit = require('../lib/master/appconduit')
var testedModule = appconduit

var logger = require('../lib/master/logger')

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 5
var testedModuleType = 'object'
var exportsTypes = {}

var sp = child_process.spawn
var cl = console.log
var pk = process.kill
var al = logger.addLogging

exports['AppConduit:'] = {
	'Exports': function () {

		// if export count changes, we need to write more tests
		assert.equal(typeof testedModule, testedModuleType, 'Module type incorrect')
		assert.equal(Object.keys(testedModule).length, exportsCount, 'Export count changed')

		// all exports function
		for (var exportName in testedModule) {
			var actual = typeof testedModule[exportName]
			var expected = exportsTypes[exportName] || 'function'
			assert.equal(actual, expected, 'Incorrect type of export ' + exportName)
		}
	},
	'SetLaunchData': function() {
		console.log = function () {}
		appconduit.setLaunchData('PROC', 5)
		console.log = cl
	},
	'UiConnect': function() {
		appconduit.uiConnect(5)
	},
	'UiDisConnect': function() {
		appconduit.uiDisconnect()
	},
	'ReceiveFromUi Empty Message': function() {
		var message = {a: 1}
		var aData = []
		var eData = [{error: 'failed', message: message}]
		appconduit.uiConnect(function (d) {aData.push(d)})
		appconduit.receiveFromUi(message)

		assert.deepEqual(aData, eData)

		// no Ipc
		appconduit.uiDisconnect()
		console.log = function () {}
		appconduit.receiveFromUi(message)
		console.log = cl
	},
	'ReceiveFromUi GetMap': function() {
		var message = {getMap: true}
		var aData = []
		var eData = [{appMap: {}, launchTime: 5}]
		appconduit.uiConnect(function (d) {aData.push(d)})
		appconduit.receiveFromUi(message)

		assert.equal(typeof (aData[0] && aData[0].launchTime), 'number')
		eData[0].launchTime = aData[0].launchTime
		assert.deepEqual(aData, eData)
	},
	'ReceiveFromUi Launch Non-Array': function() {
		// launch non-array
		var message = {app: 'APP', launch: true}
		var aData = []
		var eData = [{error: 'Bad launch command', isConfig: true, message: {app: message.app}}]
		appconduit.uiConnect(function (d) {aData.push(d)})
		appconduit.receiveFromUi(message)

		assert.deepEqual(aData, eData)
	},
	'ReceiveFromUi Launch': function(done) {

		// launch
		var message = {app: 'APP', launch: ['CMD', 'ARG']}
		var child = {pid: 5}
		var aData = []
		var eData = [{app: message.app, pid: child.pid, state: 'run'}]
		appconduit.uiConnect(function (d) {aData.push(d)})
		var aLogger = []
		var eLogger = [[child, message.app]]
		logger.addLogging = function (child, appName) {aLogger.push([child, appName])}
		var aOn = {}
		var eOn = ['exit']
		child.on = function (e, f) {aOn[e]=f; return this}
		var aSpawn = []
		var eSpawn = [[
			message.launch[0],
			[message.launch[1]],
			['ignore', 'pipe', 'pipe'],
		]]
		child_process.spawn = function (command, args, options) {aSpawn.push([command, args, options]); return child}
		appconduit.receiveFromUi(message)

		assert.deepEqual(aSpawn, eSpawn)
		assert.deepEqual(Object.keys(aOn).sort(), eOn.sort())
		for (var e in aOn) assert.equal(typeof aOn[e], 'function')
		assert.deepEqual(aLogger, eLogger)
		assert.equal(typeof (aData[0] && aData[0].lastLaunch), 'number')
		eData[0].lastLaunch = aData[0].lastLaunch
		assert.deepEqual(aData, eData)

		// check state after launch
		var eAppState = {
			app: message.app,
			crashCount: 0,
			pid: child.pid,
			state: 'run',
			killMap: {},
			lastLaunch: 0,
			created: 0,
		}
		var eState = {map: {}}
		eState.map[message.app] = eAppState
		var aState = appconduit.getState()

		var aAppState = aState && aState.map && aState.map[message.app]
		assert.ok(aAppState)
		assert.equal(typeof (eAppState.lastLaunch = aAppState.lastLaunch), 'number')
		assert.equal(typeof (eAppState.created = aAppState.created), 'number')
		assert.ok(aAppState.killMap)
		assert.equal(typeof (eAppState.killMap[child.pid] = aAppState.killMap[child.pid]), 'function')
		assert.deepEqual(aState, eState)

		// killChild
		var graceKillPeriod = 0
		// set grace kill period, fetch appMap
		var appMap = appconduit.getState(graceKillPeriod).map
		var killMap = appMap[message.app].killMap
		var killChild = killMap[child.pid]
		var aData = []
		var eData = [{app: message.app, state: 'stopping'}]
		appconduit.uiConnect(function (d) {aData.push(d)})
		var aKill = []
		var eKill = [
			[child.pid, 'SIGINT'],
			[child.pid, undefined],
		]
		process.kill = processKill
		killChild()

		function processKill(pid, sig) {
			aKill.push([pid, sig])
			if (sig === undefined) {
				assert.deepEqual(aData, eData)
				assert.deepEqual(aKill, eKill)

				// childExit
				var code = 3
				var aRemove = 0
				child.removeListener = function (e, f) {aRemove++}
				var aData = []
				var eData = [{app: message.app, exit: code, state: 'stop', lastExit: 0}]
				appconduit.uiConnect(function (d) {aData.push(d)})
				aOn.exit(code)
				assert.ok(aRemove)
				assert.ok(aData[0])
				assert.equal(typeof (eData[0].lastExit = aData[0].lastExit), 'number')
				assert.deepEqual(aData, eData)

				done()
			}
		}
	},
	'ReceiveFromUi Kill': function() {
		// kill
		var app = 'APP'
		var pid = 5
		var appState = {app: app, pid: pid, killMap: {}}
		var appMap = {}
		appMap[app] = appState
		var aKill = 0
		appState.killMap[appState.pid] = function () {aKill++}
		var message = {app: app, kill: true}
		appconduit.getState(undefined, appMap)
		appconduit.receiveFromUi(message)

		assert.ok(aKill)

		// crash
		appState.killMap = {}
		appState.state = 'crash'
		var aMsg = []
		var eMsg = [{app: app, state: 'stop'}]
		appconduit.uiConnect(function (d) {aMsg.push(d)})
		appconduit.receiveFromUi(message)

		assert.deepEqual(aMsg, eMsg)
	},
	'ReceiveFromUi Del': function() {
		var app = 'APP'
		var pid = 5
		var appState = {app: app, pid: pid, killMap: {}, state: 'run'}
		var appMap = {}
		appMap[app] = appState
		var aKill = 0
		appState.killMap[appState.pid] = function () {aKill++}
		var message = {app: app, del: true}
		appconduit.getState(undefined, appMap)
		appconduit.receiveFromUi(message)

		assert.ok(aKill)

		var eMap = {map:{}}
		var aMap = appconduit.getState()
		assert.deepEqual(aMap, eMap)
	},
	'after': function() {
		child_process.spawn = sp
		console.log = cl
		process.kill = pk
		logger.addLogging = al
	},
}