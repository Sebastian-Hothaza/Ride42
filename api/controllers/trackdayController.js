const Trackday = require('../models/Trackday');
const User = require('../models/User');
const QR = require('../models/QR');
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const controllerUtils = require('./controllerUtils')
const sendEmail = require('../mailer')
const mailTemplates = require('../mailer_templates')
const logger = require('../logger');

/*
PAYMENT NOTE
credit card & e-transfer handled manually
credit handled automatically
gate always marked as paid
*/

/*
    --------------------------------------------- TODO ---------------------------------------------
    dont allow negative gueses
    code cleanup & review - use methods where possible 
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
    email signature image WITHOUT showing up as attachment - possible? Base64 encoded?
    review validation chain setup
    optimize tests
    --------------------------------------- FOR LATER REVIEW ---------------------------------------
*/

// Returns a summary of number of people at a specified trackday in format {green: x, yellow: y, red: z, guests: g, votes: {techincal: 7, alien: 5, ...}}
function getRegDetails(trackday) {
    let green = 0, yellow = 0, red = 0, guests = 0

    let votes = {
        technical: 0,
        Rtechnical: 0,
        alien: 0,
        Ralien: 0,
        modified: 0,
        Rmodified: 0,
        long: 0
    }

    // Check the members array
    for (let i = 0; i < trackday.members.length; i++) {
        // Increment group summary
        switch (trackday.members[i].user.group) {
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

        // Updates votes
        trackday.members[i].layoutVote.forEach((vote) => {
            if (vote !== 'none') votes[vote]++;
        })

        // Check guests
        guests += trackday.members[i].guests
    }
    // Check the walkons
    for (let i = 0; i < trackday.walkons.length; i++) {
        // Increment group summary
        switch (trackday.walkons[i].group) {
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
    return { green, yellow, red, guests, votes }
}

// Registers a user for a trackday. Requires JWT with matching userID OR admin. Staff permitted for gate registrations.
// ! Logged operation !
exports.register = [
    body("paymentMethod", "PaymentMethod must be one of: [etransfer, credit, creditCard, gate]").trim().isIn(["etransfer", "credit", "creditCard", "gate"]).escape(),
    body("layoutVote", "Layout vote must be provided and each value must be one of: [none, technical, Rtechnical, alien, Ralien, modified, Rmodified, long]").trim().isIn(["none", "technical", "Rtechnical", "alien", "Ralien", "modified", "Rmodified", "long"]).escape(),
    body("guests", "Guests must be numeric and greater than 0").trim().isNumeric({ min: 0 }).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,


    asyncHandler(async (req, res, next) => {

        if (req.user.memberType === 'staff' || req.user.memberType === 'admin' || (req.user.id === req.params.userID)) {
            let [trackday, user] = await Promise.all([Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').exec(), User.findById(req.params.userID)]);

            // Deny gate registrations unless they come from staff or admin
            if (req.body.paymentMethod === 'gate' && req.user.memberType !== 'admin' && req.user.memberType !== 'staff') {
                return res.status(403).send({ msg: ['Only staff or admins can process gate registrations'] })
            }

            // Deny if user is already registered to trackday
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            if (memberEntry) return res.status(409).send({ msg: ['Already registered for this trackday'] })

            // Deny if user attempt to register for trackday < lockout period(7 default) away
            if (await controllerUtils.isInLockoutPeriod(req.params.trackdayID) &&
                req.body.paymentMethod !== 'credit' && req.body.paymentMethod !== 'gate' && req.user.memberType !== 'admin') {
                return res.status(403).send({ msg: ['Cannot register for trackday <' + process.env.DAYS_LOCKOUT + ' days away unless payment method is trackday credit.'] })
            }


            // If trackday is in the past
            if (req.user.memberType !== 'admin' && trackday.date.getTime() < Date.now()) {
                if (req.body.paymentMethod === 'gate' || req.body.paymentMethod === 'credit') { // Allow for late allowance for gate and credit registrations
                    if (trackday.date.getTime() + (process.env.LATE_ALLOWANCE_HOURS * 60 * 60 * 1000) < Date.now()) return res.status(403).send({ msg: ['Cannot register for trackday in the past'] })
                } else {
                    return res.status(403).send({ msg: ['Cannot register for trackday in the past'] })
                }
            }

            // Deny if trackday is full
            if (req.user.memberType !== 'admin' && req.user.memberType !== 'staff') {
                if ((user.group == 'green' && getRegDetails(trackday).green === parseInt(process.env.GROUP_CAPACITY)) ||
                    (user.group == 'yellow' && getRegDetails(trackday).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                    (user.group == 'red' && getRegDetails(trackday).red === parseInt(process.env.GROUP_CAPACITY))) {
                    return res.status(403).send({ msg: ['Trackday has reached capacity'] })
                }
            }


            // Deny if trackday registration is closed
            if (req.user.memberType !== 'admin' && trackday.status !== 'regOpen') return res.status(403).send({ msg: ['Registration closed'] })

            // Deny if user garage is empty UNLESS it is a gate registration
            if (req.user.memberType !== 'admin' && !user.garage.length && req.body.paymentMethod !== 'gate') return res.status(403).send({ msg: ['Cannot register with empty user garage'] })

            // If paying with credit, check balance is available and deduct
            if (req.body.paymentMethod === 'credit') {
                if (!user.credits) return res.status(403).send({ msg: ['Insufficient credits'] })
                user.credits--;
                await user.save();
            }

            // Add user to trackday
            trackday.members.push({
                user: req.params.userID,
                paymentMethod: req.body.paymentMethod,
                paid: (req.body.paymentMethod === 'gate' || req.body.paymentMethod === 'credit') ? true : false,
                guests: req.body.guests,
                layoutVote: req.body.layoutVote,
                checkedIn: []
            })



            await trackday.save();
            if (req.body.paymentMethod !== 'gate') { //We do not send email on gate registrations
                sendEmail(user.contact.email, "Ride42 Trackday Registration Confirmation", mailTemplates.registerTrackday,
                    { name: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1), date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) })
            }
            logger.info({ message: "Booked trackday for " + user.firstName + ' ' + user.lastName + ' on ' + trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) });
            return res.sendStatus(200);
        }
        return res.sendStatus(403)

    })
]

// Removes a user from a trackday. Requires JWT with matching userID OR admin.
// ! Logged operation !
exports.unregister = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,


    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID)) {
            let [trackday, user] = await Promise.all([Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').exec(), User.findById(req.params.userID)]);

            // Check user is actually registered for that trackday
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            if (!memberEntry) return res.status(403).send({ msg: ['Cannot unregister; member is not registered for that trackday'] });

            // Deny if trying to unregister a gate entry
            if (memberEntry.paymentMethod === 'gate' && req.user.memberType !== 'admin') return res.status(403).send({ msg: ['cannot unregister a gate registration'] })


            // If user attempt to unregister for trackday < lockout period(7 default) away, deny unregistration
            if (await controllerUtils.isInLockoutPeriod(req.params.trackdayID) &&
                memberEntry.paymentMethod !== 'credit' && req.body.paymentMethod !== 'gate' && req.user.memberType !== 'admin') {
                return res.status(403).send({ msg: ['Cannot unregister for trackday <' + process.env.DAYS_LOCKOUT + ' days away.'] })
            }

            // Check if trackday is in the past 
            if (req.user.memberType !== 'admin' && trackday.date.getTime() < Date.now()) return res.status(403).send({ msg: ['Cannot un-register for trackday in the past'] })

            // Deny if user has already checked in
            if (req.user.memberType !== 'admin' && memberEntry.checkedIn.length) return res.status(403).send({ msg: ['Cannot un-register for trackday you are already checked in at'] })

            // Remove user from trackday
            trackday.members = trackday.members.filter((member) => !member.user.equals(req.params.userID))

            // If paying with credit, add credit back to users balance
            if (memberEntry.paymentMethod === 'credit') {
                user.credits++;
                await user.save();
            }
            await trackday.save();
            // Send email to user
            sendEmail(user.contact.email, "Ride42 Trackday Cancellation Confirmation", mailTemplates.unregisterTrackday,
                { name: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1), date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) })
            // Notify admin only if payment wasn't made with credit (credit is auto refunded)
            if (memberEntry.paymentMethod !== 'credit') {
                sendEmail(process.env.ADMIN_EMAIL, "TRACKDAY CANCELATION", mailTemplates.unregisterTrackday_admin,
                    { name: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1), date: trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) })
            }
            logger.info({ message: "Cancelled trackday for " + user.firstName + ' ' + user.lastName + ' on ' + trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) });

            return res.sendStatus(200);
        }
        return res.sendStatus(403)

    })
]

