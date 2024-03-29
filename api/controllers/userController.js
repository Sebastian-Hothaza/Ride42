const User = require('../models/User');
const Trackday = require('../models/Trackday');
const Bike = require('../models/Bike');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const controllerUtils = require('./controllerUtils')


/*
    --------------------------------------------- TODO ---------------------------------------------
    code cleanup & review
    --------------------------------------------- TODO ---------------------------------------------
*/

// Logs in a user. PUBLIC. Returns httpOnly cookie containing JWT token.
exports.login = [
    body("email", "Email must be in format of samplename@sampledomain.com").trim().isEmail().escape(), 
    body("password", "Password must not be empty").trim().notEmpty().escape(), 
    controllerUtils.validateForm,

    // Form data is valid. Check that user exists in DB and that password matches
    asyncHandler(async (req, res, next) => {
        const user = await User.findOne({'contact.email': req.body.email}).exec();
        if (user){
            // Verify Password
            const passwordMatch = await bcrypt.compare(req.body.password, user.password)
            if (passwordMatch){
                // Generate tokens and attach as cookies
                const accessToken = jwt.sign({id: user._id, memberType: user.memberType, name: user.name.firstName}, process.env.JWT_ACCESS_CODE, {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION}) 
                const refreshToken = jwt.sign({id: user._id}, process.env.JWT_REFRESH_CODE, {expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION}) 
                res.cookie([`JWT_ACCESS_TOKEN=${accessToken}; secure; httponly; samesite=None;`])
                res.cookie([`JWT_REFRESH_TOKEN=${refreshToken}; secure; httponly; samesite=None;`])

                // Store user specific refresh token in DB
                user.refreshToken = refreshToken;
                await user.save();
                res.sendStatus(200)
            }else{
                return res.status(400).json({msg: 'Incorrect Password'});
            }  
        }else{
            return res.status(400).json({msg: 'User not in DB'});
        }
    }),
]

// Updates a users password. Requires JWT with matching userID OR admin
exports.updatePassword = [
    body("password", "Password must contain 8-50 characters and be a combination of letters and numbers").trim().isLength({ min: 8, max: 50}).matches(/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).escape(),
    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,

    asyncHandler(async (req,res,next) => {
        // JWT is valid. Verify user is allowed to update password
        if (req.user.memberType === 'admin' || req.user.id === req.params.userID){
            bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                if (err) console.log("bcrypt error")
                let user = await User.findById(req.params.userID).exec();
                user.password = hashedPassword;
                await user.save();
                res.sendStatus(200);
            })
            return;
        }
        return res.sendStatus(403)
    })
]

// Returns a list of dates corresponding to dates the user is registered for. PUBLIC
exports.getTrackdays = [
    controllerUtils.validateUserID,
    asyncHandler(async (req,res,next) => {
        let result = []
        const allTrackdays = await Trackday.find({members: {$elemMatch: { userID: {$eq: req.params.userID}}}} ).exec(); // Trackdays that user is a part of
        // For each trackday, append the date to the resulting array
        allTrackdays.forEach((trackday)=>result.push(trackday.date))        
        res.status(200).json({'trackdays' : result })
    })
]

// Returns true if the user/bike is checked in for a given trackday. PUBLIC.
exports.verify = [
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.validateBikeID,

    asyncHandler(async (req,res,next) => {
        const trackday = await Trackday.findById(req.params.trackdayID).exec();

        // Check that the member we want to verify for a trackday actually exists in the trackday
        const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
        

        memberEntry && memberEntry.checkedIn.includes(req.params.bikeID)? res.status(200).json({'verified' : 'true'}) : res.status(200).json({'verified' : 'false'})
    })
]

// Adds a bike to the users garage. Requires JWT with matching userID OR admin. 
exports.garage_post = [
    body("year",  "Year must contain 4 digits").trim().isNumeric().isLength({ min: 4, max: 4}).escape(),
    body("make",  "Make must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("model", "Model must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin' || req.user.id === req.params.userID){
            const user = await User.findById(req.params.userID).exec();
            let bike
            
            // Check if bike exists in the DB. If it does not, add it.
            bike = await Bike.findOne({year: {$eq: req.body.year}, make: {$eq: req.body.make}, model: {$eq: req.body.model}})
            if (!bike){
                bike = new Bike({year: req.body.year, make: req.body.make, model: req.body.model});
                await bike.save()
            }

            // Check if user already has this bike in their garage
            for (let i=0; i<user.garage.length; i++){
                if (user.garage[i].equals(bike.id)) return res.status(409).send({msg: 'Bike with these details already exists'});
            }
            
            user.garage.push(bike);

            await user.save();
            return res.status(201).json({id: bike.id});;
        }
        return res.sendStatus(403)
    })
]

