const User = require('../models/User');
const Trackday = require('../models/Trackday');
const Bike = require('../models/Bike');
const { body, validationResult } = require("express-validator");
const ObjectId = require('mongoose').Types.ObjectId;
const jwt = require('jsonwebtoken')

/*
    --------------------------------------------- TODO ---------------------------------------------
    code cleanup & review
    --------------------------------------------- TODO ---------------------------------------------
*/

// Validates the form contents and builds errors array. In case of errors, returns 400 with error message array
function validateForm(req,res,next){
    const errors = validationResult(req); // Extract the validation errors from a request.
    if (!errors.isEmpty()) {
        let errorMessages = [];
        errors.errors.forEach((elem)=> errorMessages.push(elem.msg))
        return res.status(400).json({msg: errorMessages});
    }
    next();
}

// Called by middleware functions
// Verify that the req.params.userID is a valid objectID and that it exists in our DB
async function validateUserID(req, res, next){
    if (!ObjectId.isValid(req.params.userID)) return res.status(404).send({msg: 'userID is not a valid ObjectID'});
    const userExists = await User.exists({_id: req.params.userID});
    if (!userExists) return res.status(404).send({msg: 'User does not exist'});
    next();
}

// Called by middleware functions
// Verify that the req.params.trackdayID is a valid objectID and that it exists in our DB
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
// Verify that the req.params.bikeID is a valid objectID and that it exists in our DB
async function validateBikeID(req, res, next){
    if (!ObjectId.isValid(req.params.bikeID)) return res.status(404).send({msg: 'bikeID is not a valid ObjectID'});
    const bikeExists = await Bike.exists({_id: req.params.bikeID});
    if (!bikeExists) return res.status(404).send({msg: 'Bike does not exist'});
    next();
}

// Returns true if a given trackdayID is within lockout period. Returns false for days in the past
async function isInLockoutPeriod(trackdayID){
    const trackday = await Trackday.findById(trackdayID);
    const timeLockout = process.env.DAYS_LOCKOUT*(1000*60*60*24); // If we are under this, then we are in the lockout period
    const timeDifference = trackday.date.getTime() - Date.now()
    if (timeDifference > 0 && timeDifference < timeLockout) return true;
    return false;
}

// Returns true if user is registered for a trackday within the lockout period (7 days default)
async function hasTrackdayWithinLockout(user){
    const allTrackdays = await Trackday.find({members: {$elemMatch: { userID: {$eq: user}}}} ).exec(); // Trackdays that user is a part of
    
    // Check each trackday user is registered for to see if any of them are within lockout period
    for (let i=0; i<allTrackdays.length; i++){
        if (await isInLockoutPeriod(allTrackdays[i].id)) return true;
    }
    return false;
}

// Verifies access token and attaches payload to request body.
// Sets cookie if access token is expired but refresh token is valid
// Returns appropriate code if both tokens are invalid
async function verifyJWT(req, res, next){
    // Try to verify JWT_ACCESS
    let payload // Represents the object in the JWT_ACCESS
    try{
        payload = jwt.verify(req.cookies.JWT_ACCESS_TOKEN, process.env.JWT_ACCESS_CODE);
    }catch(err){ 
        // JWT_ACCESS verification failed. Try to verify the JWT_REFRESH
        try{
            // Check the refresh token is not expired
            const JWTRefreshPayload = jwt.verify(req.cookies.JWT_REFRESH_TOKEN, process.env.JWT_REFRESH_CODE);

            // Pull the candidate user and check the refresh token is in DB. 
            const user = await User.findById(JWTRefreshPayload.id).exec();
            if (user.refreshToken !== req.cookies.JWT_REFRESH_TOKEN) return res.sendStatus(403)

            // JWT_REFRESH is valid! Create new JWT_ACCESS. 
            const accessToken = jwt.sign({id: user._id, memberType: user.memberType, name: user.name.firstName}, 
                                            process.env.JWT_ACCESS_CODE, {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION}) 
            res.cookie([`JWT_ACCESS_TOKEN=${accessToken}; secure; httponly; samesite=None;`])
            payload = jwt.verify(accessToken, process.env.JWT_ACCESS_CODE);
        }catch(err2){
            // JWT_REFRESH verification failed.
            return res.sendStatus(401)
        }
    }
    // Attach payload to request body
    req.user = payload;
    next();
}

module.exports = { validateForm, validateUserID, validateTrackdayID, validateBikeID, isInLockoutPeriod, hasTrackdayWithinLockout, verifyJWT }