// Reschedules a user. Requires JWT with matching userID OR admin.
// ! Logged operation !
exports.reschedule = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin' || (req.user.id === req.params.userID && 1)) {
            let [trackdayOLD, trackdayNEW, user] = await Promise.all([Trackday.findById(req.params.trackdayID_OLD).exec(),
            Trackday.findById(req.params.trackdayID_NEW).populate('members.user', '-password -refreshToken -__v').exec(),
            User.findById(req.params.userID)])


            // Check that the member we want to reschedule is registered in old trackday
            const memberEntryOLD = trackdayOLD.members.find((member) => member.user.equals(req.params.userID));
            if (!memberEntryOLD) return res.status(403).send({ msg: ['Not registered for original trackday'] });

            // Check if user is already registered for trackday they want to reschedule to
            const memberEntryNEW = trackdayNEW.members.find((member) => member.user.equals(req.params.userID));
            if (memberEntryNEW) return res.status(409).send({ msg: ['Member is already scheduled for trackday you want to reschedule to'] })

            // Deny if trying to reschedule a gate entry
            if (memberEntryOLD.paymentMethod === 'gate' && req.user.memberType !== 'admin') return res.status(403).send({ msg: ['Cannot reschedule a gate registration'] })

            // If user attempt to reschdule for trackday < lockout period(7 default) away, deny reschedule
            if (memberEntryOLD.paymentMethod !== 'credit' && req.user.memberType !== 'admin' && await controllerUtils.isInLockoutPeriod(req.params.trackdayID_NEW)) {
                return res.status(403).send({ msg: ['Cannot reschedule to a trackday <' + process.env.DAYS_LOCKOUT + ' days away.'] })
            }

            // Check if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.date.getTime() - Date.now() < 0) return res.status(403).send({ msg: ['Cannot register to a trackday in the past'] })
            if (req.user.memberType !== 'admin' && trackdayOLD.date.getTime() - Date.now() < 0) return res.status(403).send({ msg: ['Cannot register from a trackday in the past'] })

            // Deny if user has already checked in
            if (req.user.memberType !== 'admin' && memberEntryOLD.checkedIn.length) return res.status(403).send({ msg: ['Cannot reschedule a trackday you are already checked in at'] })

            // Check if trackday is full
            if (req.user.memberType !== 'admin') {
                if ((user.group == 'green' && getRegDetails(trackdayNEW).green === parseInt(process.env.GROUP_CAPACITY)) ||
                    (user.group == 'yellow' && getRegDetails(trackdayNEW).yellow === parseInt(process.env.GROUP_CAPACITY)) ||
                    (user.group == 'red' && getRegDetails(trackdayNEW).red === parseInt(process.env.GROUP_CAPACITY))) {
                    return res.status(403).send({ msg: ['Trackday has reached capacity'] })
                }
            }

            // Deny if trackday is in the past (if time difference is negative)
            if (req.user.memberType !== 'admin' && trackdayNEW.status !== 'regOpen') return res.status(403).send({ msg: ['Registration closed'] })

            // Add user to new trackday
            trackdayNEW.members.push({
                user: memberEntryOLD.user,
                paymentMethod: memberEntryOLD.paymentMethod,
                paid: memberEntryOLD.paid,
                guests: memberEntryOLD.guests,
                layoutVote: memberEntryOLD.layoutVote,
                checkedIn: memberEntryOLD.checkedIn
            })
            await trackdayNEW.save();

            // Remove the user from the OLD trackday
            trackdayOLD.members = trackdayOLD.members.filter((member) => !member.user.equals(req.params.userID))
            await trackdayOLD.save();

            // TODO: There may be an issue here where dateNEW is not being correctly considered
            sendEmail(user.contact.email, "Ride42 Trackday Reschedule Confirmation", mailTemplates.rescheduleTrackday,
                { name: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1), dateOLD: trackdayOLD.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }), dateNEW: trackdayNEW.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) })
            logger.info({ message: "Rescheduled " + user.firstName + ' ' + user.lastName + ' from ' + trackdayOLD.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) + ' to ' + trackdayNEW.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' }) });
            return res.sendStatus(200);
        }
        return res.sendStatus(403)

    })
]

