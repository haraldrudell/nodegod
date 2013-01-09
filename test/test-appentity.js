// test-appentity.js
// © Harald Rudell 2012

var appentity = require('../lib/appentity')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppEntity'] = {
	'DISABLED': function () {var exports; exports={
	'Exports': function () {
		assert.exportsTest(appentity, 1)
	},
}}}