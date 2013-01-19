// test-app.js
// © Harald Rudell 2013 MIT License

var nodegodmaster = require('../lib/master/nodegodmaster')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var run = nodegodmaster.run

exports['App:'] = {
	'Require': function () {
		var aRun = []
		nodegodmaster.run = function mockRun(o) {aRun.push(o)}

		require('../app')

		assert.equal(aRun.length, 1)
		var opts = aRun[0]
		assert.ok(opts)
		assert.equal(typeof opts.port, 'number')
		assert.equal(typeof opts.appIdentifier, 'string')
		assert.ok(Array.isArray(opts.launchArray))
		assert.ok(Array.isArray(opts.fsLogArray))
	},
	'after': function () {
		nodegodmaster.run = run
	},
}