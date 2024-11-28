const mongoose = require("mongoose");
const logger = require('./logger');

main().catch((err) => logger.error({message: err}));
async function main() { 
  if (process.env.NODE_ENV !== 'test') await mongoose.connect(process.env.MONGODB_URI);
  if (process.env.NODE_ENV === 'development') logger.info({message: 'DB Connection established'});
  
}