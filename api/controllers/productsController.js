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
    // Common validations
    body("name", "Name must be between 2 and 50 characters").trim().isLength({ min: 2, max: 50 }),
    body("category", "Category must be either tire or gear").trim().isIn(['tire', 'gear']).escape(),

    controllerUtils.verifyJWT,

    // custom middleware to run category-specific validators
    async (req, res, next) => {
        const tireValidation = [
            body("variants", "Variants must be an array with at least one item").isArray({ min: 1 }),
            body("variants.*.size", "Each variant must have a valid size").isIn(["200/60", "180/60", "120/70"]),
            body("variants.*.compound", "Each variant must have a valid compound").isIn(["SC1", "SC2", "SC3"]),
            body("variants.*.price", "Price must be a number >= 0").isFloat({ min: 0 }),
            body("variants.*.stock", "Stock must be an integer >= 0").isInt({ min: 0 }),
        ];
        const gearValidation = [
            body("basePrice", "Base price must be a number >= 0").isFloat({ min: 0 }),

            body("sizes", "Sizes must be an array with at least one valid size").optional().isArray({ min: 1 }),
            body("sizes.*", "Invalid size").isIn(["S", "M", "L", "XL", "XXL", "Custom", "S/M", "L/XL"]),

            body("colors", "Colors must be an array with at least one valid color").optional().isArray({ min: 1 }),
            body("colors.*", "Invalid color").isIn(["Black", "White", "Red", "Blue", "Green", "Lime", "Custom"]),

            body("addOnOptions").optional().isArray(),
            body("addOnOptions.*.name", "Invalid add-on name").optional().isIn(["TPUCaps", "2-piece", "kangarooLeather", "airbagReady", "stingrayArmor", "gloveBundleDiscount"]),
            body("addOnOptions.*.priceAdjustment", "Add-on price must be >= 0").isInt()
        ];

        // Only run if category is tire
        if (req.body.category === "tire") {
            await Promise.all(tireValidation.map(v => v.run(req)));
        } else if (req.body.category === "gear") {
            await Promise.all(gearValidation.map(v => v.run(req)));
        }
        next();
    },
    controllerUtils.validateForm,

    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);
        let product;

        if (req.body.category === "tire") {
            product = new Tire({ name: req.body.name, variants: req.body.variants });
        } else if (req.body.category === "gear") {
            console.log('create gear')
            product = new Gear({ name: req.body.name, basePrice: req.body.basePrice, sizes: req.body.sizes, colors: req.body.colors, addOnOptions: req.body.addOnOptions });
        }
        await product.save();
        console.log('saved product')
        logger.info({ message: `Created ${req.body.category} product ${product.name}` });
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
    // Common validations
    body("name", "Name must be between 2 and 50 characters").trim().isLength({ min: 2, max: 50 }),
    body("category", "Category must be either tire or gear").trim().isIn(['tire', 'gear']).escape(),

    controllerUtils.verifyJWT,

    // custom middleware to run category-specific validators
    async (req, res, next) => {
        const tireValidation = [
            body("variants", "Variants must be an array with at least one item").isArray({ min: 1 }),
            body("variants.*.size", "Each variant must have a valid size").isIn(["200/60", "180/60", "120/70"]),
            body("variants.*.compound", "Each variant must have a valid compound").isIn(["SC1", "SC2", "SC3"]),
            body("variants.*.price", "Price must be a number >= 0").isFloat({ min: 0 }),
            body("variants.*.stock", "Stock must be an integer >= 0").isInt({ min: 0 }),
        ];
        const gearValidation = [
            body("basePrice", "Base price must be a number >= 0").isFloat({ min: 0 }),

            body("sizes", "Sizes must be an array with at least one valid size").optional().isArray({ min: 1 }),
            body("sizes.*", "Invalid size").isIn(["S", "M", "L", "XL", "XXL", "Custom", "S/M", "L/XL"]),

            body("colors", "Colors must be an array with at least one valid color").optional().isArray({ min: 1 }),
            body("colors.*", "Invalid color").isIn(["Black", "White", "Red", "Blue", "Green", "Lime", "Custom"]),

            body("addOnOptions").optional().isArray(),
            body("addOnOptions.*.name", "Invalid add-on name").optional().isIn(["TPUCaps", "2-piece", "kangarooLeather", "airbagReady", "stingrayArmor", "gloveBundleDiscount"]),
            body("addOnOptions.*.priceAdjustment", "Add-on price must be >= 0").isInt()
        ];

        // Only run if category is tire
        if (req.body.category === "tire") {
            await Promise.all(tireValidation.map(v => v.run(req)));
        } else if (req.body.category === "gear") {
            await Promise.all(gearValidation.map(v => v.run(req)));
        }
        next();
    },
    controllerUtils.validateForm,
    controllerUtils.validateProductID,

    asyncHandler(async (req, res) => {
        if (req.user.memberType !== "admin") return res.sendStatus(403);
        const existing = await Product.findById(req.params.productID);

        // Prevent changing discriminator type
        if (existing.category !== req.body.category) {
            return res.status(400).json({ message: "Cannot change product category once created" });
        }

        let updated;
        if (req.body.category === "tire") {
            console.log('update tire')
            updated = await Tire.findByIdAndUpdate(
                req.params.productID,
                { name: req.body.name, variants: req.body.variants },
                { new: true, runValidators: true }
            );
        } else if (req.body.category === "gear") {
            updated = await Gear.findByIdAndUpdate(
                req.params.productID,
                { name: req.body.name, basePrice: req.body.basePrice, sizes: req.body.sizes, colors: req.body.colors, addOnOptions: req.body.addOnOptions },
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