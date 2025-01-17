'use strict';

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config');
const { UnauthorizedError } = require('../config/expressError');
const User = require('../models/User');

/** middleware to authenticate uer via JWT
 *
 * if a valid token is provided, store the token payload in 'res.locals.user'
 * if no token/invalid token, res.locals.user = undefined
*/

const authenticateJWT = (req, res, next) => {
    try {
        const authHeader = req.headers && req.headers.authorization;

        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, '').trim();

            res.locals.user = jwt.verify(token, SECRET_KEY);
        }
        return next();
    } catch (err) {
        console.error('JWT Authentication Error:', err.message);
        return next(err);
    }
}

/** middleware to ensure the user is logged in
 *
 * if no valid JWT is provided, raise Unauthorized error
 */

const ensureLoggedIn = (req, res, next) => {
    try {
        if (!res.locals.user) throw new UnauthorizedError('User must be logged in');
        return next();
    } catch (err) {
        return next(err);
    }
}

/** middleware to use when they must provide a valid token
 *
 * the user must match the username provided in route parameter
 *
 * if not ->  raises Unauthorized error
 */

const ensureCorrectUserOrAdmin = (req, res, next) => {
    try {
        const user = res.locals.user;
        const { username } = req.params;

        if (!username || !(user && (user.isAdmin || user.username === username))) {
            throw new UnauthorizedError('You are not authorized to perform this action.');
        }
        return next();
    } catch (err) {
        return next(err);
    }
};


/** middleware for when they must be logged in as an admin user
 *
 * if not -> raises Unauthorized error
*/

const ensureAdmin = (req, res, next) => {
    try {
        if (!res.locals.user || !res.locals.user.isAdmin) {
            throw new UnauthorizedError('Admin privileges required');
        }
        return next();
    } catch (err) {
        return next(err);
    }
}

/** middleware to get the recipient's user ID from their username */
const getUserIdFromUsername = async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        if (!user) throw new UnauthorizedError('User not found');
        req.toUserId = user.id;
        next();
    } catch (err) {
        return next(err);
    }
}
module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdmin,
    ensureCorrectUserOrAdmin,
    getUserIdFromUsername
}