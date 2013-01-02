// logger.js
// Add logging preceded by a slogan to a child process
// © Harald Rudell 2012

exports.addLogging = addLogging
function addLogging(child, slogan) {
	addListener(child.stdout)
	addListener(child.stderr)

	function addListener(io) {
		if (io) {
			io.on('data', log).on('end', cleanUp)
			io.setEncoding('utf-8')
		}

		function cleanUp() {
			io.removeListener('data', log)
			io.removeListener('end', cleanUp)
		}

		var atEndOfLine = true
		/*
		str: string
		prepend a slogan to each line
		if there is something on a line, prepend with slogan and a space
		if the line is empty prepend with only slogan
		*/
		function log(str) {
			var result = []

			// split into lines
			// arr: 1 or more elements, the last should not be followed by newline
			var arr = str.split('\n')
			var index = 0 // the next line to be printed
			var lastIndex = arr.length - 1 // the last line to be printed

			// if not at beginning of line and a newline in str
			if (!atEndOfLine && str) {
				if (arr[index]) result.push(arr[index])
				if (index < lastIndex) result.push('\n')
				index++
			}

			// output all lines that are followed by newline
			while (index < lastIndex) {
				result.push(slogan)
				if (arr[index].length) result.push(' ', arr[index])
				result.push('\n')
				index++
			}

			// output possible final text that is not followed by newline
			atEndOfLine = !arr[index]
			if (!atEndOfLine) result.push(slogan, ' ', arr[index])

			process.stdout.write(result.join(''))
		}
	}
}