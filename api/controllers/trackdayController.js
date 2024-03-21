const Trackday = require('../models/Trackday');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId;

// TODO: Can we move out validateForm and validateTrackdayID out to index for easier/more concise use? (Since userController also uses it)


// Called by middleware functions
// Validates the form contents and builds errors array. In case of errors, returns 400 with errors array
// TODO: Make return only the message (?)
function validateForm(req,res,next){
    const errors = validationResult(req); // Extract the validation errors from a request.
    if (!errors.isEmpty())  return res.status(400).json(errors.mapped()); //TODO: How should this present errors? Update README, this may be the best decision
    next();
}

// Called by middleware functions
// Verify that the req.params.trackdayID is a valid objectID and that it exists in our DB
async function validateTrackdayID(req, res, next){
    if (!ObjectId.isValid(req.params.trackdayID)) return res.status(404).send({msg: 'trackdayID is not a valid ObjectID'});
    const trackdayExists = await Trackday.exists({_id: req.params.trackdayID});
    if (!trackdayExists) return res.status(404).send({msg: 'Trackday does not exist'});
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

// Returns specific trackday. Requires JWT with admin.
exports.trackday_get = [
    validateTrackdayID,
    (req,res,next) => {
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is admin and return the trackday
            if (authData.memberType === 'admin'){
                const trackday = await Trackday.findById(req.params.trackdayID).exec();
                return res.status(200).json(trackday);
            }
            return res.sendStatus(401)
        }))
    }
]

// Returns all trackdays. Requires JWT with admin.
exports.trackday_getALL = (req,res,next) => {
    jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
        if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
        // JWT is valid. Verify user is admin and return all trackdays
        if (authData.memberType === 'admin'){
            const trackdays = await Trackday.find().exec();
            return res.status(200).json(trackdays);
        }
        return res.sendStatus(401)
    }))
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

// Updates a trackday. Requires JWT with admin.
exports.trackday_put = [

    body("date",  "Date must contain 2-50 characters").trim().isLength({ min: 2, max: 50}).escape(),
    body("guests",  "Guests must be numeric").trim().isNumeric().escape(),
    body("status",  "Status must be one of: [regOpen, regClosed, finished, cancelled]").trim().isIn(["regOpen", "regClosed", "finished", "cancelled"]).escape(),

    validateForm,
    validateTrackdayID,
    (req,res,next) => {
          // Unbundle JWT and check if admin 
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});
            // JWT is valid. Verify user is admin and edit the trackday
            const oldTrackday = await Trackday.findById(req.params.trackdayID).select('members walkons').exec();
            if (authData.memberType === 'admin'){
                // Create trackday
                const trackday = new Trackday({
                    date: req.body.date,
                    members: oldTrackday.members,
                    walkons: oldTrackday.walkons,
                    guests: req.body.guests,
                    status: req.body.status,
                    _id: req.params.trackdayID
                })
                await Trackday.findByIdAndUpdate(req.params.trackdayID, trackday, {});
                return res.status(201).json({_id: trackday.id});
            }
            return res.sendStatus(401)
        }))
    }

    
]

// Deletes a trackday. Requires JWT with admin.
exports.trackday_delete = [
    validateTrackdayID,

    (req,res,next) => {
          // Unbundle JWT and check if admin 
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});
            // JWT is valid. Verify user is admin and delete the trackday
            if (authData.memberType === 'admin'){
                await Trackday.findByIdAndDelete(req.params.trackdayID);
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]