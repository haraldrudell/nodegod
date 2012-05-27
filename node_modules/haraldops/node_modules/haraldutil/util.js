//
// some utility functions for error handling and logging
// Harald Rudell
//
module.exports.logException = logException
module.exports.checkSuccess = checkSuccess
module.exports.logError = logError
module.exports.getLocation = getLocation
module.exports.toNumber = toNumber
module.exports.timeUtil = require('./timeutil')

// log exception e caught in a catch construct
// heading: optional heading string, eg. 'reading file'
// printmethod: mnethod to use for output, default: console.log
// offset possible call stack offset, default callers location
function logException(e, heading, printmethod, offset) {
	logError(e, heading || 'Caught exception', undefined, (offset || 0) + 1)
}

// check success in a callback
// error: callback error argument
// heading: optional heading string, eg. 'reading file'
// printmethod: mnethod to use for output, default: console.log
// offset possible call stack offset, default callers location
// return value: true if there was no error
function checkSuccess(error, heading, printmethod, offset) {
	var success = error == null
	if (!success) {
		logError(error, heading, printmethod, (offset || 0) + 1)
	}
	return success
}

// log an error
// e: error value, such as an Error object or catch argument
// heading: optional heading string, eg. 'reading file'
// printmethod: mnethod to use for output, default: console.log
// offset possible call stack offset, default callers location
function logError(e, heading, printmethod, offset) {
	if (!heading) heading = 'Issue discovered'
	if (!printmethod) printmethod = console.log
	heading += ' at ' + getLocation(true, (offset || 0) + 1)
	// e is a JavaScript value including undefined
	if (typeof e != 'object' || !(e instanceof Error)) printmethod(heading, e)
	else {
		printmethod(heading)
		printmethod(
			'Exception:"' + e.message + '"',
			'Native error type:', e.constructor.name,
			'arguments:', e.arguments,
			'type:', e.type)
		printmethod(e.stack)
	}
}

// get the current script executing location
// includeObject: prepend object and method, eg. Module.load
// offset: caller offset in the stack
// return value: printable string eg. 'tracker.js:5:15-Object.<anonymous>'
function getLocation(includeObject, offset) {
	if (offset == null) offset = 0
	var result = ''
	var e = new Error()
	var frames = e.stack.split('\n')
	var line = frames[2 + offset]
	// in main:     at Object.<anonymous> (/home/foxyboy/Desktop/c505/node/cloudclearing/mongoresearch/mongotest.js:10:2)
	// in function:     at run (/home/foxyboy/Desktop/c505/node/cloudclearing/mongoresearch/mongotest.js:22:2)
	// in emit callback:     at /home/foxyboy/Desktop/c505/node/cloudclearing/mongoresearch/mongotest.js:32:3

	var file = line.lastIndexOf('/')
	var lastcolon = line.lastIndexOf(')')
	if (lastcolon == -1) lastcolon = line.length + 1
	result += line.substring(file + 1, lastcolon)
	if (includeObject && line.charAt(line.length - 1) == ')') {
		var at = line.indexOf('at ')
		var open = line.lastIndexOf(' (')
		result += '-' + line.substring(at + 3, open)
	}
	return result
}

// tonumber(string) string parseInt
// parse a number consisiting of digits 0-9
// leading and trailing whitespace and line terminators are allowed
// bad numbers return NaN
function toNumber(str, allowFloat) {
	var result = NaN
	if (str instanceof String) {
		// convert object string to primitive string
		str = String(str)
	}
	if (typeof str == 'string') {

		// skip leading and trailing whiteSpace and lineTerminator
		var digits = str.trim()

		if (isNumberSyntaxOk(digits, allowFloat)) {
			result = allowFloat ? parseFloat(digits) : parseInt(digits)
		}
	} else if (typeof str == 'number') {
		result = str
	} else if (str instanceof Number) {
		// convert object number to primitive number
		result = Number(str)
	}
	return result
}

// check syntax: only digits allowed, one possible decimal point
// str: string
// return value: true if number syntx is ok
function isNumberSyntaxOk(str, allowFloat) {
	var result = str.length > 0 // empty string not ok
	var sawDecimalPoint = false

	for (var index in str) {
		var value = "0123456789.-+".indexOf(str.charAt(index))

		// digit: ok
		if (value >= 0 && value < 10) continue

		// one decimal point: ok if float
		if (value == 10 && allowFloat && !sawDecimalPoint) {
			sawDecimalPoint = true
			continue
		}

		// leading plus or minus: ok
		if ((value == 11 || value == 12) && index == 0) continue

		// bad character
		result = false
		break
	}

	return result
}
