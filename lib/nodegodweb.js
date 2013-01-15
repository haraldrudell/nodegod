// nodegodweb.js
// Launch Node God's Web server
// © Harald Rudell 2013

require = require('apprunner').getRequire(require, exports, {
	api: 'Node God Web', initApi: initApi,
	ready: false})

var godcontrol = require('./godcontrol')
var godview = require('../routes/godview')
// https://github.com/visionmedia/express
var express = require('express')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')

function initApi(opts) {
	var appData = apprunner.getAppData()
	var app = module.exports = express.createServer()

	// Configuration
	godview.setTitle(appData.appName)
	godcontrol.init(app, opts)
	app.configure(function(){
		app.set('views', appData.launchFolder + '/views')
		app.set('view engine', 'ejs')
	//3	app.use(express.favicon())
		app.use(express.bodyParser())
	//3	app.use(express.methodOverride())
	//3	app.use(express.cookieParser(defaults.sessionSecret))
		app.use(express.cookieParser())
	//3	app.use(express.session())
		app.use(express.session({ secret: opts.sessionSecret }))
		app.use(express.methodOverride())
		app.use(app.router)
		app.use(express.static(appData.launchFolder + '/public'))
	})
	/*
	require('ejsinbrowser').writeScript({
		folder: app.settings.views,
		ext: app.settings['view engine'],
		jsGlobalVariable: 'NODEGOD',
		templates: 'partials',
		filename: __dirname + '/public/javascripts/templates.js'})
	*/
	app.configure('development', function(){
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
	})
	app.configure('production', function(){
		app.use(express.errorHandler())
	})

	app.get('/', godview.index)

	/*3
	app.listen(defaults.PORT, function(){
		console.log("Express server listening on port %d in %s mode",
			defaults.PORT,
			app.settings.env)
	})
	*/
	app.listen(opts.port, opts.interface)

	console.log('Application %s on %s:%s node %s express %s %s mode',
		appData.appName,
		opts.interface || 'all',
		opts.port,
		process.version,
		express.version,
		app.settings.env)
}