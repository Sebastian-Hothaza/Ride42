const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const logger = require('../logger');

let mongoServer

async function initializeMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  mongoose.connect(mongoUri);

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
  await mongoose.connection.db.dropDatabase();
}

module.exports = { initializeMongoServer, takedownMongoServer, refreshMongoServer };