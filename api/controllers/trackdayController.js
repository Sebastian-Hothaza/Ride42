const Trackday = require('../models/Trackday');
const User = require('../models/User');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const controllerUtils = require('./controllerUtils')
const mailer = require('../mailer')

/*
A note about payments
For now, all payments will be handled manually (credit card & e transfer.)
API will feature support for mark paid & payWithCredit which will auto deduct credit where applicable
*/

/*
    --------------------------------------------- TODO ---------------------------------------------
    email notifs (check in should have 12hr delay prompting user review)
    Payment handling logic - include tests (think about how to handle payments)
    code cleanup & review
    --------------------------------------------- TODO ---------------------------------------------
*/


/*
    --------------------------------------- FOR LATER REVIEW ---------------------------------------
    awaits can be bundled 
    figure out if .exec is needed
    use mongoose populate property to make this more efficient instead of double query? Other opportunities for this too. 
    review trackday schema and how the ref is defined in members array
    optimization, ie. validateUserID fetches user from DB, avoid double fetching later in the processing
    look into migrading updates to use save - codebase wide
    --------------------------------------- FOR LATER REVIEW ---------------------------------------
*/

// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g}
// JS does not support function overloading, hence the 'INTERNAL' marking
function getRegNumbers_INTERNAL(trackday){
    let green=0, yellow=0, red=0
    const guests=trackday.guests;

    // Check the members array first
    for (let i=0; i<trackday.members.length; i++){
        // Increment group summary
        switch(trackday.members[i].userID.group){
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
exports.register = [
    body("paymentMethod",  "PaymentMethod must be one of: [etransfer, credit, creditCard, gate]").trim().isIn(["etransfer", "credit", "creditCard", "gate"]).escape(),
    body("guests",  "Guests must be numeric").trim().isNumeric().escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    

    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID)){
            let [trackday, user] = await Promise.all([Trackday.findById(req.params.trackdayID).populate('members.userID').exec(), User.findById(req.params.userID)]);
           
            // Deny if user is already registered to trackday
            const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
            if (memberEntry) return res.sendStatus(409)

            // Deny if user attempt to register for trackday < lockout period(7 default) away, deny registration
            if (req.body.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID)){
                return res.status(401).send({msg: 'Cannot register for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot register for trackday in the past'})

            // Deny if trackday is full
            if (req.user.memberType !== 'admin'){
                if ( (user.group == 'green' && getRegNumbers_INTERNAL(trackday).green === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'yellow' && getRegNumbers_INTERNAL(trackday).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'red' && getRegNumbers_INTERNAL(trackday).red === parseInt(process.env.GROUP_CAPACITY)) ){
                    return res.status(401).send({msg: 'trackday has reached capacity'})
                } 
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.status !== 'regOpen') return res.status(401).send({msg: 'registration closed'})

            // Deny is user garage is empty
            if (req.user.memberType !== 'admin' && !user.garage.length) return res.status(401).send({msg: 'cannot register with empty user garage'})

            // Add user to trackday
            trackday.members.push({
                userID: req.params.userID,
                paymentMethod: req.body.paymentMethod,
                paid: false,
                checkedIn: []
            })

            // Update guests for trackday
            trackday.guests += req.body.guests

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

            // Check if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot un-register for trackday in the past'})

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
            let [trackdayOLD,trackdayNEW,user] = await Promise.all([Trackday.findById(req.params.trackdayID_OLD).exec(),
                                                                    Trackday.findById(req.params.trackdayID_NEW).populate('members.userID').exec(),
                                                                    User.findById(req.params.userID)])

            
            // Check that the member we want to reschedule is registered in old trackday
            const memberEntryOLD = trackdayOLD.members.find((member) => member.userID.equals(req.params.userID));
            if (!memberEntryOLD) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            // Check if user is already registered for trackday they want to reschedule to
            const memberEntryNEW = trackdayNEW.members.find((member) => member.userID.equals(req.params.userID));
            if (memberEntryNEW) return res.status(409).send({msg: 'Member is already scheduled for trackday you want to reschedule to'})

            // If user attempt to reschdule for trackday < lockout period(7 default) away, deny reschedule
            if (memberEntryOLD.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID_NEW)){
                return res.status(401).send({msg: 'Cannot reschedule to a trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Check if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot register for trackday in the past'})

            // Check if trackday is full
            if (req.user.memberType !== 'admin'){
                if ( (user.group == 'green' && getRegNumbers_INTERNAL(trackdayNEW).green === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'yellow' && getRegNumbers_INTERNAL(trackdayNEW).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'red' && getRegNumbers_INTERNAL(trackdayNEW).red === parseInt(process.env.GROUP_CAPACITY)) ){
                    return res.status(401).send({msg: 'trackday has reached capacity'})
                } 
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.status !== 'regOpen') return res.status(401).send({msg: 'registration closed'})

            // Add user to new trackday
            trackdayNEW.members.push({
                userID: memberEntryOLD.userID,
                paymentMethod: memberEntryOLD.paymentMethod,
                paid: memberEntryOLD.paid,
                checkedIn: memberEntryOLD.checkedIn
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
exports.checkin = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.validateBikeID,
    
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin' || req.user.memberType === 'staff'){
            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            // Check that the member we want to check in for trackday actually exists
            const memberEntry = trackday.members.find((member) => member.userID.equals(req.params.userID));
            if (!memberEntry) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            // Check that member is not already checked in
            if(memberEntry.checkedIn.length) res.status(400).json({msg : 'member already checked in'})

            memberEntry.checkedIn.push(req.params.bikeID);
            await trackday.save();
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
       
    })
]

// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g} PUBLIC.
// NOTE: This is not tested since we test getRegNumbers_INTERNAL directly
exports.getRegNumbers = [
    controllerUtils.validateTrackdayID,

    asyncHandler(async(req,res,next) => {
        const trackday = await Trackday.findById(req.params.trackdayID)
        return res.send(getRegNumbers_INTERNAL(trackday))
    })
]

// Returns an array of trackday dates in format [{id: x, date: y, status: z}] PUBLIC.
exports.presentTrackdays = async(req,res,next) => {
    const allDays = await Trackday.find()
    let result = []
    allDays.forEach((trackday)=>result.push({id: trackday.id, date: trackday.date, status: trackday.status}))
    
    return res.status(200).send(result)
}


//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Returns specific trackday. Requires JWT with admin.
exports.trackday_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,
    
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin'){
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.userID').exec();
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
            const trackdays = await Trackday.find().populate('members.userID').exec();
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
            return res.status(201).json({id: trackday.id});
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