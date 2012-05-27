// ejspack.js

// https://github.com/visionmedia/ejs
var ejs = require('ejs')
// http://nodejs.org/docs/latest/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')
var uglify = require('uglify-js')
var getfilenames = require('./getfilenames')

module.exports = {
	writeScript: writeScript,
}

// global variable, global variable
var leadIn = 'if(typeof %s=="undefined")%s={};' + 
	'(function(){var __stack={}\n'

// global variable
var leadOut =  'function partial(n,v){' +
	'var p=n.slice(n.lastIndexOf("/")+1)\n' +
	'return %s[p](v)}\n' +
	'function _ee(e,s){alert(e.toString()+" template:"+s+" line:"+__stack.lineno)}' +
	'})();'

/*
    'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
    rethrow.toString(),
    'try {',
    exports.parse(str, options),
    '} catch (err) {',
    '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
    '}'
*/
// global variable, template basename, parsed script, template basename
var templateWrapper = '%s.%s=function(locals){locals=locals||{};try{%s}catch(e){_ee(e,"%s")}};'

// opt.folder: (optional) base folder for express templates, eg '/home/user/views'
// opt.ext: (optional) extension for express templates, eg. 'ejs'
// opt.jsGlobalVariable: global variable identifier used to accesss templates in browse, eg. 'TEMPLATES'
// opt.filename: the output filename eg. '/home/user/public/javascripts/templates.js'
// opt.templates: template filenames and folder names, single string or array
function writeScript(opts) {
	var js = []

	// make an array of fully qualified filenames
	var templateFiles = getfilenames.getFileArray(opts.templates, opts.folder, opts.ext)

	js.push(util.format(leadIn, opts.jsGlobalVariable, opts.jsGlobalVariable))

	templateFiles.forEach(function (file) {
		js.push(getTemplateJavaScript(file))
	})

	js.push(util.format(leadOut, opts.jsGlobalVariable))

	js = js.join('')

	if (opts.minify) js = minify(js)

	fs.writeFileSync(opts.filename, js)

	// append one template parsed to javascript
	function getTemplateJavaScript(filename) {

		// read and parse the template
		var text = fs.readFileSync(filename, 'utf-8')
		var javascript = ejs.parse(text)

		// get template basename
		var name = path.basename(filename, path.extname(filename))

		// wrap JavaScript source
		var result = util.format(templateWrapper,
			opts.jsGlobalVariable,
			name,
			javascript,
			name)

		return result
	}

}

function minify(js) {
	var ast = uglify.parser.parse(js)
	var ast = uglify.uglify.ast_mangle(ast)
	ast = uglify.uglify.ast_squeeze(ast)
	var output = uglify.uglify.gen_code(ast)
	return output
}