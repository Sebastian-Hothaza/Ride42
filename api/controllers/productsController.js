const Product = require('../models/Products');
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
    body("name", "Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).escape(),
    body("category", "Category must be one of: pirelli, plus, helite").trim().isIn(["pirelli", "plus", "helite"]),
    body("price", "Price must be a number").isNumeric().optional({ nullable: true }),


    controllerUtils.verifyJWT,
    asyncHandler(async (req, res, next) => {
        if (req.user.memberType !== 'admin') return res.sendStatus(403);

        const product = new Product({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
        })

        await product.save();
        logger.info({ message: `Created product ${product.name}` });
        return res.status(201).json({ id: product.id });
    }),
]

// Get a single product. Requires JWT.
exports.product_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateProductID,

    asyncHandler(async (req, res, next) => {
        let product = await Product.findById(req.params.productID);
        return res.status(200).json(product);
    })
]

// Gets all users. Requires JWT with staff/admin/coach
exports.product_getALL = [
    controllerUtils.verifyJWT,

    asyncHandler(async (req, res) => {
        let products = await Product.find();
        return res.status(200).json(products);
    }),
]

// Create a product. Requires JWT with admin
exports.product_put = [
    body("name", "Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).escape(),
    body("category", "Category must be one of: pirelli, plus, helite").trim().isIn(["pirelli", "plus", "helite"]),
    body("price", "Price must be a number").isNumeric().optional({ nullable: true }),
    body("frontCompound", "Front Compound must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).optional({ nullable: true }),
    body("frontSize", "Front Size must be a number").isNumeric().optional({ nullable: true }),
    body("rearCompound", "Rear Compound must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).optional({ nullable: true }),
    body("rearSize", "Rear Size must be a number").isNumeric().optional({ nullable: true }),

    controllerUtils.verifyJWT,
    controllerUtils.validateProductID,
    asyncHandler(async (req, res, next) => {
        if (req.user.memberType !== 'admin') return res.sendStatus(403);

        const product = new Product({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            front: {
                compound: req.body.frontCompound,
                size: req.body.frontSize
            },
            rear: {
                compound: req.body.rearCompound,
                size: req.body.rearSize
            }
        })

        await Product.findByIdAndUpdate(req.params.productID, product, {});
        logger.info({ message: `Updated product ${product.name}` });
        return res.status(200).json(product);
    }),
]

// Delete a product. Requires JWT with admin
exports.product_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateProductID,
    asyncHandler(async (req, res, next) => {
        if (req.user.memberType !== 'admin') return res.sendStatus(403);

        const product = await Product.findByIdAndDelete(req.params.productID);
        logger.info({ message: `Deleted product ${product.name}` });
        return res.status(200).json(product);
    }),
]