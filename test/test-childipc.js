// test-childipc.js
// © Harald Rudell 2013 MIT License

var childipc = require('../lib/childipc')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Child Ipc:'] = {
	'Exports': function () {
		assert.exportsTest(childipc, 1)
	},
	'TODO': function () {
	},
}