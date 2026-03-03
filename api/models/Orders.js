const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    // Snapshot of what the customer selected
    size: String,         // for both Tire and Gear
    color: String,        // for Gear
    compound: String,     // for Tire
    price: Number,        // final price for this variant at purchase
    addOns: [{ name: String, price: Number, quantity: Number }], // Used for gear
    quantity: { type: Number, required: true, min: 1 },

    // Price snapshot
    finalPriceAtPurchase: { type: Number, required: true }
  }],
  balanceDue: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
  orderStatus: { type: String, enum: ["pending", "complete", "pending design", "pending measurements", "pending approval"], default: "pending" },
  deliveryDate: { type: Date },
});

module.exports = mongoose.model("Order", OrderSchema);