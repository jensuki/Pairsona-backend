'use strict';

/** routes for authentication */

const jsonschema = require('jsonschema');
const express = require('express');
const multer = require('multer');
const supabase = require('../utils/supabase'); // for image bucketing

const { createToken } = require('../helpers/token');
const { validateRequestBody } = require('../helpers/validation');
const { geocodeLocation } = require('../utils/geocode');
const userAuthSchema = require('../schemas/userAuth.json');
const userRegisterSchema = require('../schemas/userRegister.json');
const { BadRequestError, UnauthorizedError } = require('../config/expressError');
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');

const router = new express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // store pic file in memory as a buffer

/** POST /auth/register:
 *
 * { username, password, firstName, lastName, email, birthDate, location } => token
 *
 * registers a new user ( optional bio + profile pic)
 * user uploaded profile images -> supabase bucket
 *
 * returns a JWT token for authentication
 *
 * authorization required: none
 */

router.post('/register', upload.single('profilePic'), async (req, res, next) => {
    try {
        // remove profilePic from req.body before validation
        delete req.body.profilePic;

        validateRequestBody(req.body, userRegisterSchema);

        // extract form fields from req body
        const {
            username,
            password,
            firstName,
            lastName,
            email,
            birthDate,
            location,
            bio
        } = req.body;

        // default to null
        let profilePicUrl = null;

        // if file is uploaded -> to supabase and update profle pic url
        if (req.file) {
            const { data, error } = await supabase
                .storage
                .from('profile_pics')
                .upload(`public/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (error) {
                throw new BadRequestError('Error uploading profile image to supabase');
            }

            // set image path
            profilePicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/profile_pics/${data.path}`;
        }

        // register new user with geocoded data + profilePicUrl
        const newUser = await User.register({
            username,
            password,
            firstName,
            lastName,
            email,
            birthDate,
            location,
            bio,
            profilePic: profilePicUrl,
            // latitude,
            // longitude,
            isAdmin: false
        });

        // generate JWT token
        const token = createToken({
            id: newUser.id,
            username: newUser.username,
            isAdmin: newUser.isAdmin
        });

        return res.status(201).json({ token });
    } catch (err) {
        console.error('Error in /register route:', err)

        return next(err);
    }
});

/** POST /auth/token:
 *
 * { username, password } = {token}
 *
 * logs in an existing user
 * returns a JWT token for authentication
 *
 * authorization required: none
 */

router.post('/token', async (req, res, next) => {
    try {
        // validate incoming data against userAuthSchema
        const validator = jsonschema.validate(req.body, userAuthSchema);
        if (!validator.valid) {
            const err = validator.errors.map(e => e.stack);
            console.log("Validation Errors:", err);
            throw new BadRequestError(err);
        }

        const { username, password } = req.body;

        // authenticate user
        const user = await User.authenticate(username, password);

        // generate token
        const token = createToken({
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin
        });

        return res.status(200).json({ token });
    } catch (err) {
        console.error('Error in /token route:', err);
        return next(err);
    }
})

/** GET /auth/me => {user}
 *
 * fetch the curr logged in users details
 *
 * authorization required: logged in
*/

router.get('/me', authenticateJWT, async (req, res, next) => {
    try {
        if (!res.locals.user) {
            throw new UnauthorizedError();
        }
        const username = res.locals.user.username; // get username from jwt payload
        const user = await User.get(username); // fetch user deets

        return res.json({ user });
    } catch (err) {
        console.error('Error in /me routes', err);
        return next(err);
    }
});

module.exports = router;