// godcontrol.js
// Link GodModel and GodSocket
// © Harald Rudell 2011 MIT License

var godmodel = require('./godmodel')
var appentity = require('./appentity')
var godsocket = require('./godsocket')

exports.GodControl = GodControl

/*
opts: object
.godModel:
.godSocket

sent to socket
type: 'app': app update
err: 'message'
*/
function GodControl(opts) {
	var godModel = opts.godModel.on('data', sendUpdate)
		.on('error', sendError)
	var godSocket = opts.godSocket.on('data', authenticatedAction)
	var log = opts.log || console.log

	/*
	A request received from a socket allowed to issue actions
	data: json object
	*/
	function authenticatedAction(data, socketSend) {
		var type = data.type
		switch(type) {
		case 'getApps':
			socketSend(godModel.getApps()) // does not fail and has no callback
			break
		case 'reload':
			godModel.reload(result)
			break
		case 'nodebug':
			type = 'run'
		case 'run':
		case 'stop':
		case 'debug':
		case 'restart':
			godModel.write(data.app, type, result)
			break
		default:
			log('Unknown command:', data)
			socketSend({err: 'unknown command'})
		}

		function result(err) {
			if (err) socketSend({err: err.message})
		}
	}

	// diff has id, name and at least one other property
	function sendUpdate(diff) {
		var data = {
			type: 'app',
			app: diff,
		}
		godSocket.send(data)
	}

	function sendError(err) { // error to all clients
		godSocket.send({err: err.message})
	}
}