const { Product, Tire, Gear } = require('../models/Products');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')
const controllerUtils = require('./controllerUtils')
const logger = require('../logger');


//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Create a product. Requires JWT with admin
exports.product_post = [
    body("name", "Name must be between 2 and 50 characters").trim().isLength({ min: 2, max: 50 }),
    body("category", "Category must be either tire or gear").trim().isIn(['tire', 'gear']).escape(),
    body("basePrice", "Base price must be a number").isNumeric(),
    body("variants", "Variants must be an array with at least one element").isArray({ min: 1 }),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,

    asyncHandler(async (req, res) => {
        console.log('a')
        if (req.user.memberType !== "admin") return res.sendStatus(403);

        const { name, category, basePrice, variants } = req.body;

        let product;

        if (category === "tire") {
            product = new Tire({
                name,
                basePrice: 0, // tires use variant-level pricing
                variants
            });
        }

        if (category === "gear") {
            product = new Gear({
                name,
                basePrice,
                variants
            });
        }

        await product.save();

        logger.info({ message: `Created ${category} product ${product.name}` });

        res.status(201).json({ id: product._id });
    })
];

// Get a single product. Requires JWT.
exports.product_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateProductID,

    asyncHandler(async (req, res, next) => {
        let product = await Product.findById(req.params.productID);
        return res.status(200).json(product);
    })
]

// Gets all products. Requires JWT.
exports.product_getALL = [
    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        let products = await Product.find();
        return res.status(200).json(products);
    }),
]

// Create a product. Requires JWT with admin
exports.product_put = [
    body("name", "Name must be between 2 and 50 characters").trim().isLength({ min: 2, max: 50 }),
    body("category", "Category must be either tire or gear").trim().isIn(['tire', 'gear']).escape(),
    body("basePrice", "Base price must be a number").isNumeric(),
    body("variants", "Variants must be an array with at least one element").isArray({ min: 1 }),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateProductID,

    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);

        const { productID } = req.params;
        const { name, category, basePrice, variants } = req.body;

        const existing = await Product.findById(productID);
        if (!existing) return res.sendStatus(404);

        // Prevent changing discriminator type
        if (existing.category !== category) {
            return res.status(400).json({
                message: "Cannot change product category once created"
            });
        }

        let updated;

        if (category === "tire") {
            updated = await Tire.findByIdAndUpdate(
                productID,
                {
                    name,
                    basePrice: 0, // tires ignore basePrice
                    variants
                },
                { new: true, runValidators: true }
            );
        }

        if (category === "gear") {
            updated = await Gear.findByIdAndUpdate(
                productID,
                {
                    name,
                    basePrice,
                    variants
                },
                { new: true, runValidators: true }
            );
        }

        res.json(updated);
    })
];

// Delete a product. Requires JWT with admin
exports.product_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateProductID,
    asyncHandler(async (req, res, next) => {
        if (req.user.memberType !== 'admin') return res.sendStatus(403);

        const product = await Product.findByIdAndDelete(req.params.productID);
        logger.info({ message: `Deleted product ${product.name}` });
        return res.sendStatus(200);
    }),
]