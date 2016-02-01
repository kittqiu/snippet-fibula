'use strict';

var nodemailer = require('nodemailer'),
	config = require('../../config');


var smtpConfig = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    ignoreTLS: config.smtp.ignoreTLS,
    auth: {
        user:config.smtp.authuser,
        pass:config.smtp.authpassword
    }
};
var transporter = nodemailer.createTransport( smtpConfig ); 

function sendHtml(from, to, subject, html ){
	var mailData = {
	    from: from || '"Admin"<' + config.smtp.admin + '>',
	    to: to,
	    subject: subject || 'blank title',
	    html: html
	};
	transporter.sendMail(mailData, function(err, info){
	    if(err){
	        console.log(err);
	    }else{
	        console.log('Message sent: ' + info.response);      
	    }
	});
}

module.exports = {
	sendHtml: sendHtml
}
