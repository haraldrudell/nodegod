// test-godcontrol.js
// © Harald Rudell 2013 MIT License

var godcontrol = require('../lib/godcontrol')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GodControl'] = {
	'Exports': function () {
		assert.exportsTest(godcontrol, 1)
	},
	'TODO': function () {
	},
}