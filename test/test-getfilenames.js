// test-getfilenames.js
// © Harald Rudell 2013 MIT License

var getfilenames = require('../lib/getfilenames')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GetFilenames'] = {
	'Exports': function () {
		assert.exportsTest(getfilenames, 1)
	},
	'TODO': function () {
	},
}