'use strict';

/** message model */

const db = require('../config/db');
const { BadRequestError } = require('../config/expressError');

class Message {

    /** send a message from 'sender' to 'recipient'
     *
     * returns: { id, sender_id, recipient_id, content, created_at}
    */
    static async sendMessage(senderId, recipientId, content) {

        if (!content) throw new BadRequestError('Message cannot be empty');

        const result = await db.query(
            `INSERT INTO messages (sender_id, recipient_id, content)
             VALUES ($1, $2, $3)
             RETURNING id,
                       sender_id,
                       recipient_id,
                       content,
                       created_at`,
            [senderId, recipientId, content]
        );

        return result.rows[0];
    }

    /** get all message history between two users with pagination
     *
     * returns: [{ id, sender_id, recipient_id, content, is_read, created_at }, ...]
     * display in ascending order
    */
    static async getMessagesBetweenUsers(userId1, userId2, limit = 10, offset = 0) {
        const result = await db.query(
            `SELECT id,
                    sender_id,
                    recipient_id,
                    content,
                    is_read,
                    created_at
                FROM messages
                WHERE (sender_id = $1 AND recipient_id = $2)
                OR (sender_id = $2 AND recipient_id = $1)
                ORDER BY created_at ASC
                LIMIT $3 OFFSET $4`,
            [userId1, userId2, limit, offset]
        );
        return result.rows;
    }

    /** get all 'unread' messages for a user
     *
     * returns: [{ id, sender_id, recipient_id, content, created_at, sender_username }, ...]
     * display in ascending order
    */
    static async getUnreadMessages(userId) {
        const result = await db.query(
            `SELECT m.id,
                    m.sender_id,
                    m.recipient_id,
                    m.content,
                    m.created_at,
                    u.username AS sender_username
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.recipient_id = $1 AND m.is_read = FALSE
                ORDER BY m.created_at ASC`,
            [userId]
        );
        return result.rows;
    }

    /** mark a message as read
     *
     * returns true if msg read status was updated, false if has already been read
     * throws BadRequestError if message doesn't exist
    */
    static async markMessageAsRead(messageId) {
        const result = await db.query(
            `UPDATE messages
             SET is_read = TRUE
             WHERE id = $1
             RETURNING id, is_read`,
            [messageId]
        );

        if (!result.rows.length) {
            throw new BadRequestError('Message not found');
        }
        // return true to indicate the msg status was updated
        return result.rows[0]
    }
}

module.exports = Message;