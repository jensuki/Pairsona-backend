'use strict';

/** connections model */

const db = require('../config/db');
const { NotFoundError, BadRequestError } = require('../config/expressError');

class Connection {
    /** connection requests between 2 users
     *
     * @param {number} fromUserId - id of user sending request
     * @param {number} toUserId - id of user receiving request
     * @returns {object} - success message
     *
     * on conflict do nothing = ensure no duplicate connections are inserted
    */
    static async sendConnectionRequest(fromUserId, toUserId) {
        const result = await db.query(
            `INSERT INTO matches (user1_id, user2_id, is_pending, is_accepted)
             VALUES ($1, $2, TRUE, FALSE)
             ON CONFLICT (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
             DO UPDATE SET is_pending = TRUE, is_accepted = FALSE
             RETURNING id`,
            [fromUserId, toUserId]
        );

        if (!result.rows.length) {
            throw new BadRequestError('Connection request already exists or could not be created');
        }

        return result.rows[0]; // return connection id
    }

    /** accept a connection request
     *
     * @param {number} connectionId - id of the connection
     * @param {number} receiverId - id of the user accepting the request
     * @returns {object} - updated connection details
    */
    static async acceptConnectionRequest(connectionId, receiverId) {

        const result = await db.query(
            `UPDATE matches
             SET is_pending = FALSE, is_accepted = TRUE, is_read = TRUE
             WHERE id = $1
               AND is_pending = TRUE
               AND user2_id = $2
             RETURNING id, user1_id, user2_id, is_pending, is_accepted, is_read`,
            [connectionId, receiverId]
        );

        if (!result.rows.length) {
            throw new NotFoundError('Connection request not found or already processed');
        }

        return result.rows[0];
    }

    /** decline a connection request
     *
     * @param {number} connectionId - id of the connection
     * @param {number} currUserId - id of the user declining the request
     * @returns {object} - success message
    */
    static async declineConnectionRequest(connectionId, currUserId) {
        const result = await db.query(
            `DELETE FROM matches
             WHERE id = $1
               AND user2_id = $2
               AND is_pending = TRUE
             RETURNING id`,
            [connectionId, currUserId]
        );

        if (!result.rows.length) {
            throw new NotFoundError('No pending request to decline or unauthorized');
        }

        return { message: 'Connection request successfully declined' };
    }

    /** cancel a connection request
     *
     * @param {number} connectionId - id of the connection
     * @param {number} senderId - id of the user canceling the request
     * @returns {object} - success message
    */
    static async cancelConnectionRequest(connectionId, senderId) {

        const query = `
            DELETE FROM matches
                WHERE id = $1
                AND is_pending = TRUE
                AND user1_id = $2
            RETURNING id`;

        // define conn id and senders user id
        const queryParams = [connectionId, senderId];

        // execute query
        const result = await db.query(query, queryParams);

        if (!result.rows.length) {
            throw new NotFoundError("No pending request to cancel or unauthorized");
        }
        // else
        return { message: "Connection request successfully cancelled" };
    }

    /** get pending requests received by the user
     *
     * @param {number} userId - id of the user retrieving their pending requests
     * @returns {Array} - list of pending requests
    */
    static async getPendingRequests(userId) {
        const result = await db.query(
            `SELECT m.id AS "connectionId",
                    u.id AS "userId",
                    u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    u.profile_pic AS "profilePic",
                    m.is_read AS "isRead"
             FROM matches m
             JOIN users u ON m.user1_id = u.id
             WHERE m.user2_id = $1 AND m.is_pending = TRUE`,
            [userId]
        );

        return result.rows;
    }

    /** get pending requests sent by the user
     *
     * @param {number} userId - id of the user retrieving their sent requests
     * @returns {Array} - list of sent requests
    */
    static async getSentRequests(userId) {
        const result = await db.query(
            `SELECT m.id AS "connectionId",
                u.id AS "userId",
                u.username,
                u.first_name AS "firstName",
                u.last_name AS "lastName",
                u.profile_pic AS "profilePic"
         FROM matches m
         JOIN users u ON m.user2_id = u.id
         WHERE m.user1_id = $1 AND m.is_pending = TRUE`,
            [userId]
        );
        // console.log("getSentRequests Query Result:", result.rows);

        return result.rows;
    }
    /** mark connection requests as read
     *
     * @param {number} userId - id of the user marking requests as read
     * @returns {object} - success message
    */
    static async markRequestAsRead(userId) {
        const result = await db.query(
            `UPDATE matches
             SET is_read = TRUE
             WHERE user2_id = $1 AND is_pending = TRUE
             RETURNING id`,
            [userId]
        );

        if (!result.rows.length) {
            throw new NotFoundError('No unread requests found');
        }

        return { message: 'Requests marked as read' };
    }

    /** get confirmed connections for a user
     *
     * @param {number} userId - id of the user retrieving their confirmed connections
     * @returns {Array} - list of confirmed connections
    */
    static async getConfirmedConnections(userId) {
        const result = await db.query(
            `SELECT m.id AS "connectionId",
                    u.id AS "userId",
                    u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    u.profile_pic AS "profilePic",
                    u.mbti
             FROM matches m
             JOIN users u ON (m.user1_id = u.id OR m.user2_id = u.id)
             WHERE (m.user1_id = $1 OR m.user2_id = $1)
             AND m.is_pending = FALSE
             AND m.is_accepted = TRUE
             AND u.id != $1`,
            [userId]
        );

        return result.rows;
    }

    /** remove a confirmed connection
     *
     * @param {number} connectionId - id of the connection to remove
     * @param {number} currUserId - id of the user removing the connection
     * @returns {object} - success message
    */
    static async removeConnection(connectionId, currUserId) {
        // fetch users associated with the connection
        const connectionResult = await db.query(
            `SELECT user1_id, user2_id
             FROM matches
             WHERE id = $1
             AND is_accepted = TRUE`,
            [connectionId]
        );

        if (!connectionResult.rows.length) {
            throw new NotFoundError('Connection not found');
        }

        const { user1_id: userId1, user2_id: userId2 } = connectionResult.rows[0];

        // ensure the curr user is part of the connection
        if (currUserId !== userId1 && currUserId !== userId2) {
            throw new NotFoundError('Unauthorized action');
        }

        // delete the connection
        const result = await db.query(
            `DELETE FROM matches
             WHERE id = $1
             RETURNING id`,
            [connectionId]
        );

        if (!result.rows.length) {
            throw new NotFoundError('Connection not found');
        }

        // also delete associated messages
        await db.query(
            `DELETE FROM messages
             WHERE (sender_id = $1 AND recipient_id = $2)
             OR (sender_id = $2 AND recipient_id = $1)`,
            [userId1, userId2]
        );

        return { message: 'Connection and associated messages successfully removed' };
    }
}

module.exports = Connection;
