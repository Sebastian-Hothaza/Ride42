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

exports.trackday_post = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_post for _id: '+req.params.trackdayID)
}

exports.trackday_put = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_put for _id: '+req.params.trackdayID)
}

exports.trackday_delete = (req,res,next) => {
    //Admin only
    res.send('NOT YET IMPLEMENTED: trackday_delete for _id: '+req.params.trackdayID)
}