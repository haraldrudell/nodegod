// nodegod.js

var getfilenames = require('./getfilenames')
var haraldops = require('haraldops')
// http://nodejs.org/api/path.html
var path = require('path')
var appentity = require('./appentity')

module.exports = {
	loadAppFiles: loadAppFiles,
	getApps: getApps,
	getApp: getApp,
}

// array of apps
// each has public and private state

var appFiles = {}
var apps = {}
var defaultFolder

function loadAppFiles(defaults, appJsFolder) {
	// default is the parent folder of app.js or parent of cwd
	if (!defaultFolder) defaultFolder = path.resolve(appJsFolder, '..')

	// parse each appFile
	// key is app identifier
	// name printable app name
	// script
	// state: initial state of the app
	// watchFiles
	var fileArray = getfilenames.getFileArray(defaults.appFiles, undefined, 'json')
	fileArray.forEach(function (filename) {
		var fileApps = haraldops.loadJson(filename)
		for (var fileAppId in fileApps) {

			// prepare the fileApp object
			var fileApp = fileApps[fileAppId]
			fileApp.id = fileAppId
			fileApp.watchFiles = getfilenames.getFileArray(fileApp.watchFiles, defaultFolder, '')
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
			}			
		}
		appFiles[filename] = true
	})
}

function getApps() {
	return apps
}

function getApp(id) {
	return apps[id]
}
