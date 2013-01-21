// masterprocess.js
// Nodegod master process supervises apps
// © Harald Rudell 2012

var appIdentifier = 'nodegodmaster'
require('./lib/master/nodegodmaster').run({
	port: 1113,
	interface: '127.0.0.1',
	ignoredSignals: ['SIGINT', 'SIGUSR2', 'SIGHUP'],
	appIdentifier: appIdentifier,
	spawnWeb: {
		file: 'node',
		args: [require('path').join(__dirname, 'webprocess')],
	},
	spawnLog: {
		file: 'node',
		args: [require('path').join(__dirname, 'logprocess'), appIdentifier],
	},
})