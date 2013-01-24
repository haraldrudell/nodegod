// appfileloader.js
// Load app configurations from json files
// © Harald Rudell 2012 MIT License

// https://github.com/haraldrudell/greatjson
var greatjson = require('greatjson')
// https://github.com/haraldrudell/haraldops
var haraldops = require('haraldops')
// http://nodejs.org/api/fs.html
var fs = require('fs')

exports.loadAppFiles = loadAppFiles

function loadAppFiles(files, cb) {
	var appConfigs = {}
	var isError
	var cbCounter = files.length + 1

	files.forEach(function (fqPath) {
		readFile(fqPath, mergeData)
	})
	end()

	function mergeData(err, data) {
		if (!err) {
			if (!isError) {
				for (var appName in data) {
					var appId = data[appName].id = data[appName].id ? String(data[appName].id) : haraldops.createIdentifier(appName)
					data[appName].name = appName // save name as a property
					if (!appConfigs[appId]) appConfigs[appId] = data[appName] // now index by appid
					else {
						err = new Error('Duplicate app id: ' + appId)
						break
					}
				}
				end(err)
			}
		} else end(err)
	}

	function end(err) {
		if (!err) {
			if (!--cbCounter) cb(null, appConfigs)
		} else {
			isError = true
			cb(err)
		}
	}
}

function readFile(fqPath, cb) {
	fs.readFile(fqPath, 'utf-8', readFileResult)

	function readFileResult(err, stringData) {
		if (!err) {
			var object = greatjson.parse(stringData, reviver)
			if (!(object instanceof Error)) {
				cb(null, object)
			} else err = new Error(fqPath + ': ' + object.message)
		}
		if (err) cb(err)
	}
}

function reviver(key, value) { // comvert strings beginning 'regexp:/' to RegExp
	if (typeof value === 'string') {
		if (value.substring(0, 8) == 'regexp:/') { // 'regexp:/a/m'
			var regExpEnd = value.lastIndexOf('/')
			if (regExpEnd > 9) { // at least one char in regExp
				var regExp = value.substring(8, regExpEnd)
				var opts = value.substring(regExpEnd + 1)
				var flags = ''
				if (~opts.indexOf('i')) flags += 'i'
				if (~opts.indexOf('m')) flags += 'm'
				if (~opts.indexOf('g')) flags += 'g'
				value = new RegExp(regExp, flags)
require('haraldutil').p(value)
			}
		}
	}
	return value
}
