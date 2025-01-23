const mongoose = require("mongoose");
const logger = require('./logger');

main().catch((err) => logger.error({ message: err }));
async function main() {
  if (process.env.NODE_ENV !== 'test') {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.debug({ message: 'DB Connection established' });
  }
}

/*
// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('killing mongoose')
  await mongoose.disconnect()
})
  */