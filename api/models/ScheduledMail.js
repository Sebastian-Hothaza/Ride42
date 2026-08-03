const mongoose = require("mongoose");

const scheduledMailSchema = new mongoose.Schema({
    sendOn: { type: Date, required: true, },
    processing: { type: Boolean, default: false }, // Flag to indicate if the email is being processed,
    emailType: { type: String, enum: ["transactional", "marketing", "pmtReminder"], default: "transactional" },
    trackdayId: { type: mongoose.Schema.Types.ObjectId, ref: "Trackday" }, // Optional reference to a Trackday document, if the email is related to a specific trackday  
    to: [{ type: String, required: true }], // List of recipient email addresses
    subject: { type: String, required: true },
    message: { type: String, required: true }, // HTML content of the email
    args: { type: Object }, // Flexible for extra fields such as name, date, etc.
});


// Export model
module.exports = mongoose.model("ScheduledMail", scheduledMailSchema);