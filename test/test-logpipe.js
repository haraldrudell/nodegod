// test-logpipe.js
// © Harald Rudell 2013 MIT License

var logpipe = require('../lib/master/logpipe')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['LogManager:'] = {
	'Exports': function () {
		assert.exportsTest(logpipe, 1)
	},
	'TODO': function () {
	},
}