// Adds walkon customer to walkons Requires JWT with staff/admin.
exports.walkons = [
    body("firstName", "First Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).escape(),
    body("lastName", "Last Name must contain 2-50 characters").trim().isLength({ min: 2, max: 50 }).escape(),
    body("group", "Group must be either green, yellow or red").trim().isIn(['green', 'yellow', 'red']).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin' || req.user.memberType === 'staff') {
            const trackday = await Trackday.findById(req.params.trackdayID).exec();

            trackday.walkons.push({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                group: req.body.group
            })
            await trackday.save();

            return res.sendStatus(201);
        }
        return res.sendStatus(403)
    })
]

// Marks a user as checked in. Requires JWT with staff/admin.
// ! Logged operation !
exports.checkin = [
    controllerUtils.verifyJWT,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,
    controllerUtils.validateBikeID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin' || req.user.memberType === 'staff') {
            const user = await User.findById(req.params.userID).populate('garage.bike').exec();
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', 'waiver').exec();

            // Check that the member we want to check in for trackday actually exists
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            if (!memberEntry) return res.status(403).send({ msg: ['Not registered for trackday'] });

            // Verify the bikeID is actually in the users garage
            const garageItem = user.garage.find((garageEntry) => garageEntry.bike.equals(req.params.bikeID))
            if (!garageItem) return res.status(404).send({ msg: ['this bike does not exist in your garage'] })

            // Check that member is not already checked in with that same bike
            if (memberEntry.checkedIn.includes(req.params.bikeID)) {
                logger.warn({ message: `${user.firstName} ${user.lastName} is already checked in with a ${garageItem.bike.year} ${garageItem.bike.make} ${garageItem.bike.model} for trackday on ${trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}` })
                return res.status(403).json({ msg: ['Already checked in with this bike'] })
            }


            // Do not allow checkin if unpaid or waiver is not signed
            let failCauses = []
            if (!memberEntry.paid) failCauses.push('Not paid')
            if (!memberEntry.user.waiver) failCauses.push('Missing waiver')
            if (failCauses.length) return res.status(403).json({ msg: failCauses })

            // Process the check in
            memberEntry.checkedIn.push(req.params.bikeID);
            await trackday.save();
            logger.info({ message: `Checked in ${user.firstName} ${user.lastName} with a ${garageItem.bike.year} ${garageItem.bike.make} ${garageItem.bike.model} for trackday on ${trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}` })
            return res.sendStatus(200);
        }
        return res.sendStatus(403)

    })
]

