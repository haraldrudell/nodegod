// packagetest.js
// test javascript and json syntax

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

module.exports = {
	testJsSyntax: testJsSyntax,
	parsePackageJson: parsePackageJson,
	parseGitignore: parseGitignore,
}

function testJsSyntax(test) {
	scanFolder(path.join(__dirname, '/../lib'))
	var routes = path.join(__dirname, '/../routes')
	if (haraldutil.getType(routes) === false) scanFolder(routes)
	test.done()

	function scanFolder(folder) {
		//console.log('folder', folder)
		fs.readdirSync(folder).forEach(function (jsFile) {
			fqpath = path.join(folder, jsFile)
			//console.log('fq', fqpath)
			if (haraldutil.getType(fqpath) === false) {
				// it is a folder
				scanFolder(fqpath)
			} else if (jsFile.indexOf('.js') != -1) {
				// if there is a syntax error, an exception will happen here
				var jsModule = require(fqpath)
				// { mailconstructor: [Function: constructor] }
				// console.log(jsModule)
				test.ok(!!jsModule)
			}
		})
	}
}
function parsePackageJson(test) {
	var data = fs.readFileSync(__dirname + '/../package.json')
	var obj = JSON.parse(data)
	test.ok(!!obj)
	test.done()
}
function parseGitignore(test) {
	var expected = '/node_modules'
	var data = fs.readFileSync(__dirname + '/../.gitignore', 'utf-8')
	
	test.ok(data.indexOf(expected) != -1, '.gitignore missing:' + expected)
	test.done()
}