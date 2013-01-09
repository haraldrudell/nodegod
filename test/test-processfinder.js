// test-processfinder.js
// © Harald Rudell 2012

var processfinder = require('../lib/master/processfinder')

var masterserver = require('../lib/master/masterserver')
var pidgetter = require('../lib/master/pidgetter')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ms = masterserver.MasterServer
var gpp = pidgetter.getPidFromPort

exports['ProcessFinder:'] = {
	'Exports': function () {
		assert.exportsTest(processfinder, 2)
	},
	'IsProcessMaster': function() {
		var opts = {
			port: 21,
			interface: 'INTERFACE',
			log: function () {},
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
		aOn['error']({})

		// end
		aOn['end']()

		// fail
		var eGetPid = [[{
			port: opts.port,
			host: opts.interface,
		}]]
		var aGetPid = []
		pidgetter.getPidFromPort = mockGetPid
		aOn['fail']()
		assert.equal(typeof (eGetPid[0][1] = aGetPid[0] && aGetPid[0][1]), 'function')
		assert.deepEqual(aGetPid, eGetPid)

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
		hazMasterPid(value)
		assert.equal(aCb.length, 1)
		assert.equal(aCb[0], value)

		// data
		var aReset = 0
		processfinder.setResetUi(function () {aReset++})
		aOn['data']()
		assert.equal(aReset, 1)
	},
	'after': function() {
		masterserver.MasterServer = ms
		pidgetter.getPidFromPort = gpp
	},
}