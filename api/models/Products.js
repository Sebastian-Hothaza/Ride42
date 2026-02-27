const mongoose = require("mongoose");

const options = {
  discriminatorKey: "category",
  collection: "products",
  timestamps: true
};

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }
}, options);

const Product = mongoose.model("Product", ProductSchema);

// TIRES
// We use variants here since each variant is a real physical product with its own stock and price.
// Each tire variant is manually defined unlike gear which is build to order.
const TireSchema = new mongoose.Schema({
  variants: [{
    size: { type: String, required: true, enum: ["200/60", "180/60", "120/70"] },
    compound: { type: String, required: true, enum: ["SC3", "SC2", "SC1"] },
    price: { type: Number, required: true, min: 0, },
    stock: { type: Number, required: true, min: 0, }
  }]
});

const Tire = Product.discriminator("tire", TireSchema);


// GEAR
// The params here refer to AVAILABLE OPTIONS which are selected upon order creation.
const GearSchema = new mongoose.Schema({
  basePrice: { type: Number, required: true, min: 0 },
  sizes: { type: String, enum: ["S", "M", "L", "XL", "XXL", "Custom", "S/M", "L/XL"], required: true },
  colors: { type: String, enum: ["Black", "White", "Red", "Blue", "Green", "Lime", "Custom"], required: true },
  addOnOptions: [{
    name: { type: String, enum: ["Airbag Ready", "2-piece", "Stingray Armor", "TPU Caps", "Kangaroo Leather"] },
    priceAdjustment: { type: Number, required: true, min: 0 }
  }]
});

// Ie. const finalPrice = product.basePrice + variant.priceAdjustment;
const Gear = Product.discriminator("gear", GearSchema);

module.exports = { Product, Tire, Gear };