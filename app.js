// nodegod
// keeps a number of node apps running
var haraldops = require('haraldops')
var defaults = haraldops.init({ appName: 'Node God', path: __dirname, logger: console.log })

// https://github.com/visionmedia/express
var express = require('express')
var godcontrol = require('./lib/godcontrol')
var godview = require('./routes/godview')

// Configuration
var app = module.exports = express.createServer()
godcontrol.init(app, defaults, __dirname)
godview.setTitle(defaults.init.appName)
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
require('ejsinbrowser').writeScript({
	folder: app.settings.views,
	ext: app.settings['view engine'],
	jsGlobalVariable: 'NODEGOD',
	templates: 'partials',
	filename: __dirname + '/public/javascripts/templates.js'})
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
app.listen(defaults.PORT, defaults.appInterface)
console.log('Application %s on node %s available on port %d in %s mode',
	defaults.init.appName,
	process.version,
	defaults.PORT,
	app.settings.env)
