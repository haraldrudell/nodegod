// test-webprocess.js
// © Harald Rudell 2013 MIT License

var apprunner = require('apprunner')
var haraldops = require('haraldops')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var hi = haraldops.init
var ia = apprunner.initApp

exports['Web Process:'] = {
	'Require': function () {
		var aInit = []
		apprunner.initApp = function mockInitApp(o) {aInit.push(o)}
		haraldops.init = function mockInit(o) {return o}

		require('../webprocess')

		assert.equal(aInit.length, 1, 'webprocess was already required')
		var opts = aInit[0]
		assert.ok(opts)
		assert.equal(typeof opts.appName, 'string')
		assert.ok(opts.api)
		assert.ok(opts.api.apiMap)
		assert.ok(opts.api.apiMap.nodegodweb)
		assert.ok(opts.api.apiMap.nodegodweb.onLoad)
		assert.equal(typeof opts.api.apiMap.nodegodweb.port, 'number')
		assert.equal(typeof opts.api.apiMap.nodegodweb.sessionSecret, 'string')
	},
	'after': function () {
		haraldops.init = hi
		apprunner.initApp = ia
	},
}