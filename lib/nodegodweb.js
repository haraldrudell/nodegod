// nodegodweb.js
// Launch Node God's Web server
// © Harald Rudell 2013 MIT License

require = require('apprunner').getRequire(require, exports, {
	api: 'Node God Web', initApi: initApi,
	ready: false})

var godcontrol = require('./godcontrol')
var godsocket = require('./godsocket')
var godmodel = require('./godmodel')
var godview = require('./routes/godview')
// https://github.com/visionmedia/express
var express = require('express')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')
// http://nodejs.org/api/path.html
var path = require('path')

var instances = []

function initApi(opts) {
	var cbCounter = 2
	var appData = apprunner.getAppData()
	var log = appData.logger
	var instance = {}

	instances.push(instance)
	var godModel = instance.godModel = new godmodel.GodModel().init(opts, apisReady)

	var app = instance.app = apprunner.addErrorListener(express.createServer())
	app.configure(function(){
		app.set('views', path.join(__dirname, 'views'))
		app.set('view engine', 'ejs')
	//3	app.use(express.favicon())
		app.use(express.bodyParser())
	//3	app.use(express.methodOverride())
	//3	app.use(express.cookieParser(defaults.sessionSecret))
		app.use(express.cookieParser())
	//3	app.use(express.session())
		app.use(express.session({secret: opts.sessionSecret}))
		app.use(express.methodOverride())
		app.use(app.router)
		app.use(express.static(path.join(__dirname, 'public')))
	})
	app.configure('development', function(){
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
	})
	app.configure('production', function(){
		app.use(express.errorHandler())
	})
	app.get('/', godview.index)
	apisReady()

	function apisReady(err) {
		if (true || !err) {
			if (!--cbCounter) {
				godview.setOpts({
					appName: appData.appName,
					launchTime: godModel.getLaunchTime(),
					appsDataFactory: godModel.getAppsData,
				})
				var godSocket = instance.godSocket = new godsocket.GodSocket({app: app, log: log})
				instance.godControl = new godcontrol.GodControl({godModel: godModel, godSocket: godSocket})
				app.listen(opts.port, opts.interface, appReady) // either callback or 'error' event
			}
		} else endBad(err)
	}

	function endBad(err) {
		log(appData.appName, 'initialization failed:', err.stack || err.message || err)
		throw err
	}

	function appReady(err) {
		if (!err) {
			log(appData.appName, opts.url)
			log('port:', (opts.interface || 'any') + ':' + opts.port,
				'node:', process.version,
				'express:', express.version, app.settings.env,
				'process:', process.pid)
		} else endBad(err)
	}
}