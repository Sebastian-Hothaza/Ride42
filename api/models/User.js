const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	firstName: { type: String, required: true, minLength: 2, maxLength: 50 },
	lastName:  { type: String, required: true, minLength: 2, maxLength: 50 },
	contact: {  email:   { type: String, required: true, minLength: 4, maxLength: 50 },
				phone:   { type: String, required: true, minLength: 10, maxLength:10 },
				address: { type: String, required: true, minLength: 2, maxLength: 50 },
				city:    { type: String, required: true, minLength: 2, maxLength: 50 },
				province:{ type: String, required: true, enum: ["ontario", "quebec", "other"] }},
	emergencyContact: { firstName: 		{ type: String, required: true, minLength: 2, maxLength: 50 },
						lastName:		{ type: String, required: true, minLength: 2, maxLength: 50 },
						phone:		 	{ type: Number, required: true, minLength: 10,maxLength: 10 },
						relationship:	{ type: String, required: true, minLength: 2, maxLength: 50 }},
	garage: 		[{ type: mongoose.Schema.Types.ObjectId, ref: "Bike" } ],
	group: 			{ type: String, required: true, enum: ["green", "yellow", "red"] },
	credits: 		{ type: Number, required: true},
	waiver:			{ type: Boolean, required: true},
	memberType: 	{ type: String, required: true, enum: ["regular", "staff", "admin"] },
	password: 		{ type: String, required: true },
	refreshToken: 	{ type: String }
});


// Export model
module.exports = mongoose.model("User", UserSchema);