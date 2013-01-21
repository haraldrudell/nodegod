// webprocess.js
// Node God Web process provides Web interface
// © Harald Rudell 2012

require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God',
	api: {
		apiMap: {
			nodegodweb: {
				onLoad: true,
				sessionSecret: 'veryGreat',
				port: 1111,
			}
		}
	}
}))