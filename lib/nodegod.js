// nodegod.js

var getfilenames = require('./getfilenames')
var haraldops = require('haraldops')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	loadAppFiles: loadAppFiles,
	getApps: getApps,
}

// array of apps
// app.state can be 'debug' 'run' or undefined (not running)
// app.name is human readable string 'Node.js #3'
// app.start is the start script
// app.id is identifier 'nodejs3'
// app.currentState indicates the current state, should go to state

var appFiles = {}
var apps = {}
var defaultFolder

function loadAppFiles(defaults, appJsFolder) {
	// default is the parent folder of app.js or parent of cwd
	if (!defaultFolder) defaultFolder = path.resolve(appJsFolder, '..')

	// parse each appFile
	var fileArray = getfilenames.getFileArray(defaults.appFiles, undefined, 'json')
	fileArray.forEach(function (filename) {
		var fileApps = haraldops.loadJson(filename)
		for (var appId in fileApps) {
			var appObj = fileApps[appId]
			appObj.id = appId
			if (!appObj.name) appObj.name = appId
			if (!appObj.start) {
				appObj.start = path.join(defaultFolder, appId, 'app.js')
			}
			appObj.watchFiles = getfilenames.getFileArray(appObj.watchFiles, defaultFolder, '')
			var prevObj = apps[appId]
			appObj.isDebug = isDebug
			updateApp(prevObj, appObj)
		}
	})
}

function updateApp(prevObj, appObj) {
	if (!prevObj) apps[appObj.id] = appObj
	// TODO update watchers
	// TODO update state to currentState
}

function getApps() {
	return apps
}

function isDebug() {
	return app.currentState == 'debug'
}