// Removes a bike from a users garage. Requires JWT with matching userID OR admin. 
exports.garage_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateBikeID,

    asyncHandler(async (req,res,next) => {
        if (req.user.memberType === 'admin' || req.user.id === req.params.userID){
            const user = await User.findById(req.params.userID).select('garage').exec();
            const numBikesOriginally = user.garage.length;
            user.garage = user.garage.filter((bikeID)=>(!bikeID.equals(req.params.bikeID)))

            await user.save()
            return (numBikesOriginally>user.garage.length)? res.sendStatus(200) : res.sendStatus(404)
        }
        return res.sendStatus(403)
    }),
]


//////////////////////////////////////
//              CRUD
//////////////////////////////////////
// Get a single user. Requires JWT with matching userID OR admin
exports.user_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,

    asyncHandler(async(req,res,next) => {
        // JWT is valid. Verify user is allowed to access this resource and return the information
        if (req.user.memberType === 'admin' || req.user.id === req.params.userID){
            let user = await User.findById(req.params.userID).populate("garage").select('-password -refreshToken')
            return res.status(200).json(user);
        }
        return res.sendStatus(403)
    })
]

// Gets all users. Requires JWT with admin
exports.user_getALL = [
    controllerUtils.verifyJWT,

    asyncHandler(async(req,res)=>{
        // JWT is valid. Verify user is allowed to access this resource and return the information
        if (req.user.memberType === 'admin'){
            let users = await User.find().populate("garage").select('-password -refreshToken').exec();
            return res.status(200).json(users);
        }
        return res.sendStatus(403);
    }),
]

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

    controllerUtils.validateForm,

  
    
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
/*
    /// PERMISSIONS ///
    USER: contact, emergencyContact, group(7 day requirement; else fail entire request)
    ADMIN: name, credits, member type
    NOTES: garage and password is managed thru separate funtion
*/
exports.user_put = [
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

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    
    asyncHandler(async (req,res,next) => {
        // JWT is valid. Verify user is allowed to access this resource and update the object
        // If user attempts to tamper with unauthorized fields, return 403
        if (req.user.memberType !== 'admin' &&
            (req.body.name_firstName || req.body.name_lastName ||
                req.body.credits || req.body.memberType)) return res.sendStatus(403) 

        if (req.user.id === req.params.userID || req.user.memberType === 'admin'){ // User is editing themselves or admin is editing them

            const oldUser = await User.findById(req.params.userID).exec();

            // Check if a user already exists with same email
            const duplicateUser = await User.findOne({'contact.email': {$eq: req.body.email}})
            if (duplicateUser && oldUser.contact.email !== req.body.email) return res.status(409).send({msg: 'User with this email already exists'});

            // If user attempt to change group and has a trackday booked < lockout period(7 default) away, fail update entirely
            if (req.body.group !== oldUser.group && req.user.memberType !== 'admin' && await controllerUtils.hasTrackdayWithinLockout(req.params.userID)){
                return res.status(401).send({msg: 'Cannot change group when registered for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }
            const user = new User({
                name: {firstName: (req.user.memberType === 'admin' && req.body.name_firstName)? req.body.name_firstName: oldUser.name_firstName,
                        lastName: (req.user.memberType === 'admin' && req.body.name_lastName)? req.body.name_lastName: oldUser.name_lastName},
                contact: {email: req.body.email, phone:req.body.phone, address: req.body.address, city: req.body.city, province: req.body.province},
                emergencyContact: { name: {firstName: req.body.EmergencyName_firstName, lastName: req.body.EmergencyName_lastName}, phone: req.body.EmergencyPhone, relationship: req.body.EmergencyRelationship},
                garage: oldUser.garage,
                group: req.body.group,
                credits: (req.user.memberType === 'admin' && req.body.credits)? req.body.credits : oldUser.credits,
                memberType: (req.user.memberType === 'admin' && req.body.memberType)? req.body.memberType : oldUser.memberType,
                password: oldUser.password,
                _id: req.params.userID,
            })
            await User.findByIdAndUpdate(req.params.userID, user, {});
            return res.status(201).json({id: user.id});
        }
        return res.sendStatus(403)
    })
]

// Deletes a user. Requires JWT with admin.
exports.user_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    

    asyncHandler(async(req,res,next) => {
        // JWT is valid. Verify user is allowed to access this resource and delete the user
        if (req.user.memberType === 'admin'){
            await User.findByIdAndDelete(req.params.userID);
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
    })
]

// Testing use only, route available only in test NODE_env. Creates admin user.
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

    controllerUtils.validateForm,

  
    
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
            return res.status(201).json({id: user.id});
        })
    }),
]