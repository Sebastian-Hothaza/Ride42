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
    size: String,
    compound: String,
    price: Number,
    stock: Number
  }]
});

const Tire = Product.discriminator("tire", TireSchema);


// GEAR
// The params here refer to AVAILABLE OPTIONS which are selected upon order creation.Configuration system
const GearSchema = new mongoose.Schema({
  basePrice: Number,
  sizes: [String],
  colors: [String],
  addOnOptions: [{
    name: String,
    priceAdjustment: Number
  }]
});

// Ie. const finalPrice = product.basePrice + variant.priceAdjustment;
const Gear = Product.discriminator("gear", GearSchema);

module.exports = { Product, Tire, Gear };