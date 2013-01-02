// test-app.js
// © Harald Rudell 2012

var processfinder = require('../lib/master/processfinder')
var uimanager = require('../lib/master/uimanager')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var cl = console.log
var on = process.on
var sru = processfinder.setResetUi
var ipm = processfinder.isProcessMaster
var lui = uimanager.launchUi
var gur = uimanager.getUiRelauncher

exports['App:'] = {
	'IsNotMaster ProcessException SIGINT IsMaster': function() {

		// execute is not master
		var aOn = {}
		var eOn = ['uncaughtException', 'SIGINT']
		process.on = function (e, f) {aOn[e] = f; return this}
		var aIsProcessMaster = []
		var eIsProcessMaster = [[{port: 1113, interface: '127.0.0.1', processName: 0}, 'cb']]
		processfinder.isProcessMaster = mockIsProcessMaster
		console.log = function() {}
		var app = require('../app')
		console.log = cl

		assert.deepEqual(Object.keys(aOn).sort(), eOn.sort())
		for (var e in aOn) assert.equal(typeof aOn[e], 'function')
		assert.equal(typeof (eIsProcessMaster[0][0].processName = aIsProcessMaster[0] && aIsProcessMaster[0][0] && aIsProcessMaster[0][0].processName), 'string')
		eIsProcessMaster[0][1] = aIsProcessMaster[0][1]
		assert.deepEqual(aIsProcessMaster, eIsProcessMaster)

		function mockIsProcessMaster(opts, cb) {
			assert.equal(typeof cb, 'function')
			aIsProcessMaster.push([opts, cb])
			cb(1)
		}

		// process exception
		console.log = function () {}
		aOn.uncaughtException(1, 2)
		console.log = cl

		// sigint
		console.log = function () {}
		aOn.SIGINT(1, 2)
		console.log = cl

		// execute is master
		var masterResult = aIsProcessMaster[0][1]
		process.on = function () {}
		processfinder.isProcessMaster = function (o, cb) {cb(true)}
		var uiRelauncher = 5
		uimanager.getUiRelauncher = function () {return uiRelauncher}
		var aReset = []
		var eReset = [uiRelauncher]
		processfinder.setResetUi = function (f) {aReset.push(f)}
		var aLaunchUi = []
		var eLaunchUi = [[0, 'webprocess']]
		uimanager.launchUi = function (p, f) {aLaunchUi.push([p, f])}
		console.log = function () {}
		masterResult(true)
		console.log = cl

		assert.deepEqual(aReset, eReset)
		assert.equal(typeof (eLaunchUi[0][0] = aLaunchUi[0] && aLaunchUi[0][0]), 'string')
		assert.deepEqual(aLaunchUi, eLaunchUi)
	},
	'after': function() {
		console.log = cl
		process.on = on
		processfinder.isProcessMaster = ipm
		processfinder.setResetUi = sru
		uimanager.launchUi = lui
		uimanager.getUiRelauncher = gur
	},
}