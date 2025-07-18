const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')
const logger = require('./logger');

function checkOutgoingMail() {
    console.log('Checking for DB outgoing emails and sending them...');
}

module.exports = checkOutgoingMail;