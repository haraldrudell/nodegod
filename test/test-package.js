// packagetest.js
// test javascript and json syntax
// (c) Harald Rudell 2012

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	testJsSyntax: testJsSyntax,
	parsePackageJson: parsePackageJson,
	parseGitignore: parseGitignore,
}

var deployFolder = path.join(__dirname, '..')
alwaysIgnore = 'node_modules'

// verify syntax of all JavaSCript
function testJsSyntax(test) {

	var defaults = getDefaults()

	// to verify JavaSCript syntax, recursively require all .js files
	scanFolder(deployFolder)

	test.done()

	function scanFolder(folder) {
		//console.log(arguments.callee.name, folder)
		fs.readdirSync(folder).forEach(function (jsFile) {
			if (jsFile.substring(0, 1) != '.') {

				var absolutePath = path.join(folder, jsFile)
				var relativePath = absolutePath.substring(deployFolder.length + 1)

				// check against ignore list
				if (defaults.ignore.indexOf(relativePath) == -1) {
					if (getType(absolutePath) === false) {

						// recursively scan folders
						scanFolder(absolutePath)
					} else if (jsFile.indexOf('.' + defaults.extension) != -1) {

						// require all files matching defaults.extension
						// if there is a syntax error, an exception will happen here
						var jsModule = require(absolutePath)
						// { mailconstructor: [Function: constructor] }
						// console.log(jsModule)
						test.ok(!!jsModule)
					}
				}
			}
		})
	}

}

// ensure that package.json can be parsed
function parsePackageJson(test) {

	var data = fs.readFileSync(path.join(deployFolder, 'package.json'), 'utf-8')
	var obj = JSON.parse(data)
	test.ok(!!obj)

	test.done()
}

// ensure that .gitignore contains '/node_modules'
function parseGitignore(test) {

	var expected = '/node_modules'
	var data = fs.readFileSync(path.join(deployFolder, '.gitignore'), 'utf-8')
	test.ok(data.indexOf(expected) != -1, '.gitignore missing:' + expected)

	test.done()
}

// support stuff

// get configuration, optionally from './test-pagage.json'
function getDefaults() {

	var defaults = {
		ignore: [],
		extension: 'js',
	}

	// read the ignore file
	var testPackageJsonName = path.join(__dirname, path.basename(__filename, path.extname(__filename)) + '.json')
	if (getType(testPackageJsonName)) {
		var text = fs.readFileSync(testPackageJsonName, 'utf-8')
		var msg = 'Bad json in:' + testPackageJsonName
		try {
			var object = JSON.parse(text)
		} catch (e) {
			console.log(msg)
			throw e
		}
		if (!object) throw Error(msg)
		if (object.ignore) {
			if (!Array.isArray(object.ignore)) Error(testPackageJsonName + ' ignore must be array')
			defaults.ignore = object.ignore
		}
		if (object.extension) {
			if (typeof object.extension != 'string') Error(testPackageJsonName + ' extension must be string')
			defaults.extension = object.extension
		}
	}

	defaults.ignore.push(alwaysIgnore)

	return defaults
}


// determine what path1 is
// return value:
// undefined: does not exist
// false: is a directory
// true: is a file
function getType(path1) {
	var result
	var stats
	try {
		stats = fs.statSync(path1)
	} catch (e) {
		var bad = true
		if (e instanceof Error && e.code == 'ENOENT') bad = false
		if (bad) {
			console.log('Exception for:', typeof path1, path1, path1 && path1.length)
			throw e
		}
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = false
	}
	return result
}