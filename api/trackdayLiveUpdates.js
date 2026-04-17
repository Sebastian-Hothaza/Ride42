const Trackday = require('./models/Trackday');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.split('=');
        cookies[name?.trim()] = decodeURIComponent(rest.join('='));
    });
    return cookies;
}

async function authorizeSocket(socket, next) {
    try {
        const cookies = parseCookies(socket.handshake.headers.cookie || '');
        const accessToken = cookies.JWT_ACCESS_TOKEN || socket.handshake.auth?.accessToken;
        if (!accessToken) return next(new Error('unauthorized'));

        const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_CODE);
        if (!payload || !['admin', 'staff'].includes(payload.memberType)) return next(new Error('forbidden'));

        socket.user = payload;
        next();
    } catch (err) {
        next(new Error('unauthorized'));
    }
}

// Helper function to calculate total guests from trackday members
// Similar logic used in trackdayController for get method.
function getGuests(trackday) {
    let guests = 0;
    if (!trackday) return { guests };

    if (Array.isArray(trackday.members)) {
        for (let i = 0; i < trackday.members.length; i++) {
            guests += trackday.members[i].guests || 0;
        }
    }

    return { guests };
}

// Emit trackday update to all connected clients
async function emitTrackdayUpdate(io, trackdayID) {
    try {
        const trackday = await Trackday.findById(trackdayID)
            .populate('members.user', '-contact -password -refreshToken -garage -__v')
            .select('-__v')
            .exec();

        if (!trackday) {
            io.emit('trackday:deleted', { _id: trackdayID.toString() });
            return;
        }

        const trackdayObj = trackday.toObject({ getters: true });
        trackdayObj._id = trackdayObj._id.toString();
        trackdayObj.id = trackdayObj._id;
        trackdayObj.guests = getGuests(trackday).guests;
        io.emit('trackday:update', trackdayObj);
    } catch (err) {
        logger.error({ message: 'Error emitting trackday update: ' + err.message });
    }
}

// Initialize Socket.IO listeners for trackday live updates
function init(io) {
    io.use(authorizeSocket);

    io.on('connection', (socket) => {
        logger.debug({ message: `Socket connected: ${socket.id} (${socket.user?.memberType})` });

        socket.on('disconnect', () => {
            logger.debug({ message: `Socket disconnected: ${socket.id}` });
        });
    });

    try {
        const changeStream = Trackday.watch([], { fullDocument: 'updateLookup' });

        changeStream.on('change', async (change) => {
            const operationType = change.operationType;
            const trackdayID = change.documentKey && change.documentKey._id;
            if (!trackdayID) return;

            if (operationType === 'insert' || operationType === 'update' || operationType === 'replace') {
                await emitTrackdayUpdate(io, trackdayID);
            } else if (operationType === 'delete') {
                io.emit('trackday:deleted', { _id: trackdayID.toString() });
            }
        });

        changeStream.on('error', (err) => {
            logger.error({ message: 'Trackday watch error: ' + err.message });
        });

        changeStream.on('close', () => {
            logger.warn({ message: 'Trackday watch stream closed' });
        });
    } catch (err) {
        logger.error({ message: 'Failed to initialize trackday live updates: ' + err.message });
    }
}

module.exports = { init };