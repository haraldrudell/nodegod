// test-uimanager.js
// © Harald Rudell 2012

var uimanager = require('../lib/master/uimanager')

var logger = require('../lib/master/logger')
var appconduit = require('../lib/master/appconduit')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var sp = child_process.spawn
var sese = appconduit.setLaunchData
var al = logger.logChild
var uc = appconduit.uiConnect
var pk = process.kill

exports['UiManager:'] = {
	'Exports': function () {
		assert.exportsTest(uimanager, 2)
	},
	'GetUiRelauncher': function() {
		var actual = uimanager.getUiRelauncher()
		assert.equal(typeof actual, 'function')
	},
	'LaunchUi': function(done) {
		var processName = 'PROCESS_NAME'
		var mockLogger = {
			log: function () {},
			configure: function () {},
			write: function () {},
		}
		var launchArray = ['EXECUTABLE', 'ARGUMENT']

		var aLaunchData = []
		var eLaunchData = [{
			processName: processName,
			masterLaunch: 0,
			rlog: mockLogger,
		}]
		appconduit.setLaunchData = function (o) {aLaunchData.push(o)}

		var aOn = {}
		var eOn = ['exit', 'message', 'disconnect']
		var onFn = function (e, f) {aOn[e] = f; return this}
		var childSend = function () {throw new Error('nimp')}
		var child = {pid:17, on: onFn, once: onFn, send: childSend}

		var aSpawn = []
		var eSpawn = [[
			launchArray[0],
			launchArray.slice(1),
			{detached: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc']},
		]]
		child_process.spawn = function mockSpawn(c, a, o) {aSpawn.push([c, a, o]); return child}

		var aLog = []
		var eLog = [[child, 'ui']]
		logger.logChild = function (c, s) {aLog.push([c, s])}

		var aUiConnect = []
		appconduit.uiConnect = function (f) {aUiConnect.push(f)}

		var aException = []
		var restartIntercept = function (e) {aException.push(e)}

		uimanager.launchUi({processName: processName, launchArray: launchArray, restartIntercept: restartIntercept, rlog: mockLogger})

		assert.deepEqual(aException, [], 'launchUi exceptions')
		assert.equal(typeof (eLaunchData[0].masterLaunch = aLaunchData[0] && aLaunchData[0].masterLaunch), 'number')
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
		killUi()

		function processKill(pid, sig) {
			aKill.push([pid, sig])
			if (sig === undefined) {
				assert.deepEqual(aKill, eKill)
				assert.ok(aDisconnect)

			// uiExit
			var exitCode = 56
			var aRemove = 0
			child.removeListener = function (e, f) {aRemove++; return this}
			aOn.exit(exitCode)

			assert.ok(aRemove)

			done()
			}
		}
	},
	'after': function() {
		child_process.spawn = sp
		appconduit.setLaunchData = sese
		logger.logChild = al
		appconduit.uiConnect = uc
		process.kill = pk
	},
}