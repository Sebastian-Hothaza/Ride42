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
    size: { type: String, required: true, enum: ["110/70", "120/70", "125/70", "140/70", "150/60", "160/60", "180/55", "180/60", "190/60", "200/55", "200/60", "200/65"] },
    compound: { type: String, enum: ["SC1", "SC2", "SC3"], required: false, default: undefined  },
    price: { type: Number, required: true, min: 0, },
    stock: { type: Number, required: true, min: 0, }
  }]
});

const Tire = Product.discriminator("tire", TireSchema);


// GEAR
// The params here refer to AVAILABLE OPTIONS which are selected upon order creation.
const GearSchema = new mongoose.Schema({
  basePrice: { type: Number, required: true, min: 0 },
  sizes: { type: [String], enum: ["S", "M", "L", "XL", "XXL", "Custom", "S/M", "L/XL"], required: false, default: undefined },
  colors: { type: [String], enum: ["Black", "White", "Red", "Blue", "Green", "Lime", "Custom"], required: false, default: undefined },
  addOnOptions: [{
    name: { type: String, enum: ["TPUCaps", "2-piece", "kangarooLeather", "airbagReady", "stingrayArmor", "gloveBundleDiscount"] },
    priceAdjustment: { type: Number, required: true },
    quantity: { type: Number, required: false, default: undefined } // HELITE cartridges
  }]
});

// Ie. const finalPrice = product.basePrice + variant.priceAdjustment;
const Gear = Product.discriminator("gear", GearSchema);

module.exports = { Product, Tire, Gear };