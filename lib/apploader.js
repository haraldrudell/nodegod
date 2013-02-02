// apploader.js
// Load and instantiate apps
// © Harald Rudell 2012 MIT License

var appentity = require('./appentity')
var parentloader = require('./parentloader')
var appfileloader = require('./appfileloader')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

exports.AppLoader = AppLoader

var states = ['run', 'debug', 'stop']

/*
appLoaderOpts: object
.signal: boolean
.parentFolder: string fully qualified path to folder
.appFiles: array of string: fully qualified paths to files
.apps: object key: app identifier, value: AppEntity
*/
function AppLoader(appLoaderOpts, errEmitter) {
	this.load = load

	function load(cb) { // load data from parent process and all app Files
		var isError
		var cbCounter = 3
		var parentApps = {}
		var appFileApps = {}
		var launchBrowser

		parentloader.load(parentDataReceiver)
		appfileloader.loadAppFiles(appLoaderOpts.appFiles, fileDataReceiver)
		doneLoading()

		function parentDataReceiver(err, result) {
			if (result) {
				if (result.appMap) parentApps = result.appMap
				if (result.time) appLoaderOpts.launchTime = result.time
			}
			doneLoading(err)
		}

		function fileDataReceiver(err, appConfigs) {
			if (!err) appFileApps = appConfigs
			doneLoading(err)
		}

		function doneLoading(err) {
			if (!err) {
				if (!--cbCounter) updateAppEntity()
			} else if (!isError) {
				isError = true
				cb(err)
			}
		}

		/*
		appFileApps: the apps we should have
		parentApps: the apps that are currently running
		appLoaderOpts.apps: the apps frontend has configured

		app structure in config file json:
		key: app Name
		.id: optional string default derived from App name: app id
		.state: optional string default run: state on Node God launch, any of 'run', 'debug', 'stop'
		.folder: optional string folder: app launch folder default app id, absolute path or relative to Node God's parent folder
		.start: optional array of string: launch command and arguments for app, default ['node', .folder + '/app']
		.debug: optional array of string: debug launch command and arguments for app, default ['node', '--debug-brk', .folder + '/app']
		.watchFiles: optional string or regexp or array of those, default none: file to watch for app restart
		.watchCopy: optional object default none: key: destination path, value: source path
		- paths to file or folder, relative to .folder
		.signal boolean default from Node God settings: whether process accepts SIGUSR2 signal
		*/
		function updateAppEntity() {

			var feApps = {} // key: app id configured in frontend
			for (var appId in appLoaderOpts.apps) feApps[appId] = true

			var pApps = {} // key: app id that parent process has running
			for (var appId in parentApps) pApps[appId] = true
			for (var appId in appFileApps) { // create or update front end AppEntity instances
				var o = getAppConfig(appFileApps[appId], appId)
				if (!feApps[o.id]) appLoaderOpts.apps[o.id] = new appentity.AppEntity(o, parentApps[o.id]) // app is new to frontend
					.on('data', appLoaderOpts.appListener)
					.on('error', getErrorListener(o.id))
				else appLoaderOpts.apps[o.id].update(o)
				delete feApps[o.id]
				delete pApps[o.id]
			}

			for (var appId in feApps) { // close front end apps
				var appEntity = appLoaderOpts[o.id]
				delete appLoaderOpts[o.id]
				appEntity.close()
				appEntity.removeAllListener()
				delete pApps[o.id]
			}

			for (var appId in pApps) { // kill spurious patent process apps
				// TODO
			}

			if (launchBrowser) {
				appLoaderOpts.launchedBrowser = true
				haraldutil.browseTo(launchBrowser)
			}

			cb()
		}

		function getErrorListener(appId) {
			return listener

			function listener(err) {
				errEmitter.emit('error', new Error(appId + ': ' + err.message))
			}
		}

		function getAppConfig(fileApp, appId) {
			var o = {
				id: appId,
				name: fileApp.name,
			}

			o.state = states[fileApp.state || 0] ||  states[0]

			o.folder = path.resolve(appLoaderOpts.parentFolder, String(fileApp.folder || o.id)) // absolute path

			o.start = Array.isArray(fileApp.start) ? fileApp.start.map(makeString) :
				['node', path.join(o.folder, 'app')]

			o.debug = Array.isArray(fileApp.debug) ? fileApp.debug.map(makeString) :
				['node', '--debug-brk', path.join(o.folder, 'app')]

			o.watchFiles = typeof fileApp.watchFiles === 'string' || fileApp.watchFiles instanceof RegExp ? [fileApp.watchFiles] :
				Array.isArray(fileApp.watchFiles) ? fileApp.watchFiles.map(makeStringOrRegExp) :
				[]

			o.watchFileExclude = Array.isArray(fileApp.watchFileExclude) ? fileApp.watchFileExclude.map(makeString) :
				[]

			o.watchCopy = {}
			for (var dest in fileApp.watchCopy)
				o.watchCopy[
					path.resolve(o.folder, String(dest))] =
					path.resolve(o.folder, String(fileApp.watchCopy[dest]))

			o.signal = fileApp.signal != null ? !!fileApp.signal : appLoaderOpts.signal

			if (fileApp.launchBrowser && !appLoaderOpts.launchedBrowser) launchBrowser = fileApp.launchBrowser

			return o
		}

		function makeString(v) {
			return String(v)
		}

		function makeStringOrRegExp(v) {
			return v instanceof RegExp ? v : String(v)
		}
	}
}