// Marks a user as checked in via QR code. Requires JWT with staff/admin.
// ! Logged operation !
exports.checkinQR = [
    controllerUtils.verifyJWT,
    controllerUtils.validateQRID,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin' || req.user.memberType === 'staff') {
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', 'waiver').exec();
            const qr = await QR.findById(req.params.QRID).populate('user bike').exec();

            // Check that the member we want to check in for trackday actually exists
            const memberEntry = trackday.members.find((member) => member.user.equals(qr.user.id));
            if (!memberEntry) return res.status(403).send({ msg: ['Not registered for trackday'] });

            // NOTE: We do not need to verify that bike is in users garage since garage_delete wipes QRID from QR DB

            // Check that member is not already checked in with that same bike
            if (memberEntry.checkedIn.includes(qr.bike.id)) {
                logger.warn({ message: `${qr.user.firstName} ${qr.user.lastName} is already checked in with a ${qr.bike.year} ${qr.bike.make} ${qr.bike.model} for trackday on ${trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}` })
                return res.status(403).json({ msg: ['Already checked in with this bike'] })
            }


            // Do not allow checkin if unpaid or waiver is not signed
            let failCauses = []
            if (!memberEntry.paid) failCauses.push('Not paid')
            if (!memberEntry.user.waiver) failCauses.push('Missing waiver')
            if (failCauses.length) return res.status(403).json({ msg: failCauses })

            // Process the check in
            memberEntry.checkedIn.push(qr.bike.id);
            await trackday.save();
            logger.info({ message: `Checked in ${qr.user.firstName} ${qr.user.lastName} with a ${qr.bike.year} ${qr.bike.make} ${qr.bike.model} for trackday on ${trackday.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}` })
            return res.sendStatus(200);
        }
        return res.sendStatus(403)

    })
]

