// logprocess.js
// Log stdin to a rotatedlogger
// © Harald Rudell 2013 MIT License

require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God Logger',
	noFile: true, // haraldops: don't load a settings file
	noInfoLog: true, // appinit quiet
	logger: function () {}, // haraldops quiet
	api: {
		apiMap: {
			fslogpipe: {
				onLoad: true,
				logName: process.argv[2],
			}
		}
	}
}))