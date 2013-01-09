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
	'Write': function () {
		var value = '123'
		var eValue = value + '\n'

		var aWrite = []
		var eWrite = [eValue, eValue]
		function mockWrite(x) {aWrite.push(x)}

		var aOn = {}
		function mockOn(e, f) {aOn[e] = f; return this}
		fs.createWriteStream = function mockCreateWriteStream(x) {return {on: mockOn, write: mockWrite}}

		var aTe = 0
		perioder.TimeEmitter = function MockTimeEmitter() {this.on = function () {}; aTe++}


		process.stdout.write = mockWrite
		rotatedlogger.log(value)
		process.stdout.write = wr
		assert.deepEqual(aWrite, eWrite)
		assert.ok(aTe)
		assert.equal(typeof aOn.error, 'function')
	},
	'after': function () {
		process.stdout.write = wr
		fs.createWriteStream = cws
		perioder.TimeEmitter = te
	},
}