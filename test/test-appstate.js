// test-appstate.js
// © Harald Rudell 2012 MIT License

var appstate = require('../lib/appstate')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppState'] = {
	'Exports': function () {
		assert.exportsTest(appstate, 1)
	},
	'TODO': function () {
	},
}