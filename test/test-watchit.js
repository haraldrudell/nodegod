// test-watchit.js
// © Harald Rudell 2013 MIT License

var watchit = require('../lib/watchit')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['WatchIt:'] = {
	'Exports': function () {
		assert.exportsTest(watchit, 1)
	},
	'TODO': function () {
	},
}