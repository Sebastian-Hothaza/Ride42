const User = require('../models/User');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId;

/*
    JWT Expiration and management 
    JWT: What should it actually contain?
    what is asynchandler actually doing
*/

// Called by middleware functions
// Validates the form contents and builds errors array. In case of errors, returns 400 with errors array
// TODO: Make return only the message (?)
function validateForm(req,res,next){
    const errors = validationResult(req); // Extract the validation errors from a request.
    if (!errors.isEmpty())  return res.status(400).json(errors.mapped()); //TODO: How should this present errors? Update README, this may be the best decision
    next();
}

// Called by middleware functions
// Verify that the req.params.userID is a valid objectID and that it exists in our DB
async function validateUserID(req, res, next){
    if (!ObjectId.isValid(req.params.userID)) return res.status(404).send({msg: 'userID is not a valid ObjectID'});
    const userExists = await User.exists({_id: req.params.userID});
    if (!userExists) return res.status(404).send({msg: 'User does not exist'});
    next();
}

exports.login = [
    // PUBLIC
    body("email", "Email must be in format of samplename@sampledomain.com").trim().isEmail().escape(), 
    body("password", "Password must not be empty").trim().notEmpty().escape(), 
    validateForm,


 // Form data is valid. Check that user exists in DB and that password matches
    asyncHandler(async (req, res, next) => {
        const user = await User.findOne({'contact.email': req.body.email}).exec();
        if (user){
            // Verify Password
            const passwordMatch = await bcrypt.compare(req.body.password, user.password)
            if (passwordMatch){
                // TODO: Double check environment variable name BCRYPT_CODE --- should perhaps call it JWT_CODE
                jwt.sign({id: user._id, type: user.type}, process.env.JWT_CODE, {expiresIn: process.env.JWT_TOKEN_EXPIRATION}, (err, token) => {
                    res.cookie([`JWT_TOKEN=${token}; secure; httponly; samesite=None;`])
                    res.json({name: user.name.firstName})
                }) 
            }else{
                return res.status(401).json({msg: 'Incorrect Password'});
            }  
        }else{
            return res.status(400).json({msg: 'User not in DB'});
        }
    }),
]

exports.getTrackdays = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: getTrackdays for _id: '+req.params.userID)
}

exports.verify = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: verify for _id: '+req.params.userID)
}

//////////////////////////////////////
//              CRUD
//////////////////////////////////////
// Get a single user; requires JWT with matching userID OR admin
exports.user_get = [
    validateUserID,
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to access this resource and return the information
            if (authData.type === 'admin' || authData.id === req.params.userID){
                let user = await User.findById(req.params.userID).select('-password')
                return res.status(200).json(user);
            }
            return res.sendStatus(401)
        }))
    }
]

// Gets all users. Requires JWT with admin
exports.user_getALL = (req,res,next) => {
    // Unbundle JWT and check if admin 
    jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
        if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
        // JWT is valid. Verify user is allowed to access this resource and return the information
        if (authData.type === 'admin'){
            let users = await User.find().select('-password')
            return res.status(200).json(users);
        }
        return res.sendStatus(401)
    }))
}


exports.user_post = [
    // PUBLIC
    body("name_firstName", "First Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("name_lastName", "Last Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("email", "Email must be in format of samplename@sampledomain.com").trim().isEmail().escape(), 
    body("phone", "Phone must contain 10 digits").trim().isLength({ min: 10, max: 10}).escape(), 
    body("address", "Address must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("city", "City must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("province", "Province must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("EmergencyName_firstName", "Emergency Contact First Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("EmergencyName_lastName", "Emergency Contact Last Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("EmergencyPhone", "Emergency Phone must contain 10 digits").trim().isLength({ min: 10, max: 10}).escape(),
    body("EmergencyRelationship", "Emergency Contact relationship definition must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("group", "Group must be either green, yellow or red").trim().isIn(['green', 'yellow', 'red']).escape(),
    body("password", "Password must contain 8-50 characters and be a combination of letters and numbers").trim().isLength({ min: 8, max: 50}).matches(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).escape(),

    validateForm,

  
    
    asyncHandler(async(req, res, next)=>{
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            // Create the user and insert into the DB
            const user = new User({
                name: {firstName: req.body.name_firstName, lastName: req.body.name_lastName},
                contact: {email: req.body.email, phone:req.body.phone, address: req.body.address, city: req.body.city, province: req.body.province},
                emergencyContact: { name: {firstName: req.body.EmergencyName_firstName, lastName: req.body.EmergencyName_lastName}, phone: req.body.EmergencyPhone, relationship: req.body.EmergencyRelationship},
                group: req.body.group,
                credits: 0,
                type: 'regular',
                password: hashedPassword
            })
            await user.save();
            return res.status(201).json({_id: user.id});
        })
    }),
    // NOTE: We do not provide any JWT functionality here. It is up to the front end to make a POST request to /login if desired.
]

exports.user_put = [
    // Logged in user

    // TODO: Verify jwt 


    body("name_firstName", "First Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("name_lastName", "Last Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("email", "Email must be in format of samplename@sampledomain.com").trim().isEmail().escape(), 
    body("phone", "Phone must contain 10 digits").trim().isLength({ min: 10, max: 10}).escape(), 
    body("address", "Address must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("city", "City must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("province", "Province must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("EmergencyName_firstName", "Emergency Contact First Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("EmergencyName_lastName", "Emergency Contact Last Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("EmergencyPhone", "Emergency Phone must contain 10 digits").trim().isLength({ min: 10, max: 10}).escape(),
    body("EmergencyRelationship", "Emergency Contact relationship definition must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    body("group", "Group must be either green, yellow or red").trim().isIn(['green', 'yellow', 'red']).escape(),
    body("password", "Password must contain 8-50 characters and be a combination of letters and numbers").trim().isLength({ min: 8, max: 50}).matches(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).escape(),

    validateForm,
    (req,res,next) => {res.send('NOT YET IMPLEMENTED: user_put for _id: '+req.params.userID)}
]

exports.user_delete = (req,res,next) => {
    // Admin only
    res.send('NOT YET IMPLEMENTED: user_delete for _id: '+req.params.userID)
}