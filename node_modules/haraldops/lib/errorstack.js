// errorstack.js

exports.errorstack = errorstack

// append a stack trace after each invocation of console.error or console.warn
function errorstack() {
	// get the present console.error
	var consoleError = console.error

	// replace the global getter
	// doing the same thing and intercept .warn and .error
	__defineGetter__('console', function() {
		var console = require('console')
		console.error = myConsoleError
		console.warn = myConsoleError
		return console
	})

	function myConsoleError() {
		// execute the logging
		// arguments is an object with numeric keys
		consoleError.apply(this, arguments)

		// print a stack trace
		var e = Error('console.error invocation')
		consoleError(e.stack)
	}
}
