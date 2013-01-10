// test-rotatedlogger.js
// © Harald Rudell 2013

var rotatedlogger = require('../lib/master/rotatedlogger')

var perioder = require('../lib/master/perioder')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var wr = process.stdout.write
var cws = fs.createWriteStream
var te = perioder.TimeEmitter

exports['RotatedLogger:'] = {
	'Exports': function () {
		assert.exportsTest(rotatedlogger, 3)
	},
	'Init': function () {
		var actual = rotatedlogger.init()
		assert.ok(actual)
	},
	'Write Log': function () {
		var value = ['value: %s', 123]
		var eValue = 'value: ' + value[1] + '\n'

		var aWrite = []
		var eWrite = [eValue, eValue]
		function mockWrite(x) {aWrite.push(x)}

		var aOn = {}
		var eOn = ['error']
		function mockOn(e, f) {aOn[e] = f; return this}
		fs.createWriteStream = function mockCreateWriteStream(x) {return {on: mockOn, write: mockWrite}}

		var aTOn = []
		var eTOn = ['time']
		perioder.TimeEmitter = function MockTimeEmitter() {this.on = function (e, f) {aTOn[e] = f}}

		process.stdout.write = mockWrite
		rotatedlogger.init({logToFile: true})
		rotatedlogger.log(value[0], value[1])
		process.stdout.write = wr

		assert.deepEqual(aWrite, eWrite)
		assert.deepEqual(Object.keys(aOn).sort(), eOn.sort())
		for (var e in aOn) assert.equal(typeof aOn[e], 'function')
		assert.deepEqual(Object.keys(aTOn).sort(), eTOn.sort())
		for (var e in aTOn) assert.equal(typeof aTOn[e], 'function')
	},
	'after': function () {
		process.stdout.write = wr
		fs.createWriteStream = cws
		perioder.TimeEmitter = te
	},
}