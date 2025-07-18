const mongoose = require("mongoose");

const scheduledMailSchema = new mongoose.Schema({
    sendOn: { type: Date, required: true, },
    processing: { type: Boolean, default: false }, // Flag to indicate if the email is being processed
    to: { type: String, required: true },
    cc: { type: String },
    bcc: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    params: { type: Object }, // Flexible for extra fields such as name, date, etc.
});


// Export model
module.exports = mongoose.model("ScheduledMail", scheduledMailSchema);