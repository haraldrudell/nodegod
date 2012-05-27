// mailsend.js
// encapsulate nodemailer

// https://github.com/andris9/nodemailer
var nodemailer = require("nodemailer")
var jsonloader = require('./jsonloader')

module.exports.mailconstructor = constructor

// class variables
var mustHaves = [ 'service', 'user', 'pass', 'to' ]
var defaultOpts = { service: 'Gmail' }

// instantiate per sending account and recipient
// logger: function to use for progress messages, default none
// optsArg: email settings: user pass to service
function constructor(logger, optsArg) {
	// parse options
	if (!logger) logger = function () {}
	var useDefaultFile = typeof optsArg != 'object'
	var opts = useDefaultFile ? jsonloader.loadDefaultFile() : optsArg
	var opts = jsonloader.getOpts(optsArg, defaultOpts, mustHaves, false)
	
	var smtpTransport
	var pendingSends = 0
	var shutDown

	return {
		sendMail: sendMail,
		closeMail: closeMail
	}

	// send an email
	function sendMail(subject, body) {

		// lazy prepare connection
		if (!smtpTransport && !shutDown) {
			logger('mail starting')
			smtpTransport = nodemailer.createTransport("SMTP", {
				service: opts.service,
				auth: {
					user: opts.user,
					pass: opts.pass,
				}
			})
		}

		// send
		pendingSends++
		smtpTransport.sendMail({
			to: opts.to,
			subject: subject,
			body: body
		}, function(error, success) {
			pendingSends--
			if (error) logger('Message ' + (success ? 'sent' : 'failed'))
			if (shutDown) closeMail()
		})
	}

	// shut down email server when pending sends complete
	function closeMail() {
		shutDown = true
		if (smtpTransport && pendingSends == 0) {
			smtpTransport.close()
			smtpTransport = undefined
			logger('mail shut down')
		}
	}

}
