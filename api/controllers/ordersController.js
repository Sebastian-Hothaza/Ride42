const { Product, Tire, Gear } = require('../models/Products');
const Order = require('../models/Orders');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const ObjectId = require('mongoose').Types.ObjectId;
const jwt = require('jsonwebtoken')
const controllerUtils = require('./controllerUtils')
const logger = require('../logger');


//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// A note about order inventory tracking:
// Inventory is decreased when an order is marked as paid.
// Inventory is increased when an order is cancelled IF it was previously marked as paid.

// Create a order. Requires JWT with matching userID OR admin
exports.order_post = [
    body("items", "Orders must have at least one item").isArray({ min: 1 }),
    body("items.*.product", "productID is not a valid ObjectID").isMongoId(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,

    asyncHandler(async (req, res, next) => {
        // Attempt to create order for another user without being the admin
        if (req.user.id !== req.params.userID && req.user.memberType !== 'admin') return res.sendStatus(403);

        // Snapshot each item/product
        const itemsSnapshot = await Promise.all(req.body.items.map(async (item) => {

            // Find product
            if (!ObjectId.isValid(item.product)) return res.status(400).send({ msg: ['productID is not a valid ObjectID'] });
            const product = await Product.findById(item.product);
            if (!product) return res.status(404).send({ msg: ['Product does not exist'] });


            // Find variant
            let variantSnapshot;
            if (product.category === "tire") {
                variantSnapshot = product.variants.find(v =>
                    v.size === item.variant.size &&
                    v.compound === item.variant.compound
                );
                if (!variantSnapshot) return res.status(404).send({ msg: ['Variant does not exist'] });


                // Verify variant is in stock
                // if (variantSnapshot.stock < item.quantity) return res.status(400).send({ msg: ['Out of Stock'] })

            } else if (product.category === "gear") {
                // TODO
            }

            return {
                product: product._id,
                size: item.variant.size,
                //addOns: "TODO",
                quantity: item.quantity,
                price: variantSnapshot.price,

                //color: "TODO",
                compound: item.variant.compound,
                installRequired: item.installRequired
            };
        }));



        const order = await Order.create({
            user: req.params.userID,
            items: itemsSnapshot,
            balanceDue: itemsSnapshot.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            deliveryDate: req.body.deliveryDate || null
        });

        res.sendStatus(201);
    })
];

// Returns all orders if getALL=true and user is admin, otherwise returns orders for the logged in user. Requires JWT.
exports.order_getALL = [
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        if (req.query.getAll === 'true' && req.user.memberType !== "admin") return res.sendStatus(403);
        const orders = req.query.getAll === 'true' ? await Order.find().populate("items.product", "category name").populate("user", "firstName lastName") :
            (await Order.find().populate("items.product", "name category").populate("user", "firstName lastName")).filter(order => order.user._id.toString() === req.user.id);
        res.json(orders);
    })
]


exports.order_get = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.orderID)
            .populate("user", "firstName lastName")
            .populate("items.product", "name category");
        if (req.user.memberType !== "admin" && req.user.id !== order.user.id) return res.sendStatus(403);
        res.json(order);
    })
]

// Update an order. The following fields can be updated: orderStatus, paymentStatus, deliveryDate. Requires JWT with admin.

/*
TODO: Revise to match this formatting: 
const userAllowed = ["deliveryDate"];
const adminAllowed = ["deliveryDate", "paymentStatus", "orderStatus"];

const allowedFields = req.user.memberType === "admin"
  ? adminAllowed
  : userAllowed;

const updates = Object.fromEntries(
  Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
);

await Order.findByIdAndUpdate(req.params.id, { $set: updates });

*/

exports.order_put = [

    body("orderStatus", "Order status must be one of: pending, complete, pending design, pending measurements, pending approval").optional()
        .isIn(["pending", "complete", "pending design", "pending measurements", "pending approval"]),
    body("paymentStatus", "Payment status must be one of: partial, paid").optional()
        .isIn(["partial", "paid"]),
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

        if (req.body.paymentStatus === "paid") {

            // Check inventory and decrement stock
            const order = await Order.findById(req.params.orderID);
            if (order.paymentStatus === "paid") return res.status(400).send({ msg: ['Order already marked as paid'] });


            for (const item of order.items) {
                const product = await Product.findById(item.product);
                let variant;
                if (product.category === "tire") {
                    variant = product.variants.find(v =>
                        v.size === item.size &&
                        v.compound === item.compound
                    );
                    if (!variant) return res.status(404).send({ msg: ['Variant does not exist'] });
                    if (variant.stock < item.quantity) return res.status(400).send({ msg: ['Insufficient inventory'] });
                    variant.stock -= item.quantity;
                    await product.save();
                }
            }
        }

        await Order.findByIdAndUpdate(req.params.orderID, updateData, { new: true, runValidators: true });
        res.sendStatus(200);
    })
];


exports.order_delete = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.orderID).populate("user", "id");

        if (req.user.memberType !== "admin" && req.user.id !== order.user.id) return res.sendStatus(403);

        if (order.paymentStatus === "paid" && req.user.memberType !== "admin") return res.status(400).send({ msg: ['Cannot delete paid order'] });

        if (order.paymentStatus === "paid") {
            // If order was paid, increase stock back
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                let variant;
                if (product.category === "tire") {
                    variant = product.variants.find(v =>
                        v.size === item.size &&
                        v.compound === item.compound
                    );
                    if (variant) {
                        variant.stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }
        await Order.findByIdAndDelete(req.params.orderID);
        res.json({ msg: "Order deleted successfully" });
    })
]