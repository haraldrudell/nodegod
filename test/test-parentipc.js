// test-parentipc.js
// © Harald Rudell 2013 MIT License

var parentipc = require('../lib/parentipc')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Parent Ipc:'] = {
	'Exports': function () {
		assert.exportsTest(parentipc, 1)
	},
	'TODO': function () {
	},
}