const { Product, Tire, Gear } = require('../models/Products');
const Order = require('../models/Orders');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')
const controllerUtils = require('./controllerUtils')
const logger = require('../logger');

//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Create a order. Requires JWT with matching userID OR admin
// TODO: revise permission checks
exports.order_post = [
    body("items", "Orders must have at least one item").isArray({ min: 1 }),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,

    asyncHandler(async (req, res) => {

        // Snapshot each item/product
        const itemsSnapshot = await Promise.all(req.body.items.map(async (item) => {
            // Find product
            const product = await Product.findById(item.product);
            if (!product) return res.status(400).json({ error: `Product with ID ${item.product} does not exist` });

            // Find variant
            let variantSnapshot;
            if (product.category === "tire") {
                variantSnapshot = product.variants.find(v =>
                    v.size === item.variant.size &&
                    v.compound === item.variant.compound
                );
            } else if (product.category === "gear") {
                variantSnapshot = product.variants.find(v =>
                    v.size === item.variant.size &&
                    v.color === item.variant.color
                );
            }
            if (!variantSnapshot) return res.status(400).json({ error: `Variant not found for product ${product.name}` });

            // Verify variant is in stock
            if (variantSnapshot.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${product.name}, variant ${JSON.stringify(item.variant)}` });
            }

            // Add-on total
            const addOnsTotal = (item.variant.addOns || []).reduce((sum, a) => sum + (a.price || 0), 0);

            // Compute final price
            const base = product.basePrice || 0;
            const priceAdjustment = variantSnapshot.priceAdjustment || variantSnapshot.price || 0;

            const finalPrice = base + priceAdjustment + addOnsTotal;

            return {
                product: product._id,
                variant: {
                    ...variantSnapshot.toObject ? variantSnapshot.toObject() : variantSnapshot,
                    addOns: item.variant.addOns || []
                },
                quantity: item.quantity,
                basePriceAtPurchase: base,
                priceAdjustmentAtPurchase: priceAdjustment,
                addOnsTotalPriceAtPurchase: addOnsTotal,
                finalPriceAtPurchase: finalPrice
            };
        }));

        const order = await Order.create({
            user: req.params.userID,
            items: itemsSnapshot,
            deliveryDate: req.body.deliveryDate || null,
            balanceDue: itemsSnapshot.reduce((sum, i) => sum + (i.finalPriceAtPurchase * i.quantity), 0)
        });

        res.sendStatus(201);
    })
];


exports.order_getALL = [
    controllerUtils.verifyJWT,


    asyncHandler(async (req, res) => {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product", "name category");
        res.json(orders);

    })
]


exports.order_get = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        const { orderID } = req.params;
        const order = await Order.findById(orderID)
            .populate("user", "name email")
            .populate("items.product", "name category");
        res.json(order);
    })
]

// Update an order. The following fields can be updated: orderStatus, paymentStatus, deliveryDate. Requires JWT with admin.
exports.order_put = [

    body("orderStatus", "Order status must be one of: pending, complete, pending design, pending measurements, pending approval").optional()
        .isIn(["pending", "complete", "pending design", "pending measurements", "pending approval"]),
    body("paymentStatus", "Payment status must be one of: pending, partial, paid").optional()
        .isIn(["pending", "partial", "paid"]),
    body("deliveryDate", "Delivery date must be a valid date").optional().isISO8601().toDate(),
    controllerUtils.validateForm,
    controllerUtils.validateOrderID,

    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);

        const updateData = {};
        if (req.body.orderStatus) updateData.orderStatus = req.body.orderStatus;
        if (req.body.paymentStatus) updateData.paymentStatus = req.body.paymentStatus;
        if (req.body.deliveryDate) updateData.deliveryDate = req.body.deliveryDate;

        await Order.findByIdAndUpdate(req.params.orderID, updateData, { new: true, runValidators: true });
        res.sendStatus(200);
    })
];


exports.order_delete = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);
        const { orderID } = req.params;
        await Order.findByIdAndDelete(orderID);
        res.json({ msg: "Order deleted successfully" });
    })
]