// test-nodegodmaster.js
// © Harald Rudell 2012 MIT License

nodegodmaster = require('../lib/master/nodegodmaster')

var processfinder = require('../lib/master/processfinder')
var uimanager = require('../lib/master/uimanager')
var logpipe = require('../lib/master/logpipe')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var on = process.on
var sru = processfinder.setResetUi
var ipm = processfinder.isProcessMaster
var lui = uimanager.launchUi
var gur = uimanager.getUiRelauncher
var lg = logpipe.getLogPipe

exports['Node God Master:'] = {
	'Exports': function () {
		assert.exportsTest(nodegodmaster, 1)
	},
	'IsNotMaster ProcessException SIGINT IsMaster': function() {
		var opts = {
			port: 1113,
			interface: '127.0.0.1',
			ignoredSignals: ['SIGINT', 'SIGUSR2', 'SIGHUP'],
			appIndentifier: 'nodegodmaster',
			launchArray: ['node', require('path').join(__dirname, '..', 'webprocess')],
			fsLogArray: ['node', require('path').join(__dirname, '..', 'logprocess')],
		}
		var mockLogManager = {
			log: function () {},
			pLog: function () {},
			connectPipe: function (cb) {cb()},
			write: function () {},
		}
		logpipe.LogPipe = function mockLogPipe() {return mockLogManager}

		// execute is not master
		var aOn = {}
		var eOn = ['uncaughtException', 'SIGUSR2', 'SIGINT', 'SIGHUP']
		process.on = function (e, f) {aOn[e] = f; return this}

		var aIsProcessMaster = []
		var eIsProcessMaster = [[{port: 1113, interface: '127.0.0.1', processName: 0}, 'cb']]
		function mockIsProcessMaster(opts, cb) {
			assert.equal(typeof cb, 'function')
			aIsProcessMaster.push([opts, cb])
			cb(1)
		}
		processfinder.isProcessMaster = mockIsProcessMaster

		nodegodmaster.run(opts)

		assert.deepEqual(Object.keys(aOn).sort(), eOn.sort())
		for (var e in aOn) assert.equal(typeof aOn[e], 'function')

		assert.equal(typeof (eIsProcessMaster[0][0].processName = aIsProcessMaster[0] && aIsProcessMaster[0][0] && aIsProcessMaster[0][0].processName), 'string')
		assert.equal(typeof (eIsProcessMaster[0][0].log = aIsProcessMaster[0] && aIsProcessMaster[0][0] && aIsProcessMaster[0][0].log), 'function')
		eIsProcessMaster[0][1] = aIsProcessMaster[0][1]
		assert.deepEqual(aIsProcessMaster, eIsProcessMaster)

		// process exception
		aOn.uncaughtException(1, 2)

		// sigint
		aOn.SIGINT(1, 2)

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
		var eLaunchUi = [{
			launchArray: ['node', path.join(__dirname, '..', 'webprocess')],
			rlog: mockLogManager,
			launchTime: 0
		}]
		uimanager.launchUi = function (opts) {aLaunchUi.push(opts)}

		masterResult(true)

		assert.deepEqual(aReset, eReset)
		assert.equal(typeof(eLaunchUi[0].launchTime = aLaunchUi[0] && aLaunchUi[0].launchTime), 'number')
		assert.deepEqual(aLaunchUi, eLaunchUi)
	},
	'after': function() {
		process.on = on
		processfinder.isProcessMaster = ipm
		processfinder.setResetUi = sru
		uimanager.launchUi = lui
		uimanager.getUiRelauncher = gur
		logpipe.getLogPipe = lg
	},
}