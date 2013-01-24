// godmodel.js
// Create and manage Node God's front-end AppEntity objects
// © Harald Rudell 2012 MIT License

var apploader = require('./apploader')
var treewalker = require('./treewalker')
var pidlink = require('./pidlink')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

exports.GodModel = GodModel

var defaultAppsFilename = 'apps'
var defaultAppsFileExt = '.json'

/*
Initialize Node God's app management
defaults: optional object
.signal: optional boolean default false: if managed apps handles SIGURS2 by default
.appFiles: string or array of string, default 'apps': file or folder-tree of files containing json app configurations
- default folder for relative path AppFiles is Node God's app configuration file folder or Node God's launch folder
- default extension for file is '.json'

emits: 'data' json-object
*/
function GodModel() {
	var self = this
	events.EventEmitter.call(this)
	this.init = init
	this.reload = reload
	this.getLaunchTime = getLaunchTime
	this.write = write
	this.getAppsData = getAppsData
	var appLoader
	var appLoaderOpts = {apps: {}}
	var log = console.log

	function write(appId, data, cb) {
		log('Request:', appId, data)
		self.emit(new Error('Hello'))
		var appEntity = appLoaderOpts.apps[appId]
		if (appEntity) appEntity.write(data, cb)
		else if (cb) cb(new Error('app not found: ' + appId))
	}

	function reload(cb) {
		log('Request: reload app configurations')
		if (!cb) cb = function () {}
		if (appLoader) appLoader.load(cb)
		else cb()
	}

	function getLaunchTime() {
		return appLoaderOpts.launchTime
	}

	function getAppsData() {
		log('Request: get apps')
		var result = {}
		for (var appId in appLoaderOpts.apps) result[appId] = appLoaderOpts.apps[appId].getState()
		return result
	}

	function init(defaults, cb) {
		var appData = apprunner.getAppData()
		appLoaderOpts = {
			signal: !!defaults.signal, // default false: sending a signal to a process lacking a signal handler terminates that process
			parentFolder: path.join(appData.launchFolder, '..'), // default parentFolder is the parent folder of our application folder
			appFiles: [], // array of fully qualified paths to app configuration files
			apps: {}, // key: app identifier, value AppEntity object
			appListener: appListener,
		}

		if (!defaults) defaults = {}
		if (defaults.log) log = defaults.log
		pidlink.init({folder: haraldutil.getTmpFolder()})

		// find app configuration files
		// default folder is the folder where Node God's app configuration file was, or Node God's launch folder
		var appFiles = String(defaults.appFiles || defaultAppsFilename) // get default basename for appFiles
		appFiles = path.resolve(appData.defaultsFile ? path.dirname(appData.defaultsFile) : appData.launchFolder,
			appFiles) // make appFiles a fully qualified path
		if (haraldutil.getType(appFiles) !== 1) { // it is not a folder
			if (!path.extname(appFiles)) appFiles += defaultAppsFileExt
			if (haraldutil.getType(appFiles) === true) { // it's a file
				appLoaderOpts.appFiles.push(appFiles)
				end()
			} else throw new Error('appFiles entry does not exist at: ' + appFiles)
		} else {
			var walker = new treewalker.TreeWalker({path: appFiles, folders: false})
				.on('file', pushFile)
				.once('end', end)
				.on('error', walkerError)
		}
		return self

		function pushFile(fqPath) {
			appLoaderOpts.push(fqPath)
		}

		function walkerError(err) {
			console.log(err.stack || err.message || err, Array.prototype.slice.call(arguments, 1))
			cb(err)
		}

		function end() {
			appLoader = new apploader.AppLoader(appLoaderOpts)
			appLoader.load(cb)
		}
	}

	function appListener() {
		self.emit.apply(self, ['data'].concat(Array.prototype.slice.call(arguments)))
	}
}
util.inherits(GodModel, events.EventEmitter)
