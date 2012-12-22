// test-appconduit.js
// © Harald Rudell 2012

var appconduit = require('../lib/master/appconduit')

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var sp = child_process.spawn
var cl = console.log
var pk = process.kill

exports['AppConduit:'] = {
	'LaunchUi InterSignal': function() {
		var aOn = {}
		var mockStd = {
			setEncoding: function () {},
			on: mockOn,
		}
		var aKill = 0
		var aSend = 0
		var aLog = 0

		// spawn
		child_process.spawn = mockSpawn
		console.log = function () {}
		appconduit.receiveFromUi({app: 1, launch: []})
		console.log = cl

		assert.equal(Object.keys(aOn).length, 2)
		assert.equal(typeof aOn['exit'], 'function')
		assert.equal(typeof aOn['data'], 'function')


		// kill
		process.kill = function () {aKill++}
		console.log = function () {}
		appconduit.receiveFromUi({app: 1, kill: true})
		console.log = cl

		assert.equal(aKill, 1)

		// exit
		appconduit.setSend(function () {aSend++})
		aOn['exit'](5)

		assert.equal(aSend, 1)

		aSend = 0
		appconduit.receiveFromUi({app: 2, getMap: true})
		assert.equal(aSend, 1)

		appconduit.receiveFromUi({app: 2, del: true})

		// log
		console.log = function () {aLog++}
		aOn['data']('abc')
		console.log = cl
		assert.equal(aLog, 1)

		function mockSpawn(cmd, args, opts) {
			return {
				pid: 5,
				on: mockOn,
				stderr: mockStd,
				stdout: mockStd,
			}
		}
		function mockOn(e, fn) {
			aOn[e] = fn
			return this
		}
	},
	'after': function() {
		child_process.spawn = sp
		console.log = cl
		process.kill = pk
	},
}