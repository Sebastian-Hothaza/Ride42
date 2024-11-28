const winston = require('winston');

winston.addColors({
    error: 'bold white redBG',
    warn: 'italic yellow',
    info: 'white',
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    levels: {
        error: 0,
        warn: 1,
        info: 2,
    },
    format: winston.format.printf(({ level, message }) => { return `${level}: ${message}` }),
});

// Log to console in dev, stream to mongoDB in prod
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console( { format: winston.format.colorize({ all: true }) } ));
} else if (process.env.NODE_ENV === 'production') {
    // Add mongoDB transport
}

module.exports = logger;