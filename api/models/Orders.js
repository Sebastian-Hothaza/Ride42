const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

      // Snapshot of what the customer selected
      variant: {
        size: String,
        color: String,        // for Gear; optional for Tire
        compound: String,     // for Tire; optional for Gear
        price: Number,        // final price for this variant at purchase
        addOns: [
          {
            name: String,
            price: Number
          }
        ]
      },

      quantity: { type: Number, required: true, min: 1 },

      // Price snapshot
      basePriceAtPurchase: { type: Number, required: true },
      priceAdjustmentAtPurchase: { type: Number, default: 0 },
      addOnsTotalPriceAtPurchase: { type: Number, default: 0 },
      finalPriceAtPurchase: { type: Number, required: true }
    }
  ],

  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid"],
    default: "pending"
  },
  deliveryDate: { type: Date },
  orderStatus: {
    type: String,
    enum: ["pending", "complete", "pending design", "pending measurements", "pending approval"],
    default: "pending"
  },
});

module.exports = mongoose.model("Order", OrderSchema);