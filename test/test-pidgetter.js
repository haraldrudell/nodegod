// test-pidgetter.js
// © Harald Rudell 2013

var pidgetter = require('../lib/master/pidgetter')
var testedModule = pidgetter

// http://nodejs.org/api/net.html
var net = require('net')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 2
var testedModuleType = 'object'
var exportsTypes = {}

var cn = net.connect
var cl = console.log

exports['PidGetter:'] = {
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
	'GetPidFromPort': function() {
		var opts = {
			port: 21,
			interface: 'INTERFACE',
		}
		var aConnect = []
		var socket = {
			once: mockOn,
			on: mockOn,
			setTimeout: function (x) {aTimeout.push(x)},
			setEncoding: function () {aEncoding++},
			write: function (x) {aWrite.push(x)},
			end: function (x) {aEnd.push(x)},
			destroy: function () {aDestroy++},
			removeListener: function (e, l) {aRListener++},
		}
		var aTimeout = []
		var aEncoding = 0
		var aRListener = 0
		var aEnd = []
		var aDestroy = 0
		var aWrite = []
		var aOn = {}
		var eEvents = ['timeout', 'data', 'close']
		var aCb = []

		// basic invocation
		net.connect = mockConnect
		pidgetter.getPidFromPort(opts, mockCb)

		assert.equal(aConnect.length, 1)
		assert.equal(aConnect[0][0], opts.port)
		assert.equal(typeof aConnect[0][1], 'function')
		assert.equal(Object.keys(aOn).length, eEvents.length)
		eEvents.forEach(function (anEvent) {
			assert.equal(typeof aOn[anEvent], 'function')
		})
		assert.equal(aTimeout.length, 1)
		assert.equal(aTimeout[0], 1e3)
		assert.equal(aEncoding, 1)

		// connect
		var connectionListener = aConnect[0][1]
		connectionListener()
		assert.equal(aEnd.length, 1)
		var actual = aEnd[0]
		assert.equal(typeof actual, 'string')
		assert.ok(!isNaN(Number(actual)))

		// timeout
		var timeoutListener = aOn.timeout
		timeoutListener()
		assert.equal(aDestroy, 1)
		assert.equal(aCb.length, 1)
		assert.equal(aCb[0].length, 1)
		assert.ok(aCb[0][0] instanceof Error)

		// close
		var closeListener = aOn.close
		closeListener()
		assert.equal(aRListener, 3)

		// data
		var value = 7
		aCb = []
		pidgetter.getPidFromPort(opts, mockCb) // reset the instance
		var dataListener = aOn.data
		dataListener(String(value))
		assert.equal(aCb.length, 1)
		assert.equal(aCb[0].length, 2)
		var actual = aCb[0][1]
		assert.equal(typeof actual, 'number')
		assert.equal(actual, value)

		function mockCb(err, value) {
			if (err) aCb.push([err])
			else aCb.push([err, value])
		}
		function mockConnect(port, listener) {
			aConnect.push([port, listener])
			return socket
		}
		function mockOn(event, fn) {
			aOn[event] = fn
			return this
		}
	},
	'GetSocketMap': function() {
		var actual = pidgetter.getSocketMap()
		assert.equal(typeof actual, 'object')
	},
	'after': function() {
		net.connect = cn
		console.log = cl
	},
}