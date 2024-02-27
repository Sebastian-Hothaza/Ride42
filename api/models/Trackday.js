const mongoose = require("mongoose");

const TrackdaySchema = new mongoose.Schema({
  date: { type: String, required: true, minLength: 3, maxLength: 20 },
});

// Export model
module.exports = mongoose.model("Trackday", TrackdaySchema);
