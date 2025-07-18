const mongoose = require("mongoose");
const logger = require('./logger');

main().catch((err) => logger.error({ message: err }));
async function main() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.debug({ message: 'Mongoose connected to MongoDB' });
   
      if (process.env.NODE_ENV === 'development') logger.warn({ message: 'Connected to PRODUCTION database' });
    } catch (err) {
      console.log('Error connecting to MongoDB: ' + err.message); // In case mongoDB connection fails, logger wont properly log info
      logger.error({ message: 'Error connecting to MongoDB: ' + err.message });
    }
  }
}

module.exports = mongoose;