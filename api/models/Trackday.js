const mongoose = require("mongoose");

/*
members is an array tracking users who attend the trackday, whether they were pre-registered or showed up on day-of
walkons is intended to keep track of non-members who show up to ride
*/

const TrackdaySchema = new mongoose.Schema({
	date: { type: String, required: true, minLength: 2, maxLength: 50 },
	members: [{ userID: 		{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
				paymentMethod: 	{ type: String, required: true, enum: ["etransfer", "credit", "creditCard", "gate"] },
				paid: 			{ type: Boolean, required: true},
				checkedIn: 		{ type: Boolean, required: true} }],
	walkons: [{ name: { firstName: { type: String, required: true, minLength: 2, maxLength: 50 },
						lastName:  { type: String, required: true, minLength: 2, maxLength: 50 }},
				group: { type: String, required: true, enum: ["green", "yellow", "red"] }}],
	guests: { type: Number, required: true },
	status: { type: String, required: true, enum: ["regOpen", "regClosed", "finished", "cancelled"] }
});

// Export model
module.exports = mongoose.model("Trackday", TrackdaySchema);
