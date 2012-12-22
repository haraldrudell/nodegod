// masterlink.js
// ipc link to master process
// © Harald Rudell 2012
exports.getMaster = getMaster

var emitter = new (require('events').EventEmitter)
emitter.id = 'Master Link:' + process.pid
emitter.write = write
process.on('message', emitMessage)
//var pSend = process.send

function getMaster() {
	return emitter
}

function emitMessage() {
	emitter.emit.apply(emitter, ['message'].concat(Array.prototype.slice.call(arguments)))
}

function write(data) {
	if (typeof process.send == 'function') process.send(data)
	else console.log(emitter.id, 'ipc not available')
}