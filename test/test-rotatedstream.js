// test-rotatedlogger.js
// © Harald Rudell 2013 MIT License

var rotatedstream = require('../lib/rotatedstream')

var perioder = require('../lib/perioder')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var wr = process.stdout.write
var cws = fs.createWriteStream
var te = perioder.TimeEmitter
var stsy = fs.statSync
var ren = fs.rename

exports['RotatedStream:'] = {
	'Exports': function () {
		assert.exportsTest(rotatedstream, 1)
	},
	'Constructor': function (done) {
		fs.statSync = function mockStatSync(f) {return {isFile: function () {}, isDirectory: function () {return true}}}

		fs.createWriteStream = function mockCreateWriteStream(f, o) {return {once: function () {return this}}}

		perioder.TimeEmitter = function mockTimeEmitter(o) {return {on: function () {return this}}}

		var actual = new rotatedstream.RotatedStream()
			.once('error', errorListener)
		process.nextTick(checkActual) // allow for an error to be emitted

		function checkActual() {
			assert.ok(actual.writable)
			assert.equal(actual.filename , path.join(process.env[process.platform === 'win32' ?
				'USERPROFILE' :
				'HOME'], 'log/applog.log'))

			done()
		}

		function errorListener(err) {
			assert.equal(err, null)
		}
	},
	'Constructor Opts': function (done) {
		var opts = {
			flags: 'FLAGS',
			logFile: 'LOGFILE',
			logSubfolder : 'SUBFOLDER',
			logFileExt: 'EXT',
			rotating: 'ROTATING'
		}
		fs.statSync = function mockStatSync(f) {return {isFile: function () {}, isDirectory: function () {return true}}}

		fs.createWriteStream = function mockCreateWriteStream(f, o) {
			assert.equal(o, opts.flags)
			return {once: function () {return this}}}

		perioder.TimeEmitter = function mockTimeEmitter(o) {
			assert.equal(o, opts.rotating)
			return {on: function () {return this}}}

		var actual = new rotatedstream.RotatedStream(opts)
		process.nextTick(checkActual) // allow for an error to be emitted

		function checkActual() {
			assert.ok(actual.writable)
			assert.equal(actual.filename , path.join(process.env[process.platform === 'win32' ?
				'USERPROFILE' :
				'HOME'], opts.logSubfolder, opts.logFile + opts.logFileExt))

			done()
		}

		function errorListener(err) {
			assert.equal(err, null)
		}
	},
	'Write': function (done) {
		var str = 'STR'
		fs.statSync = function mockStatSync(f) {return {isFile: function () {}, isDirectory: function () {return true}}}

		var aWrite = []
		var eWrite = [str]
		function mockWrite(s) {aWrite.push(s)}

		fs.createWriteStream = function mockCreateWriteStream(f, o) {return {
			once: function () {return this},
			write: mockWrite,
		}}

		perioder.TimeEmitter = function mockTimeEmitter(o) {return {on: function () {return this}}}

		var actual = new rotatedstream.RotatedStream()
			.once('error', errorListener)
		process.nextTick(doWrite) // allow for an error to be emitted

		function doWrite() {
			actual.write(str)
			assert.deepEqual(aWrite, eWrite)

			done()
		}

		function errorListener(err) {
			assert.equal(err, null)
		}
	},
	'Rotate': function (done) {
		fs.statSync = function mockStatSync(f) {return {isFile: function () {}, isDirectory: function () {return true}}}

		function mockWrite(s) {}

		var aOpen = 0
		fs.createWriteStream = function mockCreateWriteStream(f, o) {aOpen++; return {
			once: function () {return this},
			write: mockWrite,
			end: function () {Array.prototype.slice.call(arguments).pop()()},
		}}

		perioder.TimeEmitter = function mockTimeEmitter(o) {return {on: function () {return this}}}

		var actual = new rotatedstream.RotatedStream()
			.once('error', errorListener)
		process.nextTick(checkActual) // allow for an error to be emitted

		function checkActual() {
			actual.write()

			fs.rename = function (a, b, c) {Array.prototype.slice.call(arguments).pop()()}

			actual.rotate(checkRotate)
		}

		function checkRotate() {
			assert.ok(actual.writable)
			assert.equal(aOpen, 2)

			done()
		}

		function errorListener(err) {
			assert.equal(err, null)
		}
	},
	'Close': function (done) {
		fs.statSync = function mockStatSync(f) {return {isFile: function () {}, isDirectory: function () {return true}}}

		var aEnd = 0
		fs.createWriteStream = function mockCreateWriteStream(f, o) {return {
			once: function () {return this},
			end: function (a, x) {aEnd++; Array.prototype.slice.call(arguments).pop()()},
		}}

		var aCancel = 0
		perioder.TimeEmitter = function mockTimeEmitter(o) {return {
			on: function () {return this},
			cancel: function () {aCancel++},
			removeListener: function () {},
		}}

		var actual = new rotatedstream.RotatedStream()
			.once('error', errorListener)
		process.nextTick(checkActual) // allow for an error to be emitted

		function checkActual() {
			actual.close()

			assert.ok(aCancel)
			assert.ok(aEnd)

			done()
		}

		function errorListener(err) {
			assert.equal(err, null)
		}
	},
	'after': function () {
		process.stdout.write = wr
		fs.createWriteStream = cws
		perioder.TimeEmitter = te
		fs.statSync = stsy
		fs.rename = ren
	},
}