// Returns an array of trackday dates in format [{id: x, date: x, status: x, layout: x, green: x, yellow: x, red: x, guests: x, groupCapacity: x, votes: x}] PUBLIC.
exports.presentTrackdays = async (req, res, next) => {
    const allDays = await Trackday.find().populate('members.user', '-password -refreshToken -__v')
    let result = []
    allDays.forEach((trackday) => {

        result.push({
            id: trackday.id,
            date: trackday.date,
            status: trackday.status,
            layout: trackday.layout,
            green: getRegDetails(trackday).green,
            yellow: getRegDetails(trackday).yellow,
            red: getRegDetails(trackday).red,
            guests: getRegDetails(trackday).guests,
            groupCapacity: process.env.GROUP_CAPACITY,
            votes: getRegDetails(trackday).votes
        })
    })
    return res.status(200).send(result)
}

// Returns an array of trackday dates that user is registered for in format [{id: x, date: x, status: x, layout: x, green: x, yellow: x, red: x, guests: x, groupCapacity: x,  votes: x, paid: x, paymentMethod: x}] PUBLIC.
exports.presentTrackdaysForUser = [
    controllerUtils.validateUserID,

    asyncHandler(async (req, res, next) => {
        // Get all trackdays that user is a part of
        const allDays = await Trackday.find({ members: { $elemMatch: { user: { $eq: req.params.userID } } } }).populate('members.user', '-password -refreshToken -__v').exec();
        let result = []

        allDays.forEach((trackday) => {
            result.push({
                id: trackday.id,
                date: trackday.date,
                status: trackday.status,
                layout: trackday.layout,
                green: getRegDetails(trackday).green,
                yellow: getRegDetails(trackday).yellow,
                red: getRegDetails(trackday).red,
                guests: getRegDetails(trackday).guests,
                groupCapacity: process.env.GROUP_CAPACITY,
                votes: getRegDetails(trackday).votes,
                // trackday members array currently has ALL members for that particular trackday. Fetch specific member entry so we can check payment status
                paid: trackday.members.find((member) => member.user.equals(req.params.userID)).paid,
                paymentMethod: trackday.members.find((member) => member.user.equals(req.params.userID)).paymentMethod
            })
        })
        return res.status(200).send(result)
    })
]

// Updates paid status of member for a trackday. Requires JWT with admin.
// ! Logged operation !
exports.updatePaid = [
    body('setPaid', 'setPaid must be either true or false').trim().isBoolean().escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateUserID,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin') {
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -__v').exec();
            const memberEntry = trackday.members.find((member) => member.user.equals(req.params.userID));
            // Check that user we want to mark as paid is actually registerd for the trackday
            if (!memberEntry) return res.status(403).send({ msg: ['Member is not registered for that trackday'] });

            // Block changing paid status for credit and gate paymentMethods
            if (memberEntry.paymentMethod === 'credit' || memberEntry.paymentMethod === 'gate') return res.status(403).send({ msg: ['Cannot change paid status on gate or credit registrations'] });


            // Prevent setting paid status to what it was already set to
            if (memberEntry.paid && req.body.setPaid == 'true') return res.status(403).send({ msg: ['user already marked as paid'] })
            if (!memberEntry.paid && req.body.setPaid == 'false') return res.status(403).send({ msg: ['user already marked as unpaid'] })

            // Update paid status
            memberEntry.paid = !memberEntry.paid


            // Send email confirmation to user
            if (memberEntry.paid) {
                sendEmail(memberEntry.user.contact.email, "Payment Confirmation", mailTemplates.notifyPaid, {
                    name: memberEntry.user.firstName.charAt(0).toUpperCase() + memberEntry.user.firstName.slice(1),
                    date: trackday.date.toLocaleString('default', {
                        weekday: 'long', month: 'long', day: 'numeric'
                    })
                })
            }

            await trackday.save()
            logger.info({ message: "Set paid for " + memberEntry.user.firstName + ' ' + memberEntry.user.lastName + ' to ' + memberEntry.paid });
            return res.sendStatus(200)
        }
        return res.sendStatus(403)
    })
]

