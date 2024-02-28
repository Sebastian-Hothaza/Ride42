exports.login = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: login for _id: '+req.params.userID)
}

exports.getTrackdays = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: getTrackdays for _id: '+req.params.userID)
}

exports.verify = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: verify for _id: '+req.params.userID)
}

//////////////////////////////////////
//              CRUD
//////////////////////////////////////
exports.user_get = (req,res,next) => {
    // Logged in user
    res.send('NOT YET IMPLEMENTED: user_get for _id: '+req.params.userID)
}

exports.user_getALL = (req,res,next) => {
    // Admin onlt
    res.send('NOT YET IMPLEMENTED: user_getALL')
}

exports.user_post = (req,res,next) => {
    // PUBLIC
    res.send('NOT YET IMPLEMENTED: user_post for _id: '+req.params.userID)
}

exports.user_put = (req,res,next) => {
    // Logged in user
    res.send('NOT YET IMPLEMENTED: user_put for _id: '+req.params.userID)
}

exports.user_delete = (req,res,next) => {
    // Admin only
    res.send('NOT YET IMPLEMENTED: user_delete for _id: '+req.params.userID)
}




