const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },


    // Snapshot of product customer selected

    // For ALL orders
    name: String,
    category: String,
    size: String,
    quantity: Number,
    basePrice: Number,
    price: Number,

    // For Tire
    compound: String,
    installRequired: Boolean,

    // For Gear
    color: String,
    addOns: { type: [{ name: String, price: Number, quantity: Number, }], required: false, default: undefined },

  }],
  balanceDue: Number,
  paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
  orderStatus: { type: String, enum: ["pending", "complete", "pending design", "pending measurements", "pending approval"], default: "pending" },
  deliveryDate: Date
});

module.exports = mongoose.model("Order", OrderSchema);