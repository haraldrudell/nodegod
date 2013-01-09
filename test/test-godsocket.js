// test-godsocket.js
// © Harald Rudell 2013

var godsocket = require('../lib/godsocket')
var testedModule = godsocket

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 1
var testedModuleType = 'object'
var exportsTypes = {}

exports['GodSocket'] = {
	'DISABLED': function () {var exports; exports={
	'Exports': function () {

		// if export count changes, we need to write more tests
		assert.equal(typeof testedModule, testedModuleType, 'Module type incorrect')
		assert.equal(Object.keys(testedModule).length, exportsCount, 'Export count changed')

		// all exports function
		for (var exportName in testedModule) {
			var actual = typeof testedModule[exportName]
			var expected = exportsTypes[exportName] || 'function'
			assert.equal(actual, expected, 'Incorrect type of export ' + exportName)
		}
	},
}}}