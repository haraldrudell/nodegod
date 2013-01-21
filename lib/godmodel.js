// godmodel.js
// Execute on configuration files
// © Harald Rudell 2012 MIT License

require = require('apprunner').getRequire(require)

var getfilenames = require('./getfilenames')
var pidlink = require('./pidlink')
var appentity = require('./appentity')
var masterlink = require('./masterlink')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')
// https://github.com/haraldrudell/haraldutil
// https://github.com/haraldrudell/haraldops
var haraldops = require('haraldops')
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

;[
loadAppFiles, reloadAppFiles, getApps, getApp,
].forEach(function (f) {exports[f.name] = f})

var time500ms = 500
var defaultAppsFilename = 'apps'

var masterLinkWait = time500ms
var appFiles = {}
var apps = {}
var parentFolder
var launchedBrowser
var signal = false
var tmpFolder = haraldutil.getTmpFolder()

function loadAppFiles(defaults) {
	if (!defaults) defaults = {}
	var appData = apprunner.getAppData()
	var appMap

	if (typeof defaults.signal === 'boolean') signal = defaults.signal
	parentFolder = path.join(appData.launchFolder, '..') // default parentFolder is the parent folder of our application folder
	pidlink.init({folder: tmpFolder})

	var cbCounter = 2

	loadParentData(parentDataReceiver)

	// find app configuration files
	var defaultAppConfigFileFolder = appData.defaultsFile ? path.dirname(appData.defaultsFile) : appData.launchFolder
	var appConfigFiles = getfilenames.getFileArray(
		defaults.appFiles || path.join(defaultAppConfigFileFolder, defaultAppsFilename),
		defaultAppConfigFileFolder,
		'json')

	doneLoading()

	function parentDataReceiver(appMapFromMaster) {
		appMap = appMapFromMaster
		doneLoading()
	}

	function doneLoading() {
		if (!--cbCounter) {
			appConfigFiles.forEach(function (filename) {
				processAppFile(filename, appMap)
				appFiles[filename] = true
			})
		}
	}

}

function loadParentData(cb) {
	var result
	var timer = setTimeout(end, masterLinkWait)

	masterlink.on('message', parseMessage)
	masterlink.write({getMap: 1})

	function parseMessage(data) {
		if (data.appMap) {
			result = data.appMap
			end(true)
		}
		if (data.launchTime && typeof data.launchTime == 'number') require('./routes/godview').setTitle(undefined, data.launchTime)
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

/*
key is app name
name printable app name
script
state: initial state of the app
watchFiles
*/
function processAppFile(filename, appMap) {
	console.log('Processing:', filename)
	loadParentData(function (data) {})

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