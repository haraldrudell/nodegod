// app.js
// Nodegod manages apps
// © Harald Rudell 2012

require('./lib/master/nodegodmaster').run({
	port: 1113,
	interface: '127.0.0.1',
	ignoredSignals: ['SIGINT', 'SIGUSR2', 'SIGHUP'],
	appIndentifier: 'nodegodmaster',
	launchArray: ['node', require('path').join(__dirname, 'webprocess')],
})