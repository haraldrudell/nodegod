// test-masterlink.js
// © Harald Rudell 2013 MIT License

var masterlink = require('../lib/masterlink')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['MasterLink:'] = {
	'Exports': function () {
		assert.exportsTest(masterlink, 4)
	},
	'TODO': function () {
	},
}