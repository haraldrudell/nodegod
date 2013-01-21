// logprocess.js
// Node God log process writes the filesystem log file
// © Harald Rudell 2013 MIT License

require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God Logger',
	noFile: true, // haraldops: don't load a settings file
	noInfoLog: true, // appinit quiet
	logger: function () {}, // haraldops quiet
	api: {
		signals: {
			'SIGINT' : false,
			'SIGUSR2': false,
		},
		apiMap: {
			fslogpipe: {
				onLoad: true,
				logName: process.argv[2],
				ignoredSignals: ['SIGINT', 'SIGUSR2', 'SIGHUP'],
			}
		}
	}
}))