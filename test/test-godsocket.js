// test-godsocket.js
// © Harald Rudell 2013 MIT License

var godsocket = require('../lib/godsocket')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GodSocket'] = {
	'Exports': function () {
		assert.exportsTest(godsocket, 1)
	},
	'TODO': function () {
	},
}