const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	name: { firstName: { type: String, required: true, minLength: 2, maxLength: 50 },
			lastName:  { type: String, required: true, minLength: 2, maxLength: 50 }},

	contact: {  email:   {type: String, required: true, minLength: 4, maxLength: 50},
				phone:   {type: String, required: true, minLength: 10, maxLength: 10},
				address: { type: String, required: true, minLength: 2, maxLength: 50 },
				city:    { type: String, required: true, minLength: 2, maxLength: 50 },
				province:{ type: String, required: true, minLength: 2, maxLength: 50 }},

	emergencyContact: { name:		 { firstName: { type: String, required: true, minLength: 2, maxLength: 50 },
									   lastName:  { type: String, required: true, minLength: 2, maxLength: 50 }},
						phone:		 {type: Number, required: true, minLength: 10, maxLength: 10},
						relationship:{type: String, required: true, minLength: 2, maxLength: 50},},

	garage: [ { year: { type: String, required: true, minLength: 4, maxLength: 4  },
				make: { type: String, required: true, minLength: 2, maxLength: 50 },
				model: {type: String, required: true, minLength: 2, maxLength: 50 }}],

	group: { type: String, required: true, enum: ["green", "yellow", "red"] },
	credits: { type: Number, required: true},
	type: { type: String, required: true, enum: ["regular", "staff", "admin"] },
	password: { type: String, required: true, minLength: 8, maxLength: 50 },
});

// Export model
module.exports = mongoose.model("User", UserSchema);