//////////////////////////////////////
//              CRUD
//////////////////////////////////////

// Returns specific trackday. Requires JWT with staff or admin.
exports.trackday_get = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'staff' || req.user.memberType === 'admin') {
            const trackday = await Trackday.findById(req.params.trackdayID).populate('members.user', '-password -refreshToken -garage -__v').select('-__v').exec();
            return res.status(200).send({ ...trackday._doc, guests: getRegDetails(trackday).guests });
        }
        return res.sendStatus(403)
    })
]

// Returns all trackdays. Requires JWT with staff or admin.
exports.trackday_getALL = [
    controllerUtils.verifyJWT,
    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'staff' || req.user.memberType === 'admin') {
            const trackdays = await Trackday.find().populate('members.user', '-password -refreshToken -garage -__v').select('-__v').exec();
            trackdays.forEach((trackday) => trackday._doc = { ...trackday._doc, guests: getRegDetails(trackday).guests })
            return res.status(200).json(trackdays);
        }
        return res.sendStatus(403)
    })
]

// Creates a trackday. Requires JWT with admin.
// ! Logged operation !
exports.trackday_post = [
    body("date", "Date must be in YYYY-MM-DDThh:mmZ form where time is in UTC").isISO8601().bail().isLength({ min: 17, max: 17 }).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin') {
            // Check if a trackday already exists with same date and time details
            const duplicateTrackday = await Trackday.find({ date: { $eq: req.body.date } })
            if (duplicateTrackday.length) return res.status(409).send({ msg: ['Trackday with this date and time already exists'] });
            // Create trackday
            const trackday = new Trackday({
                date: req.body.date,
                members: [],
                walkons: [],
                status: 'regOpen',
                layout: 'tbd'
            })
            await trackday.save();
            logger.info({ message: "trackday created: " + trackday.id });
            return res.status(201).json({ id: trackday.id });
        }

        return res.sendStatus(403)
    })
]

// Updates a trackday EXCLUDING members and walkons. Requires JWT with admin.
// TODO: updates tests for layout and archived status
// ! Logged operation !
exports.trackday_put = [
    body("date", "Date must be in YYYY-MM-DDThh:mm form where time is in UTC").isISO8601().bail().isLength({ min: 17, max: 17 }).escape(),
    body("status", "Status must be one of: [regOpen, regClosed, cancelled, archived]").trim().isIn(["regOpen", "regClosed", "cancelled", "archived"]).escape(),
    body("layout", "Layout must be one of: [tbd, technical, Rtechnical, alien, Ralien, modified, Rmodified, long]").trim().isIn(["tbd", "technical", "Rtechnical", "alien", "Ralien", "modified", "Rmodified", "long"]).escape(),

    controllerUtils.verifyJWT,
    controllerUtils.validateForm,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {

        if (req.user.memberType === 'admin') {
            const oldTrackday = await Trackday.findById(req.params.trackdayID).select('date members walkons').exec();

            // Check for duplicates
            const duplicateTrackday = await Trackday.findOne({ date: { $eq: req.body.date } })
            const requestedUpdateDate = new Date(req.body.date).toISOString()
            if (duplicateTrackday && requestedUpdateDate !== oldTrackday.date.toISOString()) return res.status(409).send({ msg: ['Trackday with this date and time already exists'] });

            // Create trackday
            const trackday = new Trackday({
                date: req.body.date,
                members: oldTrackday.members,
                walkons: oldTrackday.walkons,
                status: req.body.status,
                layout: req.body.layout,
                _id: req.params.trackdayID
            })
            await Trackday.findByIdAndUpdate(req.params.trackdayID, trackday, {});
            logger.info({ message: "trackday updated: " + trackday.id });
            return res.status(201).json({ id: trackday.id });
        }
        return res.sendStatus(403)
    })
]

// Deletes a trackday. Requires JWT with admin.
// ! Logged operation !
exports.trackday_delete = [
    controllerUtils.verifyJWT,
    controllerUtils.validateTrackdayID,

    asyncHandler(async (req, res, next) => {
        if (req.user.memberType === 'admin') {
            await Trackday.findByIdAndDelete(req.params.trackdayID);
            logger.info({ message: "trackday deleted: " + req.params.trackdayID });
            return res.sendStatus(200);
        }
        return res.sendStatus(403)
    })
]