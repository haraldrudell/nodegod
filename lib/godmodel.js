// nodegod.js

var getfilenames = require('./getfilenames')
var haraldops = require('haraldops')
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
var defaultFolder

function loadAppFiles(defaults, appJsFolder) {

	var myStore = store.get(path.join(
		defaults.init.tmpFolder,
		defaults.init.identifier + 'store.json'))
	appentity.setStore(myStore)

	// default is the parent folder of app.js or parent of cwd
	if (!defaultFolder) defaultFolder = path.resolve(appJsFolder, '..')

	// parse each appFile
	var fileArray = getfilenames.getFileArray(defaults.appFiles, undefined, 'json')
	fileArray.forEach(function (filename) {
		processAppFile(filename)
		appFiles[filename] = true
	})
}

// key is app identifier
// name printable app name
// script
// state: initial state of the app
// watchFiles
function processAppFile(filename) {
	console.log('process', filename)
	var fileApps = haraldops.loadJson(filename)
	for (var fileAppId in fileApps) {

		// prepare the fileApp object
		var fileApp = fileApps[fileAppId]
		fileApp.id = fileAppId
		if (!fileApp.folder) fileApp.folder = path.join(defaultFolder, fileAppId)
		if (!fileApp.name) fileApp.name = fileAppId
		if (!fileApp.start) {
			fileApp.start = path.join(defaultFolder, fileAppId, 'app.js')
		}

		// update or create the app entity
		var app = apps[fileAppId]
		if (app) {
			app.update(fileApp)
		} else {
			app = new appentity.AppEntity(fileApp)
			apps[fileAppId] = app
			app.doCommand()
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
