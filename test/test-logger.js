// test-logger.js
// © Harald Rudell 2013

var logger = require('../lib/master/logger')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Logger:'] = {
	'Exports': function () {
		assert.exportsTest(logger, 2)
	},
	'LogChild LogSocket': function() {
		var aOn = {}
		var eOn = ['data', 'end']
		var aEncoding = 0
		var aRemove = 0
		var std = {
			on: function (e, f) {aOn[e] = f; return this},
			once: function (e, f) {aOn[e] = f; return this},
			setEncoding: function(x) {aEncoding++},
			removeListener: function(x) {aRemove++},
		}
		var child = {
			stdout: std,
			stderr: std,
		}
		var slogan = 'SLOGAN'

		// addLogging
		logger.logChild(child, slogan, write)
		assert.equal(Object.keys(aOn).length, eOn.length)
		eOn.forEach(function (anEvent) {
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
		function write(t) {aWrite.push(t)}
		log('')
		log('\n')
		log('\n a')
		log('b \n')
		log('c\n\n')
		log('\n\nd')
		log('e\n\nf')
		log('abc\ndef\ngeh')
		log('i')
		//console.log(require('haraldutil').inspect(aWrite.join('')))
		//console.log(require('haraldutil').inspect(eWrite.join('')))
		assert.deepEqual([aWrite.join('')], [eWrite.join('')])
	},
}