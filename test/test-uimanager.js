// test-uimanager.js
// © Harald Rudell 2012

var uimanager = require('../lib/master/uimanager')
var testedModule = uimanager

var logger = require('../lib/master/logger')
var appconduit = require('../lib/master/appconduit')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 2
var testedModuleType = 'object'
var exportsTypes = {}

var sp = child_process.spawn
var sese = appconduit.setLaunchData
var al = logger.addLogging
var uc = appconduit.uiConnect
var cl = console.log
var pk = process.kill

exports['UiManager:'] = {
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
	'GetUiRelauncher': function() {
		var actual = uimanager.getUiRelauncher()
		assert.equal(typeof actual, 'function')
	},
	'LaunchUi': function(done) {

		// launch
		var processName = 'PROCESS_NAME'
		var uiModuleName = 'UI_MODULE_NAME'
		var aLaunchData = []
		var eLaunchData = [[processName, 0]]
		appconduit.setLaunchData = function (p, u) {aLaunchData.push([p, u])}
		var aOn = {}
		var eOn = ['exit', 'message', 'disconnect']
		var onFn = function (e, f) {aOn[e] = f; return this}
		var childSend = function () {throw new Error('nimp')}
		var child = {pid:17, on: onFn, once: onFn, send: childSend}
		var aSpawn = []
		var eSpawn = [[
			'node',
			[path.join(path.dirname(require && require.main && require.main.filename), uiModuleName)],
			{stdio: ['ignore', 'pipe', 'pipe', 'ipc']},
		]]
		child_process.spawn = function mockSpawn(c, a, o) {aSpawn.push([c, a, o]); return child}
		var aLog = []
		var eLog = [[child, 'ui']]
		logger.addLogging = function (c, s) {aLog.push([c, s])}
		var aUiConnect = []
		appconduit.uiConnect = function (f) {aUiConnect.push(f)}
		var aException = []
		var restartIntercept = function (e) {aException.push(e)}
		console.log = function () {}
		uimanager.launchUi(processName, uiModuleName, restartIntercept)
		console.log = cl

		assert.deepEqual(aException, [], 'launchUi exceptions')
		assert.ok(aLaunchData[0])
		assert.equal(typeof (eLaunchData[0][1] = aLaunchData[0][1]), 'number')
		assert.deepEqual(aLaunchData, eLaunchData)
		assert.deepEqual(Object.keys(aOn).sort(), eOn.sort())
		for (var e in aOn) assert.equal(typeof aOn[e], 'function')
		assert.deepEqual(aSpawn, eSpawn)
		assert.deepEqual(aLog, eLog)
		assert.equal(aUiConnect.length, 1)
		aUiConnect.forEach(function (f) {
			assert.equal(typeof f, 'function')
		})

		// killUi
		var uiRelauncher = uimanager.getUiRelauncher()
		var killFnMap = uiRelauncher(true, 0)
		assert.ok(killFnMap)
		assert.equal(Object.keys(killFnMap).length, 1)
		var killUi = killFnMap[child.pid]
		assert.equal(typeof killUi, 'function')

		var aDisconnect = 0
		child.disconnect = function () {aDisconnect++}
		var aKill = []
		var eKill = [
			[child.pid, 'SIGINT'],
			[child.pid, undefined],
		]
		process.kill = processKill
		console.log = function () {}
		killUi()
		console.log = cl

		function processKill(pid, sig) {
			aKill.push([pid, sig])
			if (sig === undefined) {
				assert.deepEqual(aKill, eKill)
				assert.ok(aDisconnect)

			// uiExit
			var exitCode = 56
			var aRemove = 0
			child.removeListener = function (e, f) {aRemove++; return this}
			console.log = function () {}
			aOn.exit(exitCode)
			console.log = cl

			assert.ok(aRemove)

			done()
			}
		}
	},
	'after': function() {
		child_process.spawn = sp
		appconduit.setLaunchData = sese
		logger.addLogging = al
		appconduit.uiConnect = uc
		console.log = cl
		process.kill = pk
	},
}