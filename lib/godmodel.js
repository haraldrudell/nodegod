// nodegod.js

var getfilenames = require('./getfilenames')
var apprunner = require('apprunner')
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

	// initialize a file store used to store pids of running apps
	// we use these if we happen to crash :)
	var myStore = store.get(path.join(
		defaults.init.tmpFolder,
		defaults.init.identifier + 'store.json'))
	appentity.setStore(myStore)

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
	fileArray.forEach(function (filename) {
		processAppFile(filename)
		appFiles[filename] = true
	})
}

// key is app name
// name printable app name
// script
// state: initial state of the app
// watchFiles
function processAppFile(filename) {
	console.log('Processing:', filename)
console.log(arguments.callee.name, filename)
	var fileObject = haraldops.loadSettings(filename)
	for (var appName in fileObject) {

		// parse the fileApp object
		var fileApp = fileObject[appName]
		var o = {}
		o.name = appName
		o.id = fileApp.id || haraldops.createIdentifier(appName)
		o.folder = fileApp.folder || path.join(parentFolder, o.id)
		o.start = fileApp.start || path.join(o.folder, 'app.js')
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
			app = new appentity.AppEntity(o)
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
