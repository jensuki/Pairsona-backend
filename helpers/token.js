'use strict';

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config');

/** helper func that returns signed JWT from user data */

const createToken = (user) => {
    console.assert(user.isAdmin !== undefined,
        "createToken passed user without isAdmin property");

    const payload = {
        id: user.id, //
        username: user.username,
        isAdmin: user.isAdmin || false
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}

module.exports = { createToken };