// webprocess.js
// Web server process for Node God
// © Harald Rudell 2012

require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God',
	api: {
		apiMap: {
			nodegodweb: {
				onLoad: true,
				sessionSecret: 'veryGreat',
				PORT: 1111,
			}
		}
	}
}))