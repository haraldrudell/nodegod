// logger.js

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
		function log(str) {

			// beginning of each line needs an app marker
			var arr = str.split('\n')
			var lastIndex = arr.length - 1
			for (var index = 0; index < lastIndex; index++) {
				if (index != 0 || atEndOfLine) process.stdout.write(slogan + ' ')
				process.stdout.write(arr[index] + '\n')
			}
			if (arr[lastIndex].length) {
				atEndOfLine = false
				process.stdout.write(arr[lastIndex])
			}
		}

	}

}