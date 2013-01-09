// test-appstate.js
// © Harald Rudell 2012

var appstate = require('../lib/appstate')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppState'] = {
	'DISABLED': function () {var exports; exports={
	'Exports': function () {
		assert.exportsTest(appstate, 1)
	},
}}}