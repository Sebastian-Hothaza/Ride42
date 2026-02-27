const mongoose = require("mongoose");

const options = {
  discriminatorKey: "category",
  collection: "products",
  timestamps: true
};

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  basePrice: { type: Number, required: true, min: 0 }
}, options);

const Product = mongoose.model("Product", ProductSchema);

// TIRES
const TireSchema = new mongoose.Schema({
  variants: [
    {
      size: {
        type: String,
        required: true,
        enum: ["200/60", "180/60", "120/70"]
      },
      compound: {
        type: String,
        required: true,
        enum: ["SC3", "SC2", "SC1"]
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      }, 
      stock: {
        type: Number,
        required: true,
        min: 0,
      }
    }
  ]
});

const Tire = Product.discriminator("tire", TireSchema);


// GEAR
const GearSchema = new mongoose.Schema({
  variants: [
    {
      size: {
        type: String,
        required: true,
        enum: ["S", "M", "L", "XL", "XXL", "Custom"]
      },
      color: {
        type: String,
        required: true,
        enum: ["Black", "White", "Red", "Blue", "Green", "Lime", "Custom"]
      },
      priceAdjustment: {
        type: Number,
        default: 0
      },
      addOns: [
        {
          name: { 
            type: String, 
            enum: ["Airbag Ready","Stingray Armor", "TPU Caps", "Kangaroo Leather"] 
          },
          priceAdjustment: { 
            type: Number, 
            default: 0 
          }
        }
      ]
    }
  ]
});

// Ie. const finalPrice = product.basePrice + variant.priceAdjustment;
const Gear = Product.discriminator("gear", GearSchema);

module.exports = { Product, Tire, Gear };