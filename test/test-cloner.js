// test-cloner.js
// © Harald Rudell 2013 MIT License

var cloner = require('../lib/cloner')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Cloner:'] = {
	'Exports': function () {
		assert.exportsTest(cloner, 1)
	},
	'Clone Primitives': function() {
		var tests = {
			undefined: undefined,
			null: null,
			boolean: true,
			number: 1,
			string: 'abc',
		}
		for (var test in tests) {
			var value = tests[test]
			var actual = cloner.clone(value)
			assert.strictEqual(actual, value, test)
		}
	},
	'Clone Objects': function() {
		var tests = {
			array: [1],
			Date: new Date(0),
			object: {a: 1},
		}
		for (var test in tests) {
			var value = tests[test]
			var actual = cloner.clone(value)
			assert.notEqual(actual, value)
			assert.deepEqual(actual, value)
		}
	},
	'Clone RegExp': function() {
		var value = /a/g
		var actual = cloner.clone(value)
		assert.notEqual(actual, value)
		;['source', 'ignoreCase', 'multiline', 'global'].forEach(function (property) {
			assert.ok(actual[property] != null)
			assert.equal(actual[property], value[property])
		})
	},
}