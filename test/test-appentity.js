// test-appentity.js
// © Harald Rudell 2012 MIT License

var appentity = require('../lib/appentity')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppEntity'] = {
	'Exports': function () {
		assert.exportsTest(appentity, 1)
	},
	'TODO': function () {
	},
}