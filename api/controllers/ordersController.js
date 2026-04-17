const { Product, Tire, Gear } = require('../models/Products');
const Trackday = require('../models/Trackday');
const User = require('../models/User')
const Order = require('../models/Orders');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const ObjectId = require('mongoose').Types.ObjectId;
const jwt = require('jsonwebtoken')
const controllerUtils = require('./controllerUtils')
const sendEmail = require('../mailer')
const mailTemplates = require('../mailer_templates')
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
    body("deliveryDate", "Delivery date must be a valid date").optional({ values: "falsy" }).isISO8601().toDate(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,

    asyncHandler(async (req, res, next) => {
        // Attempt to create order for another user without being the admin
        if (req.user.id !== req.params.userID && req.user.memberType !== 'admin') return res.sendStatus(403);

        // If deliveryDate is provided, make sure it matches a future trackday date
        if (req.body.deliveryDate) {
            const upcomingTrackdays = await Trackday.find({ date: { $gt: new Date() } }).select('date -_id').exec();
            const validDeliveryDate = upcomingTrackdays.some(item =>
                new Date(item.date).getTime() === new Date(req.body.deliveryDate).getTime()
            );
            if (!validDeliveryDate) return res.status(400).send({ msg: ['Delivery date is not a valid upcoming trackday'] });
        }

        // Snapshot each item/product
        // TODO: We should NOT return res.status here. Instead we should be throwing an error for the handler...
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
                    (item.variant.compound === null || v.compound === item.variant.compound)
                );
                if (!variantSnapshot) return res.status(404).send({ msg: ['Variant does not exist'] });


                // Verify variant is in stock
                // if (variantSnapshot.stock < item.quantity) return res.status(400).send({ msg: ['Out of Stock'] })

            } else if (product.category === "gear") {
                // TODO
            }

            return {
                product: product._id,
                name: product.name,
                category: product.category,
                size: item.variant.size,
                quantity: item.quantity,
                price: variantSnapshot.price,

                // For Tire
                compound: item.variant.compound,
                installRequired: item.installRequired

                // For Gear
                // TODO
            };
        }));


        const balanceDueSnapshot = itemsSnapshot.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        await Order.create({
            user: req.params.userID,
            items: itemsSnapshot,
            balanceDue: balanceDueSnapshot,
            deliveryDate: req.body.deliveryDate || null
        });
        const user = await User.findById(req.params.userID);
        logger.info({ message: `Order created for ${req.user.name}` });
        sendEmail(user.contact.email, "Your Ride42 Order Has Been Created", mailTemplates.createTireOrder, {
            name: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1),
            balanceDue: balanceDueSnapshot,
        })
        res.sendStatus(201);
    })
];

// Returns all orders if getALL=true and user is admin, otherwise returns orders for the logged in user. Requires JWT.
exports.order_getALL = [
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        if (req.query.getAll === 'true' && req.user.memberType !== "admin") return res.sendStatus(403);
        const orders = req.query.getAll === 'true' ? await Order.find().populate("user", "firstName lastName") :
            (await Order.find().populate("user", "firstName lastName")).filter(order => order.user._id.toString() === req.user.id);
        res.json(orders);
    })
]


exports.order_get = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.orderID)
            .populate("user", "firstName lastName")
        if (req.user.memberType !== "admin" && req.user.id !== order.user.id) return res.sendStatus(403);
        res.json(order);
    })
]

// Update an order. The following fields can be updated: orderStatus, paymentStatus, deliveryDate. Requires JWT with admin.
exports.order_put = [
    body("orderStatus", "Order status must be one of: pending, complete, pending design, pending measurements, pending approval").optional()
        .isIn(["pending", "complete", "pending design", "pending measurements", "pending approval"]),
    body("paymentStatus", "Payment status must be one of: partial, paid").optional()
        .isIn(["partial", "paid"]),
    body("deliveryDate", "Delivery date must be a valid date").optional({ values: "falsy" }).isISO8601().toDate(),
    controllerUtils.validateForm,
    controllerUtils.validateOrderID,

    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);
        const order = await Order.findById(req.params.orderID).populate("user", "id firstName lastName contact.email");
        const updateData = {};
        if (req.body.orderStatus) updateData.orderStatus = req.body.orderStatus;
        if (req.body.paymentStatus) updateData.paymentStatus = req.body.paymentStatus;
        updateData.deliveryDate = req.body.deliveryDate;

        // If delivery date is provided, make sure its valid, else its null
        if (req.body.deliveryDate) {
            const upcomingTrackdays = await Trackday.find({ date: { $gt: new Date() } }).select('date -_id').exec();
            const validDeliveryDate = upcomingTrackdays.some(item =>
                new Date(item.date).getTime() === new Date(req.body.deliveryDate).getTime()
            );
            if (!validDeliveryDate) return res.status(400).send({ msg: ['Delivery date is not a valid upcoming trackday'] });
        }

        if (req.body.paymentStatus === "paid" && order.paymentStatus !== "paid") {
            // Check inventory and decrement stock
            for (const item of order.items) {
                const product = await Product.findById(item.product);
                let variant;
                if (product.category === "tire") {
                    variant = product.variants.find(v =>
                        v.size === item.size &&
                        (item.compound === null || v.compound === item.compound)
                    );
                    if (!variant) return res.status(404).send({ msg: ['Variant does not exist'] });
                    if (variant.stock < item.quantity) return res.status(400).send({ msg: ['Insufficient inventory'] });
                    variant.stock -= item.quantity;
                    await product.save();
                }
            }

            // Send email
            const prettyDeliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('default', { month: 'long', day: 'numeric' }) : null;
            const prettyOrderDate = new Date(order.orderDate).toLocaleDateString('default', { month: 'long', day: 'numeric' });
            sendEmail(order.user.contact.email, "Your Ride42 Order Has Been Paid", mailTemplates.paidTireOrder, {
                name: order.user.firstName.charAt(0).toUpperCase() + order.user.firstName.slice(1),
                orderDate: prettyOrderDate,
                deliveryDate: prettyDeliveryDate ? `at the ${prettyDeliveryDate} trackday` : 'for local pick-up in Kitchener. Please reply to this email to schedule a pick-up time.'
            })
        }
        await Order.findByIdAndUpdate(req.params.orderID, updateData, { new: true, runValidators: true });
        logger.info({ message: `Updated order ${req.params.orderID}` });
        res.sendStatus(200);
    })
];


exports.order_delete = [
    controllerUtils.validateOrderID,
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.orderID).populate("user", "id firstName lastName contact.email");

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
                        (item.compound === null || v.compound === item.compound)
                    );
                    if (variant) {
                        variant.stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }
        await Order.findByIdAndDelete(req.params.orderID);
        logger.info({ message: `Deleted order ${order._id} for ${order.user.firstName} ${order.user.lastName}` });
        sendEmail(order.user.contact.email, "Your Ride42 Order Has Been Deleted", mailTemplates.deleteTireOrder, { name: order.user.firstName.charAt(0).toUpperCase() + order.user.firstName.slice(1) })
        return res.sendStatus(200);
    })
]