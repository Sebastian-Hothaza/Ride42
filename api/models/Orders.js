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
  deliveryDate: {type: Date},
  // TODO: Figure out for order status and delivery date what we want to do.
});

module.exports = mongoose.model("Order", OrderSchema);