const User = require('../models/User');
const Trackday = require('../models/Trackday');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId;

/*
    JWT Expiration and management 
    JWT: What should it actually contain?
    JWT: after editing fields which make up the JWT, the JWT should be re-set! 
    what is asynchandler actually doing
    time restriction for changing groups
    Dissallow new user creation with same email
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

// Called by middleware functions
// Verify that the req.params.trackdayID is a valid objectID and that it exists in our DB
// TODO: Clean this up
async function validateTrackdayID(req, res, next){
    // Special case for validating trackdayID's for reschedule
    if (req.params.trackdayID_OLD && req.params.trackdayID_NEW){
        if (!(ObjectId.isValid(req.params.trackdayID_OLD) && ObjectId.isValid(req.params.trackdayID_NEW))) return res.status(404).send({msg: 'trackdayID is not a valid ObjectID'});
        const trackdayOLDExists = await Trackday.exists({_id: req.params.trackdayID_OLD});
        const trackdayNEWExists = await Trackday.exists({_id: req.params.trackdayID_NEW});
        if (!(trackdayOLDExists && trackdayNEWExists)) return res.status(404).send({msg: 'Trackday does not exist'});
        next();
    }else{
        if (!ObjectId.isValid(req.params.trackdayID)) return res.status(404).send({msg: 'trackdayID is not a valid ObjectID'});
        const trackdayExists = await Trackday.exists({_id: req.params.trackdayID});
        if (!trackdayExists) return res.status(404).send({msg: 'Trackday does not exist'});
        next();
    }
}

// Logs in a user. PUBLIC. Returns httpOnly cookie containing JWT token.
exports.login = [
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
                jwt.sign({id: user._id, memberType: user.memberType}, process.env.JWT_CODE, {expiresIn: process.env.JWT_TOKEN_EXPIRATION}, (err, token) => {
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

// Updates a users password. Requires JWT with matching userID OR admin
exports.updatePassword = [
    body("password", "Password must contain 8-50 characters and be a combination of letters and numbers").trim().isLength({ min: 8, max: 50}).matches(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).escape(),
    validateForm,
    validateUserID,

    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});
            // JWT is valid. Verify user is allowed to update password
            if (authData.memberType === 'admin' || authData.id === req.params.userID){
                console.log("authorized for password update")
                bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                    if (err) console.log("bcrypot error")
                    let user = await User.findById(req.params.userID).exec();
                    user.password = hashedPassword;
                    await user.save();
                    return res.sendStatus(200);
                })
            } else { // User is not authorized to change password
                return res.sendStatus(401)
            }
        }))
    }
]

// Returns a list of dates corresponding to dates the user is registered for. PUBLIC
exports.getTrackdays = [
    validateUserID,
    asyncHandler(async (req,res,next) => {
        let result = []
        const allTrackdays = await Trackday.find({members: {$elemMatch: { userID: {$eq: req.params.userID}}}} ).exec(); // Trackdays that user is a part of
        // For each trackday, append the date to the resulting array
        allTrackdays.forEach((trackday)=>result.push(trackday.date))        
        res.status(200).json({'trackdays' : result })
    })
]

// Returns true if the user is checked in for a given trackday. PUBLIC.
exports.verify = [
    validateUserID,
    validateTrackdayID,

    asyncHandler(async (req,res,next) => {
        const trackday = await Trackday.findById(req.params.trackdayID).exec();

        // Check that the member we want to verify for a trackday actually exists in the trackday
        const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
        memberEntry && memberEntry.checkedIn? res.status(200).json({'verified' : 'true'}) : res.status(200).json({'verified' : 'false'})
    })
]

// Adds a bike to the users garage. Requires JWT with matching userID OR admin. Returns ID of newly created bike.
exports.garage_post = [
    body("year",  "Year must contain 4 digits").trim().isNumeric().isLength({ min: 4, max: 4}).escape(),
    body("make",  "Make must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("model", "Model must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    validateUserID,
    validateForm,

    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to add bikes
            if (authData.memberType === 'admin' || authData.id === req.params.userID){
                const user = await User.findById(req.params.userID).exec();
                const bike = {year: req.body.year, make: req.body.make, model: req.body.model};
                user.garage.push(bike);
                await user.save();
                return res.status(200).json({_id: user.garage[user.garage.length-1].id});
            }
            return res.sendStatus(401)
        }))
    }
]

// Removes a bike from a users garage. Requires JWT with matching userID OR admin. Returns ID of newly created bike.
exports.garage_delete = [
    validateUserID,

    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to add bikes
            if (authData.memberType === 'admin' || authData.id === req.params.userID){
                if (!ObjectId.isValid(req.params.bikeID)) return res.status(404).send({msg: 'bikeID is not a valid ObjectID'});
                const user = await User.findById(req.params.userID).select('garage').exec();
        
                // Check that the bike we want to remove from the array actually exists
                const bikeExists = user.garage.some((bike) => bike._id.equals(req.params.bikeID))
                if (!bikeExists) return res.status(404).send({msg: 'Bike does not exist'});
        
                // Filter the array to remove the bike to be deleted and update the garage array
                user.garage = user.garage.filter((bike) => !bike._id.equals(req.params.bikeID));
                await user.save();
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    },
]

//////////////////////////////////////
//              CRUD
//////////////////////////////////////
// Get a single user. Requires JWT with matching userID OR admin
exports.user_get = [
    validateUserID,
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});
            // JWT is valid. Verify user is allowed to access this resource and return the information
            if (authData.memberType === 'admin' || authData.id === req.params.userID){
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
        if (authData.memberType === 'admin'){
            let users = await User.find().select('-password').exec();
            return res.status(200).json(users);
        }
        return res.sendStatus(401)
    }))
}

// Creates a user. PUBLIC.
// NOTE: We do not provide any JWT functionality here. It is up to the front end to make a POST request to /login if desired.
exports.user_post = [
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
        // Check if a user already exists with same email
        const duplicateUser = await User.find({'contact.email': {$eq: req.body.email}})
        if (duplicateUser.length) return res.status(409).send({msg: 'User with this email already exists'});
        
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            // Create the user and insert into the DB
            const user = new User({
                name: {firstName: req.body.name_firstName, lastName: req.body.name_lastName},
                contact: {email: req.body.email, phone:req.body.phone, address: req.body.address, city: req.body.city, province: req.body.province},
                emergencyContact: { name: {firstName: req.body.EmergencyName_firstName, lastName: req.body.EmergencyName_lastName}, phone: req.body.EmergencyPhone, relationship: req.body.EmergencyRelationship},
                group: req.body.group,
                credits: 0,
                memberType: 'regular',
                password: hashedPassword
            })
            await user.save();
            return res.status(201).json({id: user.id});
        })
    }),
]

// Update user info EXCLUDING password and garage. Requires JWT with matching userID OR admin
exports.user_put = [
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


    validateForm,
    validateUserID,
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to access this resource and update the object
            if (authData.memberType === 'admin' || authData.id === req.params.userID){
                const oldUser = await User.findById(req.params.userID).select('credits memberType password').exec();
                const user = new User({
                    name: {firstName: req.body.name_firstName, lastName: req.body.name_lastName},
                    contact: {email: req.body.email, phone:req.body.phone, address: req.body.address, city: req.body.city, province: req.body.province},
                    emergencyContact: { name: {firstName: req.body.EmergencyName_firstName, lastName: req.body.EmergencyName_lastName}, phone: req.body.EmergencyPhone, relationship: req.body.EmergencyRelationship},
                    group: req.body.group,
                    credits: (authData.memberType === 'admin' && req.body.credits)? req.body.credits : oldUser.credits,
                    memberType: (authData.memberType === 'admin' && req.body.memberType)? req.body.memberType : oldUser.memberType,
                    password: oldUser.password,
                    _id: req.params.userID,
                })
                await User.findByIdAndUpdate(req.params.userID, user, {});
                return res.status(201).json({_id: user.id});
            }
            return res.sendStatus(401)
        }))
    }
]

// Deletes a user. Requires JWT with admin.
exports.user_delete = [
    validateUserID,
    (req,res,next) => {
        // Unbundle JWT and check if admin 
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to access this resource and delete the user
            if (authData.memberType === 'admin'){
                await User.findByIdAndDelete(req.params.userID);
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]

// Testing use only, route available only in test NODE_env
exports.admin = [
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
                memberType: 'admin',
                password: hashedPassword
            })
            await user.save();
            return res.status(201).json({_id: user.id});
        })
    }),
]