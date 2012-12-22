// test-app.js
// © Harald Rudell 2012

var processfinder = require('../lib/master/processfinder')
var uimanager = require('../lib/master/uimanager')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var cl = console.log
var on = process.on
var ipm = processfinder.isProcessMaster
var lui = uimanager.launchUi

exports['App:'] = {
	'IsMaster IsNotMaster ProcessException': function() {
		var aLogs = 0
		var aOn = {}
		var masterResult
		var aLui = 0

		// execute is not master
		console.log = mockLog
		process.on = mockOn
		processfinder.isProcessMaster = mockIsProcessMaster
		uimanager.launchUi = mockLaunchUi
		var app = require('../app')
		console.log = cl

		assert.equal(aLogs, 2)
		assert.equal(Object.keys(aOn).length, 2)
		assert.ok(masterResult)

		// execute is master
		aLogs = 0
		console.log = mockLog
		masterResult(true)
		console.log = cl

		assert.equal(aLogs, 1, 'masterResult(true) log count')
		assert.equal(aLui, 1)

		// process exception
		var fn = aOn['uncaughtException']
		assert.equal(typeof fn, 'function')

		aLogs = 0
		console.log = mockLog
		fn(1, 2)
		console.log = cl
		assert.equal(aLogs, 3)

		function mockIsProcessMaster(a, b, cb) {
			masterResult = cb
			cb(1)
		}
		function mockOn(event, fn) {
			aOn[event] = fn
		}
		function mockLog() {
			aLogs++
		}
		function mockLaunchUi() {
			aLui++
		}
	},
	'after': function() {
		console.log = cl
		process.on = on
		processfinder.isProcessMaster = ipm
		uimanager.launchUi = lui
	},
}