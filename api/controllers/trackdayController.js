const Trackday = require('../models/Trackday');
const User = require('../models/User');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId;

/*
A note about payments
For now, all payments will be handled manually (credit card & e transfer.)
API will feature support for mark paid & payWithCredit which will auto deduct credit where applicable
*/


// TODO: Can we move out validateForm and validateTrackdayID out to index for easier/more concise use? (Since userController also uses it)
// TODO: Add method to mark user as paid
// TODO: Add method to add walkons

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

// Called by middleware functions
// Verify that the req.params.userID is a valid objectID and that it exists in our DB
async function validateUserID(req, res, next){
    if (!ObjectId.isValid(req.params.userID)) return res.status(404).send({msg: 'userID is not a valid ObjectID'});
    const userExists = await User.exists({_id: req.params.userID});
    if (!userExists) return res.status(404).send({msg: 'User does not exist'});
    next();
}


// Registers a user for a trackday. Requires JWT with matching userID OR admin.
// TODO: Send email notif
// TODO: 7-day cutoff restriction
// TODO: Payment handling logic
// TODO: Check registration capacity (25 per group?)
exports.register = [
    body("paymentMethod",  "PaymentMethod must be one of: [etransfer, credit, creditCard, gate]").trim().isIn(["etransfer", "credit", "creditCard", "gate"]).escape(),

    validateUserID,
    validateTrackdayID,
    validateForm,
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to register for a trackday
            if (authData.memberType === 'admin' || (authData.id === req.params.userID && 1)){
                // Add user to trackday
                const trackday = await Trackday.findById(req.params.trackdayID).exec();
                trackday.members.push({
                    userID: req.params.userID,
                    paymentMethod: req.body.paymentMethod,
                    paid: false,
                    checkedIn: false
                })
                await trackday.save();
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]

// Removes a user from a trackday. Requires JWT with matching userID OR admin.
// TODO: Check 7 day restriction + email
exports.unregister = [
    validateUserID,
    validateTrackdayID,
   
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to register for a trackday
            if (authData.memberType === 'admin' || (authData.id === req.params.userID && 1)){

                const trackday = await Trackday.findById(req.params.trackdayID).exec();

                // Check that the member we want to remove from the trackday/members array actually exists
                const memberExists = trackday.members.some((member) => member.userID.equals(req.params.userID))
                if (!memberExists) return res.status(404).send({msg: 'Member is not registered for that trackday'});

                trackday.members = trackday.members.filter((member)=> !member.userID.equals(req.params.userID)) 
                await trackday.save();
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]

// Reschedules a user. Requires JWT with matching userID OR admin.
// TODO: Check 7 day restriction + email + capacity
exports.reschedule = [
    validateUserID,
    validateTrackdayID,
   
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to register for a trackday
            if (authData.memberType === 'admin' || (authData.id === req.params.userID && 1)){
                const trackdayOLD = await Trackday.findById(req.params.trackdayID_OLD).exec();
                const trackdayNEW = await Trackday.findById(req.params.trackdayID_NEW).exec();
                
                // Check that the member we want to reschedule is registered in old trackday
                const memberEntry = trackdayOLD.members.find((member) => member.userID.equals(req.params.userID));
                if (!memberEntry) return res.status(404).send({msg: 'Member is not registered for that trackday'});


                // Add user to new trackday
                trackdayNEW.members.push({
                    userID: memberEntry.userID,
                    paymentMethod: memberEntry.paymentMethod,
                    paid: memberEntry.paid,
                    checkedIn: memberEntry.checkedIn
                })
                await trackdayNEW.save();

                // Remove the user from the OLD trackday
                trackdayOLD.members = trackdayOLD.members.filter((member)=> !member.userID.equals(req.params.userID)) 
                await trackdayOLD.save();

                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]

// Marks a user as checked in. Requires JWT with staff or admin.
// TODO: SENDS EMAIL NOTIFICATION 12 hours later thanking user and requesting a review
exports.checkin = [
    validateUserID,
   
    (req,res,next) => {
        // Unbundle JWT and check if admin OR matching userID
        jwt.verify(req.cookies.JWT_TOKEN, process.env.JWT_CODE, asyncHandler(async (err, authData) => {
            if (err) return res.status(401).send({msg: 'JWT Validation Fail'});;
            // JWT is valid. Verify user is allowed to register for a trackday
            if (authData.memberType === 'admin' || authData.memberType === 'staff'){
                const trackday = await Trackday.findById(req.params.trackdayID).exec();

                // Check that the member we want to check in for trackday actually exists
                const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
                if (!memberEntry) return res.status(404).send({msg: 'Member is not registered for that trackday'});

                memberEntry.checkedIn = true;
                await trackday.save();
                return res.sendStatus(200);
            }
            return res.sendStatus(401)
        }))
    }
]

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