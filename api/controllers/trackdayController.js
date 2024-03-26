const Trackday = require('../models/Trackday');
const User = require('../models/User');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId;
const controllerUtils = require('./controllerUtils')

/*
A note about payments
For now, all payments will be handled manually (credit card & e transfer.)
API will feature support for mark paid & payWithCredit which will auto deduct credit where applicable
*/

/*
    --------------------------------------------- TODO ---------------------------------------------
    code cleanup & review
    --------------------------------------------- TODO ---------------------------------------------
*/



// Registers a user for a trackday. Requires JWT with matching userID OR admin.
// TODO: Send email notif
// TODO: 7-day cutoff restriction
// TODO: Payment handling logic
// TODO: Check registration capacity (25 per group?)
// TODO: Prevent duplicate registration
exports.register = [
    body("paymentMethod",  "PaymentMethod must be one of: [etransfer, credit, creditCard, gate]").trim().isIn(["etransfer", "credit", "creditCard", "gate"]).escape(),

    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.validateForm,
    controllerUtils.verifyJWT,

    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID && 1)){
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
        
    })
]

// Removes a user from a trackday. Requires JWT with matching userID OR admin.
// TODO: Check 7 day restriction + email
exports.unregister = [
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.verifyJWT,
   
    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID && 1)){

            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            // Check that the member we want to remove from the trackday/members array actually exists
            const memberExists = trackday.members.some((member) => member.userID.equals(req.params.userID))
            if (!memberExists) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            trackday.members = trackday.members.filter((member)=> !member.userID.equals(req.params.userID)) 
            await trackday.save();
            return res.sendStatus(200);
        }
        return res.sendStatus(401)
       
    })
]

// Reschedules a user. Requires JWT with matching userID OR admin.
// TODO: Check 7 day restriction + email + capacity
exports.reschedule = [
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.verifyJWT,
   
    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID && 1)){
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
        
    })
]

// Marks a user as checked in. Requires JWT with staff or admin.
// TODO: SENDS EMAIL NOTIFICATION 12 hours later thanking user and requesting a review
exports.checkin = [
    controllerUtils.validateUserID,
    controllerUtils.verifyJWT,
   
    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin' || req.user.memberType === 'staff'){
            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            // Check that the member we want to check in for trackday actually exists
            const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
            if (!memberEntry) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            memberEntry.checkedIn = true;
            await trackday.save();
            return res.sendStatus(200);
        }
        return res.sendStatus(401)
       
    })
]

//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Returns specific trackday. Requires JWT with admin.
exports.trackday_get = [
    controllerUtils.validateTrackdayID,
    controllerUtils.verifyJWT,
    asyncHandler(async(req,res,next) => {

            if (req.user.memberType === 'admin'){
                const trackday = await Trackday.findById(req.params.trackdayID).exec();
                return res.status(200).json(trackday);
            }
            return res.sendStatus(401)
        
    })
]

// Returns all trackdays. Requires JWT with admin.
exports.trackday_getALL = [
    controllerUtils.verifyJWT,
    asyncHandler(async(req,res,next)=> {
        if (req.user.memberType === 'admin'){
            const trackdays = await Trackday.find().exec();
            return res.status(200).json(trackdays);
        }
        return res.sendStatus(401)
    })
]

// Creates a trackday. Requires JWT with admin.
// TODO: Revise validator to ensure data is received in correct format
exports.trackday_post = [
    body("date",  "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().isLength({ min: 17, max: 17}).escape(),
    
    controllerUtils.validateForm,
    controllerUtils.verifyJWT,

    asyncHandler(async (req,res,next) => {
        if (req.user.memberType === 'admin'){
            // Check if a trackday already exists with same date and time details
            const duplicateTrackday = await Trackday.find({date: {$eq: req.body.date}})
            if (duplicateTrackday.length) return res.status(409).send({msg: 'Trackday with this date and time already exists'});
            // Create trackday
            const trackday = new Trackday({
                date: req.body.date,
                members: [],
                walkons: [],
                guests: 0,
                status: "regOpen"
            })
            await trackday.save();
            return res.status(201).json({id: trackday.id});
        }
        return res.sendStatus(401)
    
    })

    
]


/*
const duplicateUser = await User.findOne({'contact.email': {$eq: req.body.email}})
if (duplicateUser && oldUser.contact.email !== req.body.email) return res.status(409).send({msg: 'User with this email already exists'});
*/

// Updates a trackday. Requires JWT with admin.
// TODO: Update to use save()
exports.trackday_put = [

    body("date",  "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().isLength({ min: 17, max: 17}).escape(),
    body("guests",  "Guests must be numeric").trim().isNumeric().escape(),
    body("status",  "Status must be one of: [regOpen, regClosed, finished, cancelled]").trim().isIn(["regOpen", "regClosed", "finished", "cancelled"]).escape(),

    controllerUtils.validateForm,
    controllerUtils.validateTrackdayID,
    controllerUtils.verifyJWT,

    asyncHandler(async(req,res,next) => {
 
        if (req.user.memberType === 'admin'){
            const oldTrackday = await Trackday.findById(req.params.trackdayID).select('date members walkons').exec();

            // Check for duplicates
            const duplicateTrackday = await Trackday.findOne({date: {$eq: req.body.date}})
            const requestedUpdateDate = new Date(req.body.date).toISOString()
            if (duplicateTrackday && requestedUpdateDate !== oldTrackday.date.toISOString()) return res.status(409).send({msg: 'Trackday with this date and time already exists'});

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
       
    })
]

// Deletes a trackday. Requires JWT with admin.
exports.trackday_delete = [
    controllerUtils.validateTrackdayID,
    controllerUtils.verifyJWT,

    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin'){
            await Trackday.findByIdAndDelete(req.params.trackdayID);
            return res.sendStatus(200);
        }
        return res.sendStatus(401)
       
    })
]