// test-appstate.js
// © Harald Rudell 2012 MIT License

var applink = require('../lib/applink')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppState'] = {
	'Exports': function () {
		assert.exportsTest(applink, 1)
	},
	'TODO': function () {
	},
}