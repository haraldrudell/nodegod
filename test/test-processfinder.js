// test-processfinder.js
// © Harald Rudell 2012

var processfinder = require('../lib/master/processfinder')
var testedModule = processfinder

var masterserver = require('../lib/master/masterserver')
var pidgetter = require('../lib/master/pidgetter')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 2
var testedModuleType = 'object'
var exportsTypes = {}

var ms = masterserver.MasterServer
var gpp = pidgetter.getPidFromPort
var cl = console.log

exports['ProcessFinder:'] = {
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
	'IsProcessMaster': function() {
		var opts = {
			port: 21,
			interface: 'INTERFACE',
		}
		var aOn = {}
		var eEvents = ['connect', 'fail', 'error', 'end', 'data']
		var aCb = []

		// basic invocation
		masterserver.MasterServer = function () {return {on: mockOn}}
		processfinder.isProcessMaster(opts, mockCb)
		assert.equal(Object.keys(aOn).length, eEvents.length)
		eEvents.forEach(function (anEvent) {
			assert.equal(typeof aOn[anEvent], 'function')
		})
		assert.equal(aCb.length, 0)

		function mockCb(value) {
			aCb.push(value)
		}
		function mockOn(event, fn) {
			aOn[event] = fn
			return this
		}

		// connect
		aOn['connect']()
		assert.equal(aCb.length, 1)
		assert.strictEqual(aCb[0], true)

		// error
		console.log = function () {}
		aOn['error']({})
		console.log = cl

		// end
		console.log = function () {}
		aOn['end']()
		console.log = cl

		// fail
		var aGetPid = []
		pidgetter.getPidFromPort = mockGetPid
		aOn['fail']()
		assert.equal(aGetPid.length, 1)
		assert.equal(aGetPid[0][0], opts.port)
		assert.equal(typeof aGetPid[0][1], 'function')

		function mockGetPid(port, cb) {
			aGetPid.push([port, cb])
		}

		// hazMasterPid
		var value = 3
		var hazMasterPid = aGetPid[0][1]
		aCb = []
		hazMasterPid(null, value)
		assert.equal(aCb.length, 1)
		assert.equal(aCb[0], value)

		var value = {}
		aCb = []
		console.log = function () {}
		hazMasterPid(value)
		console.log = cl
		assert.equal(aCb.length, 1)
		assert.equal(aCb[0], 0)

		// data
		var aReset = 0
		processfinder.setResetUi(function () {aReset++})
		aOn['data']()
		assert.equal(aReset, 1)
	},
	'after': function() {
		masterserver.MasterServer = ms
		pidgetter.getPidFromPort = gpp
		console.log = cl
	},
}