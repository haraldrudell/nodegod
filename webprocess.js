// Node God
// keeps node apps running
//require('./lib/masterlink')
var defaults = require('haraldops').init({appName: 'Node God',
	appFolder: __dirname,
	sessionSecret: 'veryGreat',
	PORT: 1111 })

// https://github.com/visionmedia/express
var express = require('express')
// https://github.com/haraldrudell/apprunner
var apprunner = require('apprunner')
//apprunner.enableAnomalyMail(false)
var cbc = apprunner.getCbCounter(/*{callback: initAppResult}*/)

// get app and start error listener
var app = module.exports = express.createServer()
apprunner.initApp(defaults, app, cbc.add(initAppResult))
var godcontrol = require('./lib/godcontrol')
var godview = require('./routes/godview')

// Configuration
godview.setTitle(defaults.init.appName)
godcontrol.init(app, defaults)
app.configure(function(){
	app.set('views', __dirname + '/views')
	app.set('view engine', 'ejs')
//3	app.use(express.favicon())
	app.use(express.bodyParser())
//3	app.use(express.methodOverride())
//3	app.use(express.cookieParser(defaults.sessionSecret))
	app.use(express.cookieParser())
//3	app.use(express.session())
	app.use(express.session({ secret: defaults.sessionSecret }))
	app.use(express.methodOverride())
	app.use(app.router)
	app.use(express.static(__dirname + '/public'))
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

// Routes
app.get('/', godview.index)

/*3
app.listen(defaults.PORT, function(){
	console.log("Express server listening on port %d in %s mode",
		defaults.PORT,
		app.settings.env)
})
*/

function initAppResult(err) {
	if (err) throw err
}
app.listen(defaults.PORT, defaults.appInterface)
//app.listen(defaults.worldPort)
console.log('Application %s on port %s node %s express %s %s mode',
	defaults.init.appName,
	defaults.PORT,
	process.version,
	express.version,
	app.settings.env)
