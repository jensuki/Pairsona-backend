'use strict';

/** user routes */

const jsonschema = require('jsonschema');
const express = require('express');
const multer = require('multer');
const supabase = require('../utils/supabase');

const { createToken } = require('../helpers/token');
const { validateRequestBody } = require('../helpers/validation');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const { BadRequestError } = require('../config/expressError');
const {
    ensureAdmin,
    ensureCorrectUserOrAdmin,
    ensureLoggedIn
} = require('../middleware/auth');

const mbtiDetails = require('../data/mbti_details.json');
const { getDistance } = require('../utils/distance');
const { isValidMbtiType } = require('../utils/compatibility')
const User = require('../models/User');

const router = new express.Router();

const upload = multer({ storage: multer.memoryStorage() }) // store file in memory as a buffer

/** PATCH /users/:username
 *
 * update user profile
 *
 * authorization required: correct user or admin
 */

router.patch('/:username', ensureCorrectUserOrAdmin, upload.single('profilePic'), async (req, res, next) => {
    try {

        validateRequestBody(req.body, userUpdateSchema);

        // extract bio + pic reset + other fields from req body
        const { bio, resetProfilePic, ...otherFields } = req.body;
        let profilePicUrl = null;

        // if profile pic file is uploaded, add it to supabase bucket
        if (req.file) {
            const { data, error } = await supabase
                .storage
                .from('profile_pics')
                .upload(`${Date.now()}-${req.file.originalname}`, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (error) {
                throw new BadRequestError('Error uploading profile picture to supabase bucket');
            }
            profilePicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/profile_pics/${data.path}`;
        }

        // prepare the data for updating user
        const updateData = { ...otherFields };
        if (bio !== undefined) updateData.bio = bio;

        // handle resetting profile img to default
        if (resetProfilePic === 'true') {
            updateData.profilePic = null; // reset to default img
        } else if (profilePicUrl) {
            updateData.profilePic = profilePicUrl // else add new img
        }

        // update user in the db
        const updatedUser = await User.update(req.params.username, updateData);

        return res.json({ user: updatedUser });
    } catch (err) {
        console.error('Error in user update route', err)
        return next(err);
    }
});

/** POST / { user } = { user, token }
 *
 * for admin users to add new users. the new user can be an admin
 *
 * returns: newly created user and auth token for them:
 * { user: {username. firstName, lastName, email, isAdmin}, token}
 *
 * authorization required: admin
*/

router.post('/', ensureAdmin, async function (req, res, next) {
    try {
        // validate incoming data against new user schema
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack)
            throw new BadRequestError(errs);
        }
        // register new user (optionally admin)
        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/** GET / => { users: [ {username, firstName, lastName, email}, ...]}
 *
 * returns list of all users
 *
 * authorization required: admin
*/

router.get('/', ensureAdmin, async (req, res, next) => {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** GET  /users/:username
 *
 * returns details of a single user
 * {username, email, firstName, lastName, location, bio, profilePic, createdAt, isAdmin}
 *
 * authorization required: correct user or admin
*/

router.get('/:username', ensureCorrectUserOrAdmin, async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
})

/** GET /users/:username/profile
 *
 * returns details of a single user for any authenticated users
 * {username, email, firstName, lastName, location, bio, profilePic, createdAt, isAdmin}
 *
 * authorization reqiured: logged in user
*/

router.get('/:username/profile', ensureLoggedIn, async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    }
    catch (err) {
        return next(err);
    }
});


/** GET /users/:username/mbti
 *
 * returns the MBTI details for the user
 * {mbtiDetails: {type, title, %, description, site}}
 *
 * authorization required: correct user or admin
 */

router.get('/:username/mbti', ensureCorrectUserOrAdmin, async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);

        // get details unless invalid
        const details = mbtiDetails[user.mbti] || {
            type: user.mbti,
            title: "Unknown",
            percentage: "N/A",
            description: "No additional information available for this personality type",
            site: "N/A"
        };

        // ensure the 'type' field is set
        details.type = user.mbti;
        return res.json({ mbtiDetails: details });
    } catch (err) {
        return next(err);
    }
})

/** PATCH /users/:username/mbti
 *
 * updates the mbti type of user if not set post-quiz
 *
 * req body: { mbti: 'ENFP'}
 * response: {username, mbti}
 *
 * authorization required: correct user or admin
 */

router.patch('/:username/mbti', ensureCorrectUserOrAdmin, async (req, res, next) => {
    try {
        const { mbti } = req.body;

        // validate the mbti type using helper func
        if (!isValidMbtiType(mbti)) {
            throw new BadRequestError('Invalid mbti type');
        }

        // update users mbti in the db
        await User.update(req.params.username, { mbti })

        const user = await User.get(req.params.username);

        // return the user with updated MBTI type
        return res.json({
            user: {
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                location: user.location,
                latitude: user.latitude,
                longitude: user.longitude,
                bio: user.bio,
                profilePic: user.profilePic,
                mbti: mbti, // explicitly include updated MBTI type
            },
        });
    } catch (err) {
        return next(err);
    }
})

/** GET /users/:username/matches
 *
 * finds and returns a lst of compatible users with curr users mbti type
 * return compatible users who are closest in geographical proximitythrough { getDistance }
 *
 * response: { matches: [{ username, firstName, lastName, email, location, bio, mbti, location, profilePic} , ...]}
 *
 * authorization required: correct user or admin
*/

router.get('/:username/matches', ensureCorrectUserOrAdmin, async (req, res, next) => {
    try {
        // get current user
        const user = await User.get(req.params.username);
        const userLat = user.latitude;
        const userLong = user.longitude

        if (!userLat || !userLong) {
            throw new BadRequestError('User location data is incomplete');
        }

        // get compatible matches
        const matches = await User.findMatches(req.params.username);

        // calculate distance between 'user' lat long and each 'match' lat long
        // (include mbti description)
        const matchesWithDetails = matches.map(match => {
            const distance = getDistance(userLat, userLong, match.latitude, match.longitude);
            return {
                ...match,
                distance,
                // if match.mbti is null or undefined , set to undefined
                description: mbtiDetails[match.mbti]?.description
            };
        });

        // sort by distance (asc)
        matchesWithDetails.sort((a, b) => a.distance - b.distance);

        return res.json({ matches: matchesWithDetails });
    } catch (err) {
        return next(err);
    }
})

/** DELETE /users/:username => {deleted: username}
 *
 * removes user from the db
 *
 * authorization required: correct user or admin
*/

router.delete('/:username', ensureCorrectUserOrAdmin, async (req, res, next) => {
    try {
        await User.remove(req.params.username);
        return res.status(204).json({ deleted: req.params.username });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;

