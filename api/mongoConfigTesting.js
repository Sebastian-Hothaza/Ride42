const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer

async function initializeMongoServer() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  mongoose.connect(mongoUri);

  mongoose.connection.on("error", e => {
    if (e.message.code === "ETIMEDOUT") {
      console.log(e);
      mongoose.connect(mongoUri);
    }
    console.log(e);
  });
}

async function takedownMongoServer() {
  await mongoServer.stop();
  await mongoose.disconnect();
}

async function refreshMongoServer() {
  mongoose.connection.db.dropDatabase();
}

module.exports = { initializeMongoServer, takedownMongoServer, refreshMongoServer };