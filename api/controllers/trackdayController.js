const Trackday = require('../models/Trackday');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')


// Called by middleware functions
// Validates the form contents and builds errors array. In case of errors, returns 400 with errors array
// TODO: Make return only the message (?)
function validateForm(req,res,next){
    const errors = validationResult(req); // Extract the validation errors from a request.
    if (!errors.isEmpty())  return res.status(400).json(errors.mapped()); //TODO: How should this present errors? Update README, this may be the best decision
    next();
}


exports.register = (req,res,next) => {
    // Logged in user
    // SENDS EMAIL NOTIFICATION
    res.send('NOT YET IMPLEMENTED: register for user_id: '+req.params.userID+' at trackday: '+req.params.trackdayID)
}

exports.unregister = (req,res,next) => {
    // Logged in user
    // SENDS EMAIL NOTIFICATION
    res.send('NOT YET IMPLEMENTED: unregister for user_id: '+req.params.userID+' at trackday: '+req.params.trackdayID)
}

exports.reschedule = (req,res,next) => {
    // Logged in user
    // SENDS EMAIL NOTIFICATION
    res.send('NOT YET IMPLEMENTED: rechedule for user_id: '+req.params.userID)
}

exports.checkin = (req,res,next) => {
    // Staff only
    // SENDS EMAIL NOTIFICATION 12 hours later thanking user and requesting a review
    res.send('NOT YET IMPLEMENTED: checkin for user_id: '+req.params.userID+' at trackday: '+req.params.trackdayID)
}

//////////////////////////////////////
//              CRUD
//////////////////////////////////////
exports.trackday_get = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_get for _id: '+req.params.trackdayID)
}

exports.trackday_getALL = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_getALL')
}

// Creates a trackday. Requires JWT with admin.
exports.trackday_post = [

    body("date",  "Date must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),

    validateForm,
    (req,res,next) => {
          // Unbundle JWT and check if admin 
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is admin and create the trackday
            if (authData.memberType === 'admin'){
                // Create trackday
                const trackday = new Trackday({
                    date: req.body.date,
                    members: [],
                    walkons: [],
                    guests: 0,
                    status: "regOpen"
                })
                await trackday.save();
                return res.status(201).json({_id: trackday.id});
            }
            return res.sendStatus(401)
        }))
    }

    
]

exports.trackday_put = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_put for _id: '+req.params.trackdayID)
}

exports.trackday_delete = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_delete for _id: '+req.params.trackdayID)
}