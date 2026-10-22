const mongoose = require("mongoose");
const logger = require('./logger');

main().catch((err) => logger.error({ message: err }));
async function main() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.debug({ message: 'Mongoose connected to MongoDB' });

      // Extract name of DB from mongo URI
      const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0];
      
   
      if (process.env.NODE_ENV === 'development'){
        if (dbName === 'Ride42_DB') {
          logger.warn({ message: 'Connected to PRODUCTION database' });
        } else {
          logger.debug({ message: `Connected to database: ${dbName}` });
        }
      }
    } catch (err) {
      console.log('Error connecting to MongoDB: ' + err.message); // In case mongoDB connection fails, logger wont properly log info
      logger.error({ message: 'Error connecting to MongoDB: ' + err.message });
    }
  }
}

module.exports = mongoose;