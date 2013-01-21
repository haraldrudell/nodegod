// getfilenames.js
// build an array of filenames from a single entry or an array of file and folder names
// © Harald Rudell 2011 <harald@therudells.com> MIT License

// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

module.exports = {
	getFileArray: getFileArray,
}

// files: single string or array of string, files and folders
// folder: path to prepend to relative paths, eg. '/home/user'
// ext: extension to try for files eg. 'html'
function getFileArray(files, folder, ext) {
	var result = []

	// build result array by scanning each individual value
	if (Array.isArray(files)) {
		files.forEach(function(file) {
			pushFilenames(file)
		})
	} else pushFilenames(files)

	return result

	function pushFilenames(filename, aFolder) {
		if (!aFolder) aFolder = folder

		// determine if file or folder
		var file = path.resolve(aFolder, filename)
		var type = getType(file)
		if (type == null) {
			// does not exist, try with extension
			if (!path.extname(file)) {
				file += '.' + ext
				type = getType(file)
			}
		}
		if (type == null) throw new Error('File not found:' + file)

		// is it a file?
		if (type) result.push(file)
		else {

			// traverse the folder
			fs.readdirSync(file).forEach(function (aFile) {
				pushFilenames(aFile, file)
			})
		}
	}
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
			console.log('Exception for:', path1)
			throw e
		}
	}
	if (stats) {
		if (stats.isFile()) result = true
		if (stats.isDirectory()) result = false
	}
	return result
}
