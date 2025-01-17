'use strict';

/** connection routes */

const express = require('express');
const {
    ensureLoggedIn,
    getUserIdFromUsername
} = require('../middleware/auth');
const { BadRequestError } = require('../config/expressError');
const User = require('../models/User');
const Connection = require('../models/Connection');

const router = new express.Router();

/** POST /connections/:username/connect
 *
 * send a connection request from the logged-in user to another user.
 * authorization required: logged in
 */
router.post('/:username/connect', ensureLoggedIn, getUserIdFromUsername, async (req, res, next) => {
    try {
        const fromUserId = res.locals.user.id; // curr user
        const toUserId = req.toUserId;

        // create connection request
        const connection = await Connection.sendConnectionRequest(fromUserId, toUserId);
        return res.status(201).json({
            message: `Connection request sent to ${req.params.username}`,
            data: connection
        });
    } catch (err) {
        return next(err);
    }
});

/** POST /connections/:connectionId/accept
 *
 * accept a connection request.
 * authorization required: logged in
 */
router.post('/:connectionId/accept', ensureLoggedIn, async (req, res, next) => {
    try {
        const receiverId = res.locals.user.id; // user accepting the request
        const connectionId = parseInt(req.params.connectionId, 10); // parse id as an integer

        // console.log("CONNECTION ID:", connectionId);
        // console.log("RECEIVER ID:", receiverId);

        // update status to 'accepted'
        const updatedConnection = await Connection.acceptConnectionRequest(connectionId, receiverId);

        // retrieve the sender's username by id
        const sender = await User.getById(updatedConnection.user1_id);

        return res.status(200).json({
            updatedConnection,
            message: `You are now connected with ${sender.username}`
        });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /connections/:connectionId/cancel-request
 *
 * cancel a pending connection request.
 * authorization required: logged in
 */
router.delete('/:connectionId/cancel-request', ensureLoggedIn, async (req, res, next) => {
    try {
        const senderId = res.locals.user.id; // user cancelling request
        const connectionId = parseInt(req.params.connectionId, 10);

        const { message } = await Connection.cancelConnectionRequest(connectionId, senderId);

        return res.status(200).json({ message });
    } catch (err) {
        return next(err);
    }
});

/** GET /connections/pending-requests
 *
 * get pending connection requests for the logged-in user.
 * authorization required: logged in
 */
router.get('/pending-requests', ensureLoggedIn, async (req, res, next) => {
    try {
        const userId = res.locals.user.id; // curr user id
        const pendingRequests = await Connection.getPendingRequests(userId);

        return res.status(200).json({ requests: pendingRequests });

    } catch (err) {
        return next(err);
    }
});

/** GET /connections/sent-requests
 *
 * Get sent requests for the logged-in user.
 * Authorization required: logged in
 */
router.get('/sent-requests', ensureLoggedIn, async (req, res, next) => {
    try {
        const userId = res.locals.user.id;
        const sentRequests = await Connection.getSentRequests(userId);

        return res.status(200).json({ data: sentRequests });
    } catch (err) {
        return next(err);
    }
});
/** DELETE /connections/:connectionId/decline-request
 *
 * decline a received connection request.
 * authorization required: logged in
 */
router.delete('/:connectionId/decline-request', ensureLoggedIn, async (req, res, next) => {
    try {
        const currUserId = res.locals.user.id;
        const connectionId = parseInt(req.params.connectionId, 10);

        // decline
        const result = await Connection.declineConnectionRequest(connectionId, currUserId);
        return res.status(200).json({ result });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /connections/requests/read
 *
 * mark all connection requests as read.
 * authorization required: logged in
 */
router.patch('/requests/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const userId = res.locals.user.id;
        await Connection.markRequestAsRead(userId);

        return res.status(200).json({ message: 'Requests marked as read' });
    } catch (err) {
        return next(err);
    }
});

/** GET /connections
 *
 * get all confirmed connections for the logged-in user.
 * authorization required: logged in
 */
router.get('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const userId = res.locals.user.id;

        const connections = await Connection.getConfirmedConnections(userId);

        return res.status(200).json({ connections });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /connections/:connectionId/disconnect
 *
 * remove a confirmed connection.
 * authorization required: logged in
 */
router.delete('/:connectionId/disconnect', ensureLoggedIn, async (req, res, next) => {
    try {
        const connectionId = parseInt(req.params.connectionId, 10);
        // validate id
        if (isNaN(connectionId)) {
            throw new BadRequestError('Invalid connection ID');
        }

        const userId = res.locals.user.id;

        const { message } = await Connection.removeConnection(connectionId, userId);

        return res.status(200).json({ message });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
