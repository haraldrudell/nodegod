// defaultstest.js
// unit test for defaults.js
// https://github.com/caolan/nodeunit
// http://nodejs.org/docs/latest/api/all.html

var jsonloader = require('../lib/jsonloader')

exports.testDefaults = testDefaults
exports.testGetOpts = testGetOpts

function testDefaults(test) {

	// test a file that works
	var expected = { five: 5 }
	// folder as string
	var actual = jsonloader.loadSettings('ops', __dirname + '/data', true)
	test.deepEqual(actual, expected, 'data/ops.json read incorrectly')
	// folders as array
	var actual = jsonloader.loadSettings('ops', [ '/%^$', '/###', __dirname + '/data' ] , true)
	test.deepEqual(actual, expected, 'data/ops.json read incorrectly')

	// test a file that does not exist
	test.throws(
		function () {
			jsonloader.loadSettings('ops-none', __dirname + '/data', true)
		},
		function (err) {
			test.ok(err instanceof Error,
				'Reading a non-existent file does not throw exception'
				)
			return true
		})

	// test bad json
	test.throws(
		function () {
			var actual = jsonloader.loadSettings('opsbad', __dirname + '/data', true)
		},
		function(err) {
			test.ok(err instanceof SyntaxError,
				'Syntax errors in file does not throw SyntaxError exception')
			return true
		})

	test.done()
}

function testGetOpts(test) {
	// check that object is created
	test.deepEqual(jsonloader.getOpts(), {}, "getOpts did not produce empty object")

	// check default option
	var defaultOpts = { hey: 'hello' }
	test.deepEqual(jsonloader.getOpts({}, defaultOpts), defaultOpts, "getOpts did not honor defaultOpts")
	// check mustHave
	var mustHave = [ 'hey' ]
	test.deepEqual(jsonloader.getOpts({}, defaultOpts, mustHave), defaultOpts, "getOpts did not honor defaultOpts with mustHave")
	// check missing must have
	test.throws(
		function () {
			jsonloader.getOpts(undefined, undefined, mustHave)
		}, function (err) {
			test.ok(err instanceof Error, 'defaultOpts does not throw exception for missing mustHave')
			return true
		})
	test.done()
}
