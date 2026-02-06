const mongoose = require("mongoose");

const OrdersSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
    orderDate: { type: Date, default: Date.now }
});


// Export model
module.exports = mongoose.model("Order", OrdersSchema);