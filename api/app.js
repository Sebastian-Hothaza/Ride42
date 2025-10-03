const express = require('express');
const logger = require('./logger');
const router = require('./routes/index');
const cookieParser = require('cookie-parser')
const { startMailListener, stopMailListener } = require('./mailListener'); // Import the mailListener setup function
const checkOutgoingMail = require('./mailScheduler'); // Import the mailListener setup function
const os = require('os'); // required to get machine name

const app = express();


// Only activate the mail Listener on correspondingfly machine.
// Otherwise risk of 2 listeners running which causes issues.
// If wanting to test mailListener, need to shut it down on API
// Mail listener listens for incoming e-transfer notification emails in INBOX/Payments.
// It attempts to process them to auto-mark e-transfer users as paid
// Auto-restarts every 24 Hours to ensure reliability
const machineName = os.hostname();
if (machineName === process.env.MAIL_LISTENER_MACHINE) {
	logger.debug({ message: `Machine ${machineName} is listening for mail.` });
	startMailListener();
	setInterval(() => {
		stopMailListener();
		setTimeout(() => startMailListener(), 5000);
	}, 24 * 60 * 60 * 1000);
}

// Check DB for pending emails and send them
checkOutgoingMail();
setInterval(() => {
	checkOutgoingMail();
}, 5 * 60 * 1000); // 5 minutes

// Simulate slow network
const simulateSlowNetwork = false;
const delay = 2000;
if (simulateSlowNetwork) {
	logger.warn({ message: 'SLOW SERVER SIMULATION' });
	const sleep = (ms) => new Promise(
		resolve => setTimeout(resolve, ms));
	app.use(async (req, res, next) => {
		logger.warn({ message: 'server delayed by ' + delay + ' ms' })
		await sleep(delay)
		next();
	})
}

// cors setup
const cors = require('cors')

app.use(cors({
	origin: process.env.NODE_ENV === 'production' ? "https://ride42.ca" : "http://10.0.0.4:5173", credentials: true,
}));

// Do not parse webhook with json since raw body is needed
app.use((req, res, next) => {
	if (!req.originalUrl.startsWith('/stripeWebhook')) {
		express.json({ limit: '1mb' })(req, res, next); // 1mb Needed to allow pdf attachments
	} else {
		next();
	}
});

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', router); // Sends request to router to handle, should be last middleware before error handling


// catch 404 and forward to error handler
const createError = require('http-errors');
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') !== 'production' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json({ msg: ['BAD REQUEST'] });
});

module.exports = app;
