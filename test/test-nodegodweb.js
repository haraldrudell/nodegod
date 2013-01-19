// test-nodegodweb.js
// © Harald Rudell 2012 MIT License

var nodegodweb = require('../lib/nodegodweb')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
exports['NodegodWeb'] = {
	'Exports': function () {
		assert.exportsTest(nodegodweb, 1)
	},
	'TODO': function () {
	},
}