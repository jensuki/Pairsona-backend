'use strict';

const express = require('express');
const { ensureLoggedIn, getUserIdFromUsername } = require('../middleware/auth');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const { ForbiddenError, BadRequestError } = require('../config/expressError');

const router = new express.Router();

/** POST /messages/:username
 *
 * send a message to a 'connected' user
 *
 * req.body: { content }
 * response: { message: { id, sender_id, recipient_id, content, created_at }}
 *
 * authorization required: logged in
*/

router.post('/:username', ensureLoggedIn, async (req, res, next) => {
    try {
        const senderId = res.locals.user.id;
        const recipientUsername = req.params.username;
        const { content } = req.body;

        if (!content) {
            throw new BadRequestError('Message cannot be empty');
        }

        // get recipients user id
        const recipient = await User.get(recipientUsername);
        const recipientId = recipient.id;

        // get all confirmed connections for the logged in user
        const connections = await Connection.getConfirmedConnections(senderId);

        // check if the recipient is in the list of confirmed connections
        const isConnected = connections.some(connection => connection.userId === recipientId);

        if (!isConnected) {
            throw new ForbiddenError('You can only send messages to connected users');
        }
        // if connected, send the message
        const message = await Message.sendMessage(senderId, recipientId, content);
        return res.status(201).json({ message });
    } catch (err) {
        return next(err);
    }
});

/** GET /messages/unread
 *
 * get all unread messages for the logged in user
 * response: { messages: [{ id, sender_id, recipient_id, content, created_at, sender_username }] }
 *
 * authorization required: logged in
 */

router.get('/unread', ensureLoggedIn, async (req, res, next) => {
    try {
        const userId = res.locals.user.id;
        const unreadMessages = await Message.getUnreadMessages(userId);

        return res.json({ messages: unreadMessages });
    } catch (err) {
        return next(err);
    }
});

/** GET /messages/:username
 *
 * retrieve all messages between the logged in user and specific connected user
 *
 * response: { messages: [{ id, sender_id, recipient_id, content, created_at }] }
 *
 * authorization required: logged in
 */

router.get('/:username', ensureLoggedIn, getUserIdFromUsername, async (req, res, next) => {
    try {
        const userId = res.locals.user.id;
        const otherUserId = req.toUserId;

        // get all messages between the users
        const messages = await Message.getMessagesBetweenUsers(userId, otherUserId);
        return res.json({ messages });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /messages/:id/read
 *
 * mark a message as read
 * response: { message: 'Message marked as read' }
 *
 * authorization required: logged in
 */

router.patch('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const messageId = req.params.id;
        await Message.markMessageAsRead(messageId);
        return res.json({ message: 'Message marked as read' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;