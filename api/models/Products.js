const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, minLength: 2, maxLength: 100 },
    category: { type: String, required: true, enum: ["pirelli", "plus", "helite"] },
    price: { type: Number, required: true, min: 0 },

    // Pirelli tires


    // PLUS
    


});


// Export model
module.exports = mongoose.model("Product", ProductSchema);