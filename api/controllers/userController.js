const User = require('../models/User');
// const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Called by middleware functions
// Validates the form contents and builds errors array. In case of errors, returns 400 with errors array
// TODO: Make return only the message
function validateForm(req,res,next){
    const errors = validationResult(req); // Extract the validation errors from a request.
    if (!errors.isEmpty())  return res.status(400).json(errors.mapped()); //TODO: How should this present errors? Update README, this may be the best decision
    next();
}


exports.login = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: login for _id: '+req.params.userID)
}

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
exports.user_get = (req,res,next) => {
    // Logged in user
    res.send('NOT YET IMPLEMENTED: user_get for _id: '+req.params.userID)
}

exports.user_getALL = (req,res,next) => {
    // Admin onlt
    res.send('NOT YET IMPLEMENTED: user_getALL')
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

    // Create the user and insert into the DB
    async(req, res, next)=>{
        const user = new User({
            name: {firstName: req.body.name_firstName, lastName: req.body.name_lastName},
            contact: {email: req.body.email, phone:req.body.phone, address: req.body.address, city: req.body.city, province: req.body.province},
            emergencyContact: { name: {firstName: req.body.EmergencyName_firstName, lastName: req.body.EmergencyName_lastName}, phone: req.body.EmergencyPhone, relationship: req.body.EmergencyRelationship},
            group: req.body.group,
            credits: 0,
            type: 'regular',
            password: '12345678'
        })
        await user.save();
        return res.status(201).json({_id: user.id});
    },

]

exports.user_put = (req,res,next) => {
    // Logged in user
    res.send('NOT YET IMPLEMENTED: user_put for _id: '+req.params.userID)
}

exports.user_delete = (req,res,next) => {
    // Admin only
    res.send('NOT YET IMPLEMENTED: user_delete for _id: '+req.params.userID)
}




