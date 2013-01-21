// test-uimanager.js
// © Harald Rudell 2012 MIT License

var uimanager = require('../lib/master/uimanager')

var logger = require('../lib/master/streamlabeller')
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
		var opts = {
			spawn: {
				file: 'NODE',
				args: ['SCRIPT']
			},
			rlog: {
				pLog: function () {},
				configure: function () {},
				write: function () {},
			},
			launchTime: 7,
			restartIntercept: restartIntercept,
		}

		var aLaunchData = []
		var eLaunchData = [{
			masterLaunch: opts.launchTime,
			rlog: opts.rlog,
		}]
		appconduit.setLaunchData = function (o) {aLaunchData.push(o)}

		var aOn = {}
		var eOn = ['exit', 'message', 'disconnect']
		var onFn = function (e, f) {aOn[e] = f; return this}
		var childSend = function () {throw new Error('nimp')}
		var child = {pid:17, on: onFn, once: onFn, send: childSend}

		var aSpawn = []
		var eSpawn = [[
			opts.spawn.file,
			opts.spawn.args,
			{detached: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc']},
		]]
		child_process.spawn = function mockSpawn(c, a, o) {aSpawn.push([c, a, o]); return child}

		var aLog = []
		var eLog = [[child, 'ui']]
		logger.logChild = function (c, s) {aLog.push([c, s])}

		var aUiConnect = []
		appconduit.uiConnect = function (f) {aUiConnect.push(f)}

		var aException = []
		function restartIntercept(e) {aException.push(e)}

		uimanager.launchUi(opts)

		assert.deepEqual(aException, [], 'launchUi exceptions')
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