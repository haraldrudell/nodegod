// test-processfinder.js
// © Harald Rudell 2012

var processfinder = require('../lib/master/processfinder')

// http://nodejs.org/api/fs.html
var fs = require('fs')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var rf = fs.readFile
var stsy = fs.statSync
var pk = process.kill
var wf = fs.writeFile

exports['ProcessFinder:'] = {
	'IsProcessMaster': function(done) {
		var pid = 17
		var appId = 'abc'
		var aFile
		var aKill = 0

		fs.readFile = mockReadFile
		fs.statSync = mockStatSync
		process.kill = mockKill
		fs.writeFile = mockWriteFile
		processfinder.isProcessMaster(appId, 5, isResult)

		function isResult(isMaster) {
			assert.equal(isMaster, pid)
			assert.ok(~aFile.indexOf(appId + '.pid'))
			assert.equal(aKill, 1)

			process.kill = mockThrow
			processfinder.isProcessMaster(appId, 5, nextResult)
		}

		function nextResult(isMaster) {
			assert.strictEqual(isMaster, true)

			done()
		}

		function mockThrow() {
			var e = new Error()
			e.errno = 'ESRCH'
			throw e
		}
		function mockWriteFile(a, b, cb) {
			cb()
		}
		function mockKill() {
			aKill++
		}
		function mockReadFile(file, encoding, cb) {
			aFile = file
			cb(null, pid)
		}
		function mockStatSync(f) {
			return {
				isDirectory: function () {
					return true
				},
				isFile: function () {
					return false
				}
			}
		}
	},
	'after': function() {
		fs.readFile = rf
		fs.statSync = stsy
		process.kill = pk
		fs.writeFile = wf
	},
}