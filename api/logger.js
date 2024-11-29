const winston = require('winston');
require('winston-mongodb');

winston.addColors({
    error: 'bold white redBG',
    warn: 'italic yellow',
    info: 'white',
    debug: 'gray'
});

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
    },
    format: winston.format.printf(({ level, message }) => { return `${level}: ${message}` }),
});

// Log to console in dev, stream to mongoDB in prod
if (process.env.NODE_ENV === 'production') {
    // Add mongoDB transport
    logger.add(new winston.transports.MongoDB({
        db: process.env.MONGODB_URI,
        collection: 'serverLogs',
        capped: true,
        cappedMax: 10000,
        tryReconnect: true,
        level: 'info' // Minimum log level to store; we dont want to store debug info
    }));
} else {
    logger.add(new winston.transports.Console({ format: winston.format.colorize({ all: true }) }));
    if (process.env.NODE_ENV === 'test') logger.level = 'warn'; // Supress console of info messages
}

module.exports = logger;
 
/*
Note; db should be MongoDB connection uri, pre-connected MongoClient object or promise which resolves to a pre-connected MongoClient object.
Optimization note: we are double connecting to DB here?
*/