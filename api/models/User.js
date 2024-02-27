const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 20 },
  password: { type: String, required: true, minLength: 6, maxLength: 20 },
});

// Export model
module.exports = mongoose.model("User", UserSchema);
