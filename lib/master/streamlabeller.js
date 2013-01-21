// streamlabeller.js
// Add logging preceded by a slogan to a child process
// © Harald Rudell 2012 MIT License

;[
logSocket, logChild,
].forEach(function (f) {exports[f.name] = f})

// log joint output for a child process
function logChild(child, slogan, write) {
	if (child) {
		logSocket(child.stdout, slogan, write)
		logSocket(child.stderr, slogan, write)
	}
}

/*
Capture output from a socket, preceding each line with slogan
socket: a Socket such as child.stdout or child.stderr
slogan: string, prepended to each line
write(string): function

listening to 'data' and 'end' events from the socket
sets encoding to utf-8
*/
function logSocket(socket, slogan, write) {
	if (socket) {
		socket.on('data', log).once('end', cleanUp)
		socket.setEncoding('utf-8')
	}

	function cleanUp() {
		socket.removeListener('data', log)
		socket.removeListener('end', cleanUp)
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

		write(result.join(''))
	}
}