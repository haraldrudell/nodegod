// store.js
// store and retrieve session keys

// imports
// http://nodejs.org/docs/latest/api/all.html#file_System
var fs = require('fs')

// exports
exports.get = getStore

function getStore(parameter) {
	var result
	try {
		result = loadJson(parameter)
	} catch (e) {}
	if (!result) result = {}
	result.save = save
	return result

	function save(callback) {
		var jsonString = JSON.stringify(this)
		fs.writeFile(parameter, jsonString, function (err) {
			if (err) console.log('store.save:', err)
			if (callback) callback(err)
		})
	}
}

// try to load json from the specified path
// throws exception on syntax problem in a found file
// return value: object or false if file was not found
function loadJson(path) {
	var result = false
	try {
		result = JSON.parse(fs.readFileSync(path))
	} catch (e) {
		var bad = true

		// ignore if file not found
		if (e instanceof Error  && e.code == 'ENOENT') bad = false

		if (bad) {
			// special message if syntax error in json
			var syntax = e instanceof SyntaxError
			if (syntax) e = SyntaxError('Bad syntax in property file:' + path + '\n' + e)

			throw(e)
		}
	}
	return result
}
