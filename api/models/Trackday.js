const mongoose = require("mongoose");

/*
members is an array tracking users who attend the trackday, whether they were pre-registered or showed up on day-of
walkons is intended to keep track of non-members who show up to ride

dates in backend are stored exclusively in UTC.
Ie. A trackday on June 5 2024 at 10am would be submitted as 2024-06-05T14:00Z
*/

const TrackdaySchema = new mongoose.Schema({
	date: { type: Date, required: true },
	members: [{ user: 			{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
				paymentMethod: 	{ type: String, required: true, enum: ["etransfer", "credit", "creditCard", "gate"] },
				paid: 			{ type: Boolean, required: true},
				guests: 		{ type: Number, required: true },
				layoutVote:		[{ type: String, required: true, enum: ["none", "technical", "Rtechnical", "alien", "Ralien", "modified", "Rmodified", "long"] }],
				checkedIn: 		[{ type: mongoose.Schema.Types.ObjectId }]}],
	walkons: [{ firstName: 		{ type: String, required: true, minLength: 2, maxLength: 50 },
				lastName:  		{ type: String, required: true, minLength: 2, maxLength: 50 },
				group: 			{ type: String, required: true, enum: ["green", "yellow", "red"] }}],
	status:	{ type: String, required: true, enum: ["regOpen", "regClosed", "cancelled", "archived"] },
	layout:	{ type: String, required: true, enum: ["tbd", "technical", "Rtechnical", "alien", "Ralien", "modified", "Rmodified", "long"] },
	costs:    [{ desc: { type: String, required: true, minLength: 2, maxLength: 100 },
	             type: { type: String, required: true, enum: ["fixed", "variable"] },
				 amount: { type: Number, required: true}}],
	ticketPrice: {
		preReg: { type: Number, required: true},
		gate: { type: Number, required: true},
		bundle: { type: Number, required: true},
	}
});

// Export model
module.exports = mongoose.model("Trackday", TrackdaySchema);