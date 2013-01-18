// test-rotatedlogger.js
// © Harald Rudell 2013 MIT License

var rotatedlogger = require('../lib/rotatedlogger')
var rotatedstream = require('../lib/rotatedstream')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var wr = process.stdout.write
rs = rotatedstream.RotatedStream

exports['RotatedLogger:'] = {
	'Exports': function () {
		assert.exportsTest(rotatedlogger, 1)
	},
	'Construction': function () {
		var actual = new rotatedlogger.RotatedLog()
		assert.ok(actual)
	},
	'Configure': function () {
		var opts = {
			stdout: false,
			file: true,
			streamOpts: 'OPTS',
			filename: 'FILE',
		}

		rotatedstream.RotatedStream = function mockRotatedStream() {
			this.once = function mockOn() {return this}
			this.writable = true
			this.filename = opts.filename
		}
		var instance = new rotatedlogger.RotatedLog()
		instance.configure(opts)

		var actual = instance.configure()

		assert.deepEqual(actual, opts)
	},
	'Write Close': function () {
		var str = 'STR'

		var aWrite = []
		var eWrite = [str, str]
		function mockWrite(x) {aWrite.push(x)}

		var aClose = 0
		rotatedstream.RotatedStream = function mockRotatedStream() {
			this.once = function mockOn() {return this}
			this.write = mockWrite
			this.writable = true
			this.close = function mockClose() {aClose++}
		}

		var instance = new rotatedlogger.RotatedLog({file: true})
		process.stdout.write = mockWrite
		instance.write(str)
		process.stdout.write = wr

		assert.deepEqual(eWrite, aWrite)

		instance.close()
		assert.ok(aClose)
	},
	'Log': function () {
		var value = ['value: %s', 123]
		var eValue = 'value: ' + value[1] + '\n'

		var aWrite = []
		var eWrite = [eValue, eValue]
		function mockWrite(x) {aWrite.push(x)}

		rotatedstream.RotatedStream = function mockRotatedStream() {
			this.once = function mockOn() {return this}
			this.write = mockWrite
			this.writable = true
		}

		var instance = new rotatedlogger.RotatedLog({file: true})
		process.stdout.write = mockWrite
		instance.log.apply(instance, value)
		process.stdout.write = wr

		assert.deepEqual(eWrite, aWrite)
	},
	'after': function () {
		process.stdout.write = wr
		rotatedstream.RotatedStream = rs
	},
}