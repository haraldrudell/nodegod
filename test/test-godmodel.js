// test-godmodel.js
// © Harald Rudell 2013 MIT License

var godmodel = require('../lib/godmodel')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GodModel'] = {
	'Exports': function () {
		assert.exportsTest(godmodel, 1)
	},
	'TODO': function () {
	},
}
