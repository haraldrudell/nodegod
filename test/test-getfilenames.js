// test-getfilenames.js
// © Harald Rudell 2013

var getfilenames = require('../lib/getfilenames')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GetFilenames'] = {
	'DISABLED': function () {var exports; exports={
	'Exports': function () {
		assert.exportsTest(getfilenames, 1)
	},
}}}