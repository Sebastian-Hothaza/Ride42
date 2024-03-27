const mongoose = require("mongoose");

const BikeSchema = new mongoose.Schema({
	year: { type: String, required: true, minLength: 4, maxLength: 4  },
	make: { type: String, required: true, minLength: 2, maxLength: 50 },
	model: {type: String, required: true, minLength: 2, maxLength: 50 }
});


// Export model
module.exports = mongoose.model("Bike", BikeSchema);