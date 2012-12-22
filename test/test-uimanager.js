// test-uimanager.js
// © Harald Rudell 2012

var uimanager = require('../lib/master/uimanager')

var appconduit = require('../lib/master/appconduit')
// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var sp = child_process.spawn
var sese = appconduit.setSend
var cl = console.log
var pk = process.kill

exports['UiManager:'] = {
	'LaunchUi InterSignal': function() {
		var uiModuleName = 'UIMODNAME'
		var aSetSend = 0
		var aOn = {}
		var aKill = 0

		// launch
		child_process.spawn = mockSpawn
		appconduit.setSend = mockSetSend
		console.log = function () {}
		uimanager.launchUi(1, uiModuleName)
		console.log = cl

		assert.equal(aSetSend, 1)
		assert.equal(Object.keys(aOn).length, 2)
		assert.equal(typeof aOn['exit'], 'function')

		// kill from master candidate
		process.kill = mockKill
		console.log = function () {}
		uimanager.interMasterSignalHandler()
		console.log = cl

		assert.equal(aKill, 1)

		// fake exit
		console.log = function () {}
		aSetSend = 0
		aOn['exit'](1)
		console.log = cl

		assert.equal(aSetSend, 1)

		function mockSpawn(cmd, args, opts) {
			return {
				on: function(e, fn) {
					aOn[e] = fn
					return this
				},
				send: function () {},
				stdio: [],
			}
		}
		function mockSetSend() {
			aSetSend++
		}
		function mockKill() {
			aKill++
		}

	},
	'after': function() {
		child_process.spawn = sp
		appconduit.setSend = sese
		console.log = cl
		process.kill = pk
	},
}