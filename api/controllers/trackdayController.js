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
    move jwt.verify to top on ALL functions?
    email notifs (check in should have 12hr delay prompting user review)
    figure out if .exec is needed
    add guests field for trackday registration
    editing guests & status field in trackday update
    --------------------------------------------- TODO ---------------------------------------------
*/

// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g}
// JS does not support function overloading, hence the 'INTERNAL' marking
async function getRegNumbers_INTERNAL(trackdayID){
    
    const trackday = await Trackday.findById(trackdayID).exec();
    let green=0, yellow=0, red=0
    const guests=trackday.guests;


    // Check the members array first
    for (let i=0; i<trackday.members.length; i++){
        const user = await User.findById(trackday.members[i].userID)
        // Increment group summary
        switch(user.group){
            case 'green':
                green++
                break;
            case 'yellow':
                yellow++
                break;
            case 'red':
                red++
                break;
        }
    }

    // Check the walkons
    for (let i=0; i<trackday.walkons.length; i++){
        // Increment group summary
        switch(trackday.walkons[i].group){
            case 'green':
                green++
                break;
            case 'yellow':
                yellow++
                break;
            case 'red':
                red++
                break;
        }
    }

    return {green, yellow, red, guests}
}

// Registers a user for a trackday. Requires JWT with matching userID OR admin.
// TODO: Payment handling logic - include tests (think about how to handle payments)
exports.register = [
    body("paymentMethod",  "PaymentMethod must be one of: [etransfer, credit, creditCard, gate]").trim().isIn(["etransfer", "credit", "creditCard", "gate"]).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    

    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID)){
            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            // Check if user is already registered to trackday
            const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
            if (memberEntry) return res.sendStatus(409)

            // If user attempt to register for trackday < lockout period(7 default) away, deny registration
            if (req.body.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID)){
                return res.status(401).send({msg: 'Cannot register for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Check if trackday is full
            if (req.user.memberType !== 'admin'){
                const curRegistrationNums = await getRegNumbers_INTERNAL(req.params.trackdayID)
                const user = await User.findById(req.params.userID)
                if ( (user.group == 'green' && curRegistrationNums.green === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'yellow' && curRegistrationNums.yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'red' && curRegistrationNums.red === parseInt(process.env.GROUP_CAPACITY)) ){
                    return res.status(401).send({msg: 'trackday has reached capacity'})
                } 
            }


            // Add user to trackday
            trackday.members.push({
                userID: req.params.userID,
                paymentMethod: req.body.paymentMethod,
                paid: false,
                checkedIn: false
            })
            await trackday.save();
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
        
    })
]

// Removes a user from a trackday. Requires JWT with matching userID OR admin.
exports.unregister = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    
   
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID)){
            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            // Check user is actually registered for that trackday
            const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
            if (!memberEntry) return res.status(400).send({msg: 'Cannot unregister; member is not registered for that trackday'});


            // If user attempt to unregister for trackday < lockout period(7 default) away, deny unregistration
            if (memberEntry.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID)){
                return res.status(401).send({msg: 'Cannot unregister for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }


            // Check that the member we want to remove from the trackday/members array actually exists
            const memberExists = trackday.members.some((member) => member.userID.equals(req.params.userID))
            if (!memberExists) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            trackday.members = trackday.members.filter((member)=> !member.userID.equals(req.params.userID)) 
            await trackday.save();
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
       
    })
]

// Reschedules a user. Requires JWT with matching userID OR admin.
exports.reschedule = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    
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
        return res.sendStatus(403)
        
    })
]

// Marks a user as checked in. Requires JWT with staff or admin.
// TODO: SENDS EMAIL NOTIFICATION 12 hours later thanking user and requesting a review
exports.checkin = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    
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
        return res.sendStatus(403)
       
    })
]

// TODO: Add this to the readme
// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g} PUBLIC.
// NOTE: This is not tested since we test getRegNumbers_INTERNAL directly
exports.getRegNumbers = asyncHandler(async(req,res,next) => {
    return res.send(await getRegNumbers_INTERNAL(req.params.trackdayID))
})



//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Returns specific trackday. Requires JWT with admin.
exports.trackday_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,
    
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin'){
            const trackday = await Trackday.findById(req.params.trackdayID).exec();
            return res.status(200).json(trackday);
        }
        return res.sendStatus(403)
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
        return res.sendStatus(403)
    })
]

// Creates a trackday. Requires JWT with admin.
// TODO: Revise validator to ensure data is received in correct format
exports.trackday_post = [
    body("date",  "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().isLength({ min: 17, max: 17}).escape(),
    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    
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
        return res.sendStatus(403)
    })
]

// Updates a trackday. Requires JWT with admin.
// TODO: Update to use save()
exports.trackday_put = [

    body("date",  "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().isLength({ min: 17, max: 17}).escape(),
    body("guests",  "Guests must be numeric").trim().isNumeric().escape(),
    body("status",  "Status must be one of: [regOpen, regClosed, finished, cancelled]").trim().isIn(["regOpen", "regClosed", "finished", "cancelled"]).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateTrackdayID,

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
        return res.sendStatus(403)
    })
]

// Deletes a trackday. Requires JWT with admin.
exports.trackday_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,
    

    asyncHandler(async(req,res,next) => {

        if (req.user.memberType === 'admin'){
            await Trackday.findByIdAndDelete(req.params.trackdayID);
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
       
    })
]