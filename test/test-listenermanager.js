// test-listenermanager.js
// © Harald Rudell 2013 MIT License

var listenermanager = require('../lib/listenermanager')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Listener Manager:'] = {
	'Exports': function () {
		assert.exportsTest(listenermanager, 1)
	},
	'TODO': function () {
	},
}