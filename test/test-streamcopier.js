// test-streamcopier.js
// © Harald Rudell 2013 MIT License

var streamcopier = require('../lib/streamcopier')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Stream Copier:'] = {
	'Exports': function () {
		assert.exportsTest(streamcopier, 1)
	},
	'TODO': function () {
	},
}