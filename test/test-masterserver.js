// test-masterserver.js
// © Harald Rudell 2013 MIT License

var masterserver = require('../lib/master/masterserver')

// http://nodejs.org/api/net.html
var net = require('net')
// http://nodejs.org/api/events.html
var events = require('events')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var cn = net.createServer
var cl = console.log

exports['MasterServer:'] = {
	'Exports': function () {
		assert.exportsTest(masterserver, 2)
	},
	'Constructor': function() {
		var port = 21
		var interface = 'INTERFACE'
		var aConnect = []
		var server = {
			once: mockOn,
			on: mockOn,
			listen: function (port, interface, f) {aListen.push([port, interface, f]); return this},
			removeListener: function (e, l) {aRListener++},
		}
		var aCreate = []
		var aListen = []
		var eEvents = ['error', 'close']
		var aRListener = 0
		var aOn = {}
		var ignoreProperties = ['domain', '_events', '_maxListeners']

		// constructor
		net.createServer = function (f) {aCreate.push(f); return server}
		var masterServer = new masterserver.MasterServer(port, interface)

		assert.ok(masterServer instanceof events.EventEmitter)
		var keys = []
		Object.keys(masterServer).forEach(function (p) {
			if (!~ignoreProperties.indexOf(p)) keys.push(p)
		})
		assert.equal(keys.length, 2, 'List is: ' + keys)
		assert.equal(typeof masterServer.shutdown, 'function')
		assert.equal(typeof masterServer.isUp, 'function')
		assert.equal(aCreate.length, 1)
		assert.equal(typeof aCreate[0], 'function')
		assert.equal(aListen.length, 1)
		assert.equal(aListen[0][0], port)
		assert.equal(aListen[0][1], interface)
		assert.equal(typeof aListen[0][2], 'function')
		assert.equal(Object.keys(aOn).length, eEvents.length)
		eEvents.forEach(function (anEvent) {
			assert.equal(typeof aOn[anEvent], 'function')
		})

		function mockOn(event, fn) {
			aOn[event] = fn
			return this
		}

		// error
		var aFail = 0
		aRListener = 0
		masterServer.on('fail', function () {aFail++})
		aOn.error({code: 'EADDRINUSE'})
		assert.ok(aFail)
		assert.ok(aRListener)

		// listen close
		var aConns = 0
		masterServer.on('connect', function () {aConns++})
		var listeningListener = aListen[0][2]
		listeningListener()
		assert.ok(aConns)

		var aEnds = 0
		aRListener = 0
		masterServer.on('end', function () {aEnds++})
		var aClose = 0
		server.close = function (e, l) {aClose++}
		aOn.close()
		assert.ok(aEnds)
		assert.ok(aRListener)

		// isUp
		masterServer.isUp()

		// shutdown
		var listeningListener = aListen[0][2]
		listeningListener()
		masterServer.shutdown()
		assert.ok(aClose)

		// connect
		var socket = {
			on: function (e, f) {aOnS[e] = f},
			setEncoding: function () {aEncodingS++},
		}
		var aOnS = {}
		var aEncodingS = 0
		var handleConnection = aCreate[0]
		handleConnection(socket)
		assert.ok(aEncodingS)
		assert.equal(Object.keys(aOnS).length, 1)
		assert.equal(typeof aOnS.data, 'function')

		var value = 5
		var aEndS = []
		socket.end = function (x) {aEndS.push(x)}
		var aData = []
		masterServer.once('data', function (d) {aData.push(d)})
		var requestResponder = aOnS.data
		requestResponder(value)
		// socket.end
		assert.equal(aEndS.length, 1)
		assert.equal(typeof aEndS[0], 'string')
		// emit 'data'
		assert.equal(aData.length, 1)
		assert.equal(aData[0], value)
	},
	'GetServerMap': function() {
		var actual = masterserver.getServerMap()
		assert.equal(typeof actual, 'object')
	},
	'after': function() {
		net.createServer = cn
		console.log = cl
	},
}