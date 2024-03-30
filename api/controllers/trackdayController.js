const Trackday = require('../models/Trackday');
const User = require('../models/User');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const controllerUtils = require('./controllerUtils')
const sendEmail = require('../mailer')
const mailTemplates = require('../mailer_templates')

/*
A note about payments
For now, all payments will be handled manually (credit card & e transfer.)
API will feature support for mark paid & payWithCredit which will auto deduct credit where applicable
*/

/*
    --------------------------------------------- TODO ---------------------------------------------
    add walkonRegister feature and testing
    edit register to allow registering gate person (accessible by staff and admin only) - testing for these new features
    double check email sending for unregister (Ie. dont send admin email if paymentMethod was credit)
    double check email sending
    code cleanup & review
    run through work flow
    --------------------------------------------- TODO ---------------------------------------------
*/


/*
    --------------------------------------- FOR LATER REVIEW ---------------------------------------
    awaits can be bundled into Promise.all([])
    figure out if .exec is needed on queries
    use mongoose populate property to make this more efficient instead of double query? Other opportunities for this too. 
    review trackday schema and how the ref is defined in members array
    optimization, ie. validateUserID fetches user from DB, avoid double fetching later in the processing
    look into migrating updates to use save - codebase wide
    send email 12h after user check in requesting a review
    email signature image WITHOUT showing up as attachment - possible?
    review validation chain setup
    case insensitivity for garage (Ie. 2009 Yamaha R6 and 2009 YAMAHA r6 should be same entry in bikes DB)
    --------------------------------------- FOR LATER REVIEW ---------------------------------------
*/

// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g}
// JS does not support function overloading, hence the 'INTERNAL' marking
function getRegNumbers(trackday){
    let green=0, yellow=0, red=0, guests=0


    // Check the members array
    for (let i=0; i<trackday.members.length; i++){
        // Increment group summary
        switch(trackday.members[i].user.group){
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
        guests += trackday.members[i].guests
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
          
            let [trackday, user] = await Promise.all([Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').exec(), User.findById(req.params.userID)]);
            
            // Deny if user is already registered to trackday
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            if (memberEntry) return res.status(409).send({msg: "user already registered for this trackday"})

            // Deny if user attempt to register for trackday < lockout period(7 default) away, deny registration
            if (req.body.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID)){
                return res.status(401).send({msg: 'Cannot register for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot register for trackday in the past'})

            // Deny if trackday is full
            if (req.user.memberType !== 'admin'){
                if ( (user.group == 'green' && getRegNumbers(trackday).green === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'yellow' && getRegNumbers(trackday).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'red' && getRegNumbers(trackday).red === parseInt(process.env.GROUP_CAPACITY)) ){
                    return res.status(401).send({msg: 'trackday has reached capacity'})
                } 
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.status !== 'regOpen') return res.status(401).send({msg: 'registration closed'})

            // Deny is user garage is empty
            if (req.user.memberType !== 'admin' && !user.garage.length) return res.status(401).send({msg: 'cannot register with empty user garage'})

            // Add user to trackday
            trackday.members.push({
                user: req.params.userID,
                paymentMethod: req.body.paymentMethod,
                paid: false,
                guests: req.body.guests,
                checkedIn: []
            })

           

            await trackday.save();
            await sendEmail(user.contact.email, "Ride42 Trackday Registration Confirmation", mailTemplates.registerTrackday,
                            {name: user.name.firstName, date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric'})})
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
            let [trackday, user] = await Promise.all([Trackday.findById(req.params.trackdayID).populate('members.user','-password -refreshToken -__v').exec(), User.findById(req.params.userID)]);

            // Check user is actually registered for that trackday
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            if (!memberEntry) return res.status(400).send({msg: 'Cannot unregister; member is not registered for that trackday'});


            // If user attempt to unregister for trackday < lockout period(7 default) away, deny unregistration
            if (memberEntry.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID)){
                return res.status(401).send({msg: 'Cannot unregister for trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Check if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackday.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot un-register for trackday in the past'})

            // Remove user from trackday
            trackday.members = trackday.members.filter((member)=> !member.user.equals(req.params.userID)) 

        
            await trackday.save();
            // Send email to user
            await sendEmail(user.contact.email, "Ride42 Trackday Cancellation Confirmation", mailTemplates.unregisterTrackday,
                            {name: user.name.firstName, date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric'})})
            // Notify admin only if payment wasn't made with credit (credit is auto refunded)
            if (memberEntry.paymentMethod !== 'credit'){
                await sendEmail(process.env.ADMIN_EMAIL, "TRACKDAY CANCELATION", mailTemplates.unregisterTrackday_admin,
                            {name: user.name.firstName, date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric'})})
            }
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
                                                                    Trackday.findById(req.params.trackdayID_NEW).populate('members.user','-password -refreshToken -__v').exec(),
                                                                    User.findById(req.params.userID)])

            
            // Check that the member we want to reschedule is registered in old trackday
            const memberEntryOLD = trackdayOLD.members.find((member) => member.user.equals(req.params.userID));
            if (!memberEntryOLD) return res.status(404).send({msg: 'Member is not registered for that trackday'});

            // Check if user is already registered for trackday they want to reschedule to
            const memberEntryNEW = trackdayNEW.members.find((member) => member.user.equals(req.params.userID));
            if (memberEntryNEW) return res.status(409).send({msg: 'Member is already scheduled for trackday you want to reschedule to'})

            // If user attempt to reschdule for trackday < lockout period(7 default) away, deny reschedule
            if (memberEntryOLD.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID_NEW)){
                return res.status(401).send({msg: 'Cannot reschedule to a trackday <'+process.env.DAYS_LOCKOUT+' days away.'})
            }

            // Check if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.date.getTime() - Date.now() < 0 ) return res.status(400).send({msg: 'Cannot register for trackday in the past'})

            // Check if trackday is full
            if (req.user.memberType !== 'admin'){
                if ( (user.group == 'green' && getRegNumbers(trackdayNEW).green === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'yellow' && getRegNumbers(trackdayNEW).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                     (user.group == 'red' && getRegNumbers(trackdayNEW).red === parseInt(process.env.GROUP_CAPACITY)) ){
                    return res.status(401).send({msg: 'trackday has reached capacity'})
                } 
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.status !== 'regOpen') return res.status(401).send({msg: 'registration closed'})

            // Add user to new trackday
            trackdayNEW.members.push({
                user: memberEntryOLD.user,
                paymentMethod: memberEntryOLD.paymentMethod,
                paid: memberEntryOLD.paid,
                guests: memberEntryOLD.guests,
                checkedIn: memberEntryOLD.checkedIn
            })
            await trackdayNEW.save();

            // Remove the user from the OLD trackday
            trackdayOLD.members = trackdayOLD.members.filter((member)=> !member.user.equals(req.params.userID)) 
            await trackdayOLD.save();

            await sendEmail(user.contact.email, "Ride42 Trackday Reschedule Confirmation", mailTemplates.rescheduleTrackday,
                            {name: user.name.firstName, dateOLD: trackdayOLD.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric'}), dateNEW: trackdayNEW.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric'})})
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
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
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

// Returns an array of trackday dates in format [{id: x, date: x, status: x, green: x, yellow: x, red: x, guests: x, groupCapacity: x}] PUBLIC.
exports.presentTrackdays = async(req,res,next) => {
    const allDays = await Trackday.find().populate('members.user','-password -refreshToken -__v')
    let result = []
    allDays.forEach((trackday)=>{

        result.push({
            id: trackday.id,
            date: trackday.date,
            status: trackday.status,
            green: getRegNumbers(trackday).green,
            yellow: getRegNumbers(trackday).yellow,
            red: getRegNumbers(trackday).red,
            guests: getRegNumbers(trackday).guests,
            groupCapacity: process.env.GROUP_CAPACITY
        })
    })
    
    return res.status(200).send(result)
}

// Returns an array of trackday dates that user is registered for in format [{id: x, date: x, status: x, green: x, yellow: x, red: x, guests: x, groupCapacity: x, paid: x}] PUBLIC.
exports.presentTrackdaysForUser = [
    controllerUtils.validateUserID,

    asyncHandler(async(req,res,next) => {
        // Get all trackdays that user is a part of
        const allDays = await Trackday.find({members: {$elemMatch: { user: {$eq: req.params.userID}}}} ).populate('members.user','-password -refreshToken -__v').exec(); 
        let result = []
        
        allDays.forEach((trackday)=>{
            result.push({
                id: trackday.id,
                date: trackday.date,
                status: trackday.status,
                green: getRegNumbers(trackday).green,
                yellow: getRegNumbers(trackday).yellow,
                red: getRegNumbers(trackday).red,
                guests: getRegNumbers(trackday).guests,
                groupCapacity: process.env.GROUP_CAPACITY,
                // trackday members array currently has ALL members for that particular trackday. Fetch specific member entry so we can check payment status
                paid: trackday.members.find((member) => member.user.equals(req.params.userID)).paid
            })
        })
        return res.status(200).send(result)
    })
]

// Updates paid status of member for a trackday. Requires JWT with admin.
exports.updatePaid = [
    body('setPaid', 'setPaid must be either true or false').trim().isBoolean().escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,

    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin'){
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').exec();                                        
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));

            // Check that user we want to mark as paid is actually registerd for the trackday
            if (!memberEntry) return res.status(404).send({msg: 'Member is not registered for that trackday'});


            // Prevent setting paid status to what it was already set to
            if (memberEntry.paid && req.body.setPaid) return res.status(400).send({msg: "user already marked as paid"})
            if (!memberEntry.paid && !req.body.setPaid) return res.status(400).send({msg: "user already marked as unpaid"})

            // Update paid status
            memberEntry.paid = memberEntry.paid? false:true
            await trackday.save()
            return res.sendStatus(200)
        }
        return res.sendStatus(403)
    })
]

//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Returns specific trackday. Requires JWT with admin.
exports.trackday_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,
    
    asyncHandler(async(req,res,next) => {
        if (req.user.memberType === 'admin'){
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').select('-__v').exec();
            return res.status(200).send({...trackday._doc, guests: getRegNumbers(trackday).guests});
        }
        return res.sendStatus(403)
    })
]

// Returns all trackdays. Requires JWT with admin.
exports.trackday_getALL = [
    controllerUtils.verifyJWT,
    asyncHandler(async(req,res,next)=> {
        if (req.user.memberType === 'admin'){
            const trackdays = await Trackday.find().populate('members.user', '-password -refreshToken -__v').select('-__v').exec();
            trackdays.forEach((trackday)=>trackday._doc = {...trackday._doc, guests: getRegNumbers(trackday).guests})
            return res.status(200).json(trackdays);
        }
        return res.sendStatus(403)
    })
]

// Creates a trackday. Requires JWT with admin.
exports.trackday_post = [
    body("date",  "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().bail().isLength({ min: 17, max: 17}).escape(),
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
                status: "regOpen"
            })
            await trackday.save();
            return res.status(201).json({id: trackday.id});
        }
        return res.sendStatus(403)
    })
]

// Updates a trackday EXCLUDING members and walkons. Requires JWT with admin.
/*
    /// PERMISSIONS ///
    USER: contact, emergencyContact, group(7 day requirement; else fail entire request)
    ADMIN: name, credits, member type
*/
exports.trackday_put = [

    body("date",  "Date must be in YYYY-MM-DDThh:mm form where time is in UTC").isISO8601().bail().isLength({ min: 17, max: 17}).escape(),
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