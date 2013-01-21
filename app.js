// app.js
// Nodegod manages apps
// © Harald Rudell 2012 MIT License

require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God',
	noFile: true, // haraldops: don't load a settings file
	noInfoLog: true, // appinit quiet
	logger: function () {}, // haraldops quiet
	api: {
		apiMap: {
			masterlauncher: {
				onLoad: true,
				spawn: {
					file: 'node',
					args: [require('path').join(__dirname, 'masterprocess')],
				}
			}
		}
	}
}))