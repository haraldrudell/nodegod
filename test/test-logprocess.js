// test-logprocess.js
// © Harald Rudell 2013 MIT License

var apprunner = require('apprunner')
var haraldops = require('haraldops')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var hi = haraldops.init
var ia = apprunner.initApp
var argv = process.argv

exports['Log Process:'] = {
	'Require': function () {
		var aInit = []
		apprunner.initApp = function mockInitApp(o) {aInit.push(o)}
		haraldops.init = function mockInit(o) {return o}

		var mockArgv = process.argv = ['a', 'b', 'c']

		require('../logprocess')

		assert.equal(aInit.length, 1, 'logprocess was already required')
		var opts = aInit[0]
		assert.ok(opts)
		assert.equal(typeof opts.appName, 'string')
		assert.ok(opts.api)
		assert.ok(opts.api.apiMap)
		assert.ok(opts.api.apiMap.fslogpipe)
		var api = opts.api.apiMap.fslogpipe
		assert.ok(api.onLoad)
		assert.equal(api.logName, mockArgv[2])
	},
	'after': function () {
		haraldops.init = hi
		apprunner.initApp = ia
		process.argv = argv
	},
}