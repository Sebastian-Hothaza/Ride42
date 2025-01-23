const mongoose = require("mongoose");
const logger = require('./logger');

main().catch((err) => logger.error({ message: err }));
async function main() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.debug({ message: 'Mongoose connected to MongoDB' });
    } catch (err) {
      logger.error({ message: 'Error connecting to MongoDB' + err.message });
    }
  }
}

module.exports = mongoose;