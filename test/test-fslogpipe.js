// test-fslogpipe.js
// © Harald Rudell 2013 MIT License

var fslogpipe = require('../lib/fslogpipe')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['FsLogPipe:'] = {
	'Exports': function () {
		assert.exportsTest(fslogpipe, 1)
	},
	'TODO': function () {
	},
}