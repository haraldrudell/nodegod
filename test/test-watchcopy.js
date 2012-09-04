// test-watchcopy.js

var watchcopy = require('../lib/watchcopy')

// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')

module.exports = {
//	testCopyTree: testCopyTree,
}

var slogan = path.basename(__filename, path.extname(__filename))
var folder = 'data'
var file = 'from.txt'
var fromFolder = path.join(__dirname, folder, 'fromfolder')
var toFolder = path.join(__dirname, folder, 'tofolder')
var toFolder2 = path.join(__dirname, folder, 'tofolder2')
var fromFile = path.join(fromFolder, file)
var toFile = path.join(toFolder, file)
var toFile2 = path.join(toFolder2, file)

function testCopyTree(test) {
	var data = new Date().toISOString()
	var restarts = 0
	var restartReady = 0

	// crate an instance to test
	var wc = watchcopy.watchCopy()

	// clear possible test data
	clearFolderEntries(toFolder, function (err) {
		if (err) throw err
		clearFolderEntries(toFolder2, function (err) {
			if (err) throw err

			// set timer to really fast: 1 ms
			wc.setTime(1)

			// perform initial copying
			var o = {}
			o[toFolder] = fromFolder
			wc.init(o, null, restartFunc, function (err) {
				console.log(slogan, 'wc.init callback')
				if (err) throw err

				// verify copying
				test.equal(fs.readdirSync(toFolder).length, 2)
				test.equal(fs.readdirSync(path.join(toFolder, 'subfolder')).length, 1)

				// now update a source file
				restartReady++
				fs.writeFileSync(fromFile, data)
			})
		})
	})

	function restartFunc() {
		console.log(slogan, arguments.callee.name)
		if (++restarts != restartReady)test.fail('restartFunc incorectly invoked')
		else {
			test.equal(restarts, 1)

			// verify that watchcopy did copy the new data
			var toData = fs.readFileSync(toFile, 'utf8')
			test.equal(toData, data)

			var o = {}
			o[toFolder2] = fromFolder
			wc.updateCopyObject(o, null, function (err, restart) {
				console.log(slogan, 'wc.updateCopyObject callback')
				if (err) throw err
				test.equal(restart, 'update to copy object')

				// verify that watchcopy did copy the new data
				var toData = fs.readFileSync(toFile2, 'utf8')
				test.equal(toData, data)

				// shutdown
				wc.shutDown()

				test.done()			
			})
		}
	}
}

// support functions

function clearFolderEntries(folder, cb) {
	var done = final(cb)
	clearFolder(folder, false)
	done.dec()

	function clearFolder(folder, doDelete) {
		done.inc()
		fs.readdir(folder, function (err, files) {
			if (!err) {
				var entryCounter = final(rmFolder)
				files.forEach(function (entry) {
					var fq = path.join(folder, entry)
					entryCounter.inc()
					if (haraldutil.getType(fq) === true) {
						fs.unlink(fq, entryCounter.dec)
					} else {
						clearFolder(fq, true)
						entryCounter.dec()
					}
				})
				entryCounter.dec()

				function rmFolder(err) {
					if (!err && doDelete) fs.rmdir(folder, done.dec)
					else done.dec(err)
				}
			} else done.dec(err)
		})
	}
}

function final(cb) {
	var pending = 1
	var done = false

	return {
		inc: function () {
			pending++
		},
		dec: function (err) {
			if (err) {
				done = true
				if (cb) cb(err)
				else throw err
			} else if (!done && --pending == 0) {
				done = true
				if (cb) cb()
			}
		},
	}
}