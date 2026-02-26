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
exports.order_post = [
    body("items", "Orders must have at least one item").isArray({ min: 1 }),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    // controllerUtils.validateOrderItems, // TODO: custom validator to check product and variant validity

    asyncHandler(async (req, res) => {
        console.log('order post')

        // Snapshot each item
        const itemsSnapshot = await Promise.all(req.body.items.map(async (item) => {
            console.log('here')
            const product = await Product.findById(item.product);
            console.log('here2')
            if (!product) throw new Error(`Product ${item.product} not found`);

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


            if (!variantSnapshot) throw new Error(`Variant not found for product ${product.name}`);

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
            deliveryDate: req.body.deliveryDate || null
        });

        res.status(201).json(order);
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


exports.order_put = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,
    
    asyncHandler(async (req, res) => {
        
        const { orderStatus, paymentStatus, deliveryDate } = req.body;

        const updateData = {};
        if (orderStatus) updateData.orderStatus = orderStatus;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (deliveryDate) updateData.deliveryDate = deliveryDate;


        const updatedOrder = await Order.findByIdAndUpdate(req.params.orderID, updateData, { new: true, runValidators: true });
        res.json(updatedOrder);
    })
];


exports.order_delete = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        const { orderID } = req.params;
        await Order.findByIdAndDelete(orderID);
        res.json({ msg: "Order deleted successfully" });
    })
]