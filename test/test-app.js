// test-app.js
// © Harald Rudell 2013 MIT License

// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')
// https://github.com/haraldrudell/haraldops
var haraldops = require('haraldops')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var hi = haraldops.init
var ia = apprunner.initApp

exports['App:'] = {
	'Require': function () {
		var aInit = []
		apprunner.initApp = function mockInitApp(o) {aInit.push(o)}
		haraldops.init = function mockInit(o) {return o}

		require('../app')

		assert.equal(aInit.length, 1, 'app was already required')
		var defaults = aInit[0]
		assert.ok(defaults)
		assert.equal(typeof defaults.appName, 'string')
		assert.ok(defaults.api)
		assert.ok(defaults.api.apiMap)
		var opts = defaults.api.apiMap.masterlauncher
		assert.ok(opts)
		assert.ok(opts.onLoad)
		assert.ok(opts.spawn)
		assert.equal(typeof opts.spawn.file, 'string')
		assert.ok(Array.isArray(opts.spawn.args))
	},
	'after': function () {
		haraldops.init = hi
		apprunner.initApp = ia
	},
}