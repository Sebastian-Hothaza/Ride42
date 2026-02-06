const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, minLength: 2, maxLength: 100 },
    category: { type: String, required: true, enum: ["pirelli", "plus", "helite"] },
    price: { type: Number, required: true, min: 0 },

    // Pirelli tires
    front: {
        compound: { type: String, enum: ["SC0", "SC1", "SC2", "SC3"], required: function() { return this.category === 'pirelli'; } },
        size: { type: String, required: function() { return this.category === 'pirelli'; } }
    },
    rear: {
        compound: { type: String, enum: ["SC0", "SC1", "SC2", "SC3"], required: function() { return this.category === 'pirelli'; } },
        size: { type: String, required: function() { return this.category === 'pirelli'; } }
    },

    // PLUS
    


});


// Export model
module.exports = mongoose.model("Product", ProductSchema);