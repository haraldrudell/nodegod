// test-masterlauncher.js
// © Harald Rudell 2013 MIT License

var masterlauncher

// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

ga = apprunner.getAppData

exports['Master Launcher:'] = {
	'before': function () {
		apprunner.getAppData = function() {return {appName: 'Node God'}}
		masterlauncher = require('../lib/masterlauncher')
	},
	'Exports': function () {
		assert.exportsTest(masterlauncher, 1)
	},
	'TODO': function () {
	},
	'after': function () {
		apprunner.getAppData = ga
	}
}