const mongoose = require("mongoose");

main().catch((err) => console.log(err));
async function main() { 
  if (process.env.NODE_ENV !== 'test') await mongoose.connect(process.env.MONGODB_URI);
  if (process.env.NODE_ENV === 'development') console.log("DB Connection established");
}