// test-masterprocess.js
// © Harald Rudell 2013 MIT License

var nodegodmaster = require('../lib/master/nodegodmaster')

// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')


var run = nodegodmaster.run

exports['Master Process:'] = {
	'Require': function () {
		var aRun = []
		nodegodmaster.run = function mockRun(o) {aRun.push(o)}

		require('../masterprocess')

		assert.equal(aRun.length, 1)
		var opts = aRun[0]
		assert.ok(opts)
		assert.equal(typeof opts.port, 'number')
		assert.equal(typeof opts.appIdentifier, 'string')
		var spawn = opts.spawnWeb
		assert.ok(spawn)
		assert.equal(typeof spawn.file, 'string')
		assert.ok(Array.isArray(spawn.args))
		var spawn = opts.spawnLog
		assert.ok(spawn)
		assert.equal(typeof spawn.file, 'string')
		assert.ok(Array.isArray(spawn.args))
	},
	'after': function () {
		nodegodmaster.run = run
	},
}