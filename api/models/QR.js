const mongoose = require("mongoose");

const QRSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bike: { type: mongoose.Schema.Types.ObjectId, ref: "Bike" },
    img: { type: String }
});


// Export model
module.exports = mongoose.model("QR", QRSchema);