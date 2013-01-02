// test-logger.js
// © Harald Rudell 2013

var logger = require('../lib/master/logger')
var testedModule = logger

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 1
var testedModuleType = 'object'
var exportsTypes = {}

w = process.stdout.write

exports['Logger:'] = {
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
	'AddLogging': function() {
		var std = {
			on: function (e, f) {aOn[e] = f; return this},
			setEncoding: function(x) {aEncoding++},
			removeListener: function(x) {aRemove++},
		}
		var child = {
			stdout: std,
			stderr: std,
		}
		var aOn = {}
		var aEncoding = 0
		var aRemove = 0
		var slogan = 'SLOGAN'
		var eEvents = ['data', 'end']

		// addLogging
		logger.addLogging(child, slogan)
		assert.equal(Object.keys(aOn).length, eEvents.length)
		eEvents.forEach(function (anEvent) {
			assert.equal(typeof aOn[anEvent], 'function')
		})
		assert.equal(aEncoding, 2)

		// cleanup
		aOn.end()
		assert.ok(aRemove)

		// log
		var log = aOn.data
		var aWrite = []
		var eWrite = ['SLOGAN\n', 'SLOGAN\n', 'SLOGAN  a', 'b \n',
			'SLOGAN c\n', 'SLOGAN\n', 'SLOGAN\n', 'SLOGAN\n',
			'SLOGAN de\n', 'SLOGAN\n', 'SLOGAN fabc\nSLOGAN def\nSLOGAN gehi']
		process.stdout.write = function (t) {aWrite.push(t)}
		log('')
		log('\n')
		log('\n a')
		log('b \n')
		log('c\n\n')
		log('\n\nd')
		log('e\n\nf')
		log('abc\ndef\ngeh')
		log('i')
		process.stdout.write = w
		//console.log(require('haraldutil').inspect(aWrite.join('')))
		//console.log(require('haraldutil').inspect(eWrite.join('')))
		assert.deepEqual([aWrite.join('')], [eWrite.join('')])

	},
	'after': function () {
		process.stdout.write = w
	}
}