const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const logger = require('./logger');

let mongoServer

async function initializeMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  mongoose.connection.on("error", e => {
    if (e.message.code === "ETIMEDOUT") {
      logger.error({message: e});
      mongoose.connect(mongoUri);
    }
    logger.error({message: e});
  });
}

async function takedownMongoServer() {
  await mongoServer.stop();
  await mongoose.disconnect();
}

async function refreshMongoServer() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}


module.exports = { initializeMongoServer, takedownMongoServer, refreshMongoServer };