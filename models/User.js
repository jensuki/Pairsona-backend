'use strict';

/** user model
 *
 * for authentication, registration, updates, connections, removal
*/

const db = require('../config/db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const { geocodeLocation } = require('../utils/geocode');
const { getCompatibilityTypes } = require('../utils/compatibility');
const mbtiDetails = require('../data/mbti_details.json');
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError
} = require('../config/expressError');
const { BCRYPT_WORK_FACTOR } = require('../config/config');

class User {

    // helper for formatting birth date
    static formatDateToISO(date) {
        if (!date) {
            throw new BadRequestError("Invalid date");
        }
        return new Date(date).toISOString().split('T')[0];
    }

    /** register a new user with provided data
     *
     * returns: { username, firstName, lastName, email, birthDate, location,
     *            bio, profilePic, latitude, longitude, isAdmin }
     *
     * if username taken -> throws BadRequest error
    */
    static async register({
        username,
        password,
        firstName,
        lastName,
        email,
        birthDate,
        location,
        bio,
        profilePic,
        isAdmin
    }) {

        const duplicateCheck = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
            [username]
        );

        // error if duplicate username
        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Username already taken: ${username}`);
        }

        // call geocoding ONCE here
        const { latitude, longitude } = await geocodeLocation(location);

        // hash the password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);


        // convert birth date to iso yyyy-mm-dd format
        birthDate = this.formatDateToISO(birthDate);


        // insert user into db
        const result = await db.query(
            `INSERT INTO users (
                username,
                password,
                first_name,
                last_name,
                email,
                birth_date,
                location,
                bio,
                profile_pic,
                latitude,
                longitude,
                is_admin)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id,
                      username,
                      first_name AS "firstName",
                      last_name AS "lastName",
                      email,
                      birth_date AS "birthDate",
                      location,
                      bio,
                      profile_pic AS "profilePic",
                      latitude,
                      longitude,
                      is_admin AS "isAdmin"`,
            [username, hashedPassword, firstName, lastName, email, birthDate, location, bio, profilePic, latitude, longitude, isAdmin]
        );
        const user = result.rows[0];

        // format birthDate AFTER retrieving from db
        user.birthDate = this.formatDateToISO(birthDate);

        return user;
    }

    /** authenticate user with username and password
     *
     * returns: { username, firstName, lastName, email, isAdmin }
     *
     * throws unauthorized error if user is not found or password is invalid
     */
    static async authenticate(username, password) {
        const result = await db.query(
            `SELECT id,
                    username,
                    password,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    is_admin AS "isAdmin"
                FROM users
                WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                delete user.password;
                return user;
            }
        }
        // else
        throw new UnauthorizedError('Invalid username or password');
    }

    /** gets details about a user by username
     *
     * returns: { username, email, firstName, lastName, birthDate, location, bio, profilePic, latitude, longitude, mbti, isAdmin }
     *
     * throws notfounderror if user not found
     */
    static async get(username) {
        const result = await db.query(
            `SELECT id,
                    username,
                    email,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    birth_date AS "birthDate",
                    location,
                    bio,
                    profile_pic AS "profilePic",
                    latitude,
                    longitude,
                    mbti,
                    is_admin AS "isAdmin"
                FROM users
                WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) throw new NotFoundError(`User doesn't exist: ${username}`);

        // format birthDate before returning the user
        user.birthDate = this.formatDateToISO(user.birthDate);

        // Add MBTI details if a valid MBTI type exists
        if (user.mbti) {
            user.mbtiDetails = mbtiDetails[user.mbti] || {
                title: "Unknown",
                percentage: "N/A",
                description: "No description available.",
                site: "N/A",
            };
        } else {
            user.mbtiDetails = null;
        }

        return user;
    }

    /** get a list of users with pagination with limit and offset
     *
     * returns: [{ username, firstName, lastName, email, isAdmin }, ...]
     */
    static async findAll(limit = 10, offset = 0) {
        const result = await db.query(
            `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    is_admin AS "isAdmin"
                FROM users
                ORDER BY username
                LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    /** get user by ID
     *
     * returns: { id, username, email, firstName, lastName, ... }
     *
     * throws NotFoundError if user not found
     */
    static async getById(id) {
        const result = await db.query(
            `SELECT id,
                username,
                email,
                first_name AS "firstName",
                last_name AS "lastName",
                birth_date AS "birthDate",
                location,
                bio,
                profile_pic AS "profilePic",
                latitude,
                longitude,
                mbti,
                is_admin AS "isAdmin"
         FROM users
         WHERE id = $1`,
            [id]
        );

        const user = result.rows[0];

        if (!user) throw new NotFoundError(`User doesn't exist: ${id}`);

        return user;
    }

    /** update user data with the provided 'data' (partial update)
     *
     * data can include: { firstName, lastName, profilePic, location, bio }
     *
     * throws notfounderror if user not found
    */
    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

        // if new location update, geocode it for latitude and longitude
        if (data.location) {
            try {
                const { latitude, longitude } = await geocodeLocation(data.location);
                data.latitude = latitude;
                data.longitude = longitude;
            } catch (err) {
                console.error('geocoding failed:', err.message);
                throw new BadRequestError('Invalid location provided');
            }
        }

        const { setCols, values } = sqlForPartialUpdate(data, {
            firstName: "first_name",
            lastName: "last_name",
            location: "location",
            bio: "bio",
            birthDate: "birth_date",
            profilePic: "profile_pic",
            latitude: "latitude",
            longitude: "longitude"
        });

        const usernameVarIdx = '$' + (values.length + 1);

        const querySql = `UPDATE users
                          SET ${setCols}
                          WHERE username = ${usernameVarIdx}
                          RETURNING username,
                                    first_name AS "firstName",
                                    last_name AS "lastName",
                                    location,
                                    latitude,
                                    longitude,
                                    bio,
                                    profile_pic AS "profilePic"`;
        const result = await db.query(querySql, [...values, username]);

        const user = result.rows[0];

        if (!user) throw new NotFoundError(`User doesn't exist: ${username}`);

        delete user.password;
        return user;
    }

    /** delete a user by username
     *
     * throws notfounderror if user not found
     */
    static async remove(username) {
        const result = await db.query(
            `DELETE FROM users
             WHERE username = $1
             RETURNING username`,
            [username]
        );

        if (!result.rows[0]) throw new NotFoundError(`User doesn't exist: ${username}`);
    }

    /** find matches for a user based on their mbti compatibility
     *
     * returns: [{ username, firstName, lastName, email, location, birthDate, mbti, profilePic }, ...]
     *
     * throws notfounderror if user not found
     */
    static async findMatches(username) {
        const result = await db.query(
            `SELECT mbti
             FROM users
             WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) throw new NotFoundError(`User doesn't exist: ${username}`);
        if (!user.mbti) throw new BadRequestError("User's mbti type has not been set");

        // get compatible mbti types from utils helper function
        const compatibleTypes = getCompatibilityTypes(user.mbti);

        // query for all compatible users (excluding current logged-in user)
        const match_result = await db.query(
            `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    birth_date AS "birthDate",
                    location,
                    bio,
                    profile_pic AS "profilePic",
                    latitude,
                    longitude,
                    mbti
             FROM users
             WHERE mbti = ANY ($1) AND username != $2`,
            [compatibleTypes, username]
        );

        // format the birthDate to 'yyyy-mm-dd'
        const matches = match_result.rows.map(user => ({
            ...user,
            birthDate: this.formatDateToISO(user.birthDate)
        }));

        return matches;
    }
}

module.exports = User;
