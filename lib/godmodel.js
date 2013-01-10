// nodegod.js

var getfilenames = require('./getfilenames')
var apprunner = require('apprunner')
var pidlink = require('./pidlink')
// https://github.com/haraldrudell/haraldops
var haraldops = require('haraldops')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
var appentity = require('./appentity')
var store = require('./store')

module.exports = {
	loadAppFiles: loadAppFiles,
	reloadAppFiles: reloadAppFiles,
	getApps: getApps,
	getApp: getApp,
}

// array of apps
// each has public and private state

var appFiles = {}
var apps = {}
var parentFolder
var launchedBrowser
var signal = false

// defaults come from haraldops
function loadAppFiles(defaults) {
	var cbCounter = 2
	var appMap
	loadParentData(function (appMap0) {
		appMap = appMap0
		doneLoading()
	})
	pidlink.init({folder: defaults.init && defaults.init.tmpFolder})

	if (typeof defaults.signal == 'boolean') signal = defaults.signal

	// default parentFolder is the parent folder of our application folder
	parentFolder = path.join(defaults.init.appFolder, '..')
	try {
		apprunner.getApi({api: 'requesturl'}).setTmpFolder(defaults.init.tmpFolder)
	} catch (e) {}

	// find files containing app configurations
	var fileArray = defaults.appFiles
	var fileArrayFolder
	if (fileArray) {
		// we have a list of files: if we loaded a defaults file, default to that folder, otherwise node god's app folder
		fileArrayFolder = defaults.init.defaultsFile ? path.dirname(defaults.init.defaultsFile) : defaults.init.appFolder
	} else {
		// no list of files: search for apps.json where possible settings file is and in nodegod's app folder
		var f = 'apps'
		fileArray = [ path.join(defaults.init.appFolder, f) ]
		if (defaults.init.defaultsFile) fileArray.unshift(path.join(path.dirname(defaults.init.defaultsFile), f))
	}
	var fileArray = getfilenames.getFileArray(fileArray, fileArrayFolder, 'json')
	doneLoading()

	function doneLoading() {
		if (!--cbCounter) {
			fileArray.forEach(function (filename) {
				processAppFile(filename, appMap)
				appFiles[filename] = true
			})
		}
	}
}

function loadParentData(cb) {
	var result
	var timer = setTimeout(end, 500)
	var masterlink = require('./masterlink')
	masterlink.on('message', parseMessage)
	masterlink.write({getMap: 1})

	function parseMessage(data) {
		if (data.appMap) {
			result = data.appMap
			end(true)
		}
		if (data.launchTime && typeof data.launchTime == 'number') require('../routes/godview').setTitle(undefined, data.launchTime)
	}

	function end(isMessage) {
		masterlink.removeListener('message', parseMessage)
		var t = timer
		timer = null
		if (isMessage) {
			clearTimeout(timer)
			cb(result)
		} else cb()
	}
}

// key is app name
// name printable app name
// script
// state: initial state of the app
// watchFiles
function processAppFile(filename, appMap) {
	console.log('Processing:', filename)
	loadParentData(function (data) {})
//console.log(arguments.callee.name, filename)
	var fileObject = {}
	try {
		fileObject = haraldops.loadSettings(filename)
	} catch (e) {
		// TODO
		console.log(e)
	}
	for (var appName in fileObject) {

		// parse the fileApp object
		var fileApp = fileObject[appName]
		var o = {}
		o.name = appName
		o.id = fileApp.id || haraldops.createIdentifier(appName)
		o.folder = fileApp.folder || path.join(parentFolder, o.id)
		if (!Array.isArray(o.start = fileApp.start || path.join(o.folder, 'app.js'))) o.start = Array('node', o.start)
		if (Array.isArray(fileApp.debug)) o.debug = fileApp.debug
		o.state = fileApp.state || 'run'
		o.watchFiles = fileApp.watchFiles
		o.watchCopy = fileApp.watchCopy
		o.signal = typeof fileApp.signal == 'boolean' ?
			fileApp.signal : signal

		if (fileApp.launchBrowser && !launchedBrowser) {
			launchedBrowser = true
			haraldutil.browseTo(fileApp.launchBrowser)
		}

		// update or create the app entity
		var app = apps[o.id]
		if (app) app.update(o)
		else {
			var parentData = appMap && appMap[o.id]
			app = new appentity.AppEntity(o, parentData)
			apps[o.id] = app
		}
	}
}

function reloadAppFiles() {
	// TODO handle apps that are deleted
	for (filename in appFiles) {
		processAppFile(filename)
	}
}

function getApps() {
	return apps
}

function getApp(id) {
	return apps[id]
}
