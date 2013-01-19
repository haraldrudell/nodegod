// test-pidlink.js
// © Harald Rudell 2013 MIT License

var pidlink = require('../lib/pidlink')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['UiManager:'] = {
	'Exports': function () {
		assert.exportsTest(pidlink, 2)
	},
	'TODO': function () {
	},
}