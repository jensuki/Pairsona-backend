'use strict';

/** tests for connection model */

// import mock location data to prevent real api calls
jest.mock('../utils/geocode', () => require('./mocks/mockGeocode'));


const db = require('../config/db');
const Connection = require('./Connection');
const { NotFoundError } = require('../config/expressError');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getUserIds,
} = require('../tests/_testCommon');

// set up teardown
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


let user1Id, user2Id, user3Id, connectionId;

beforeEach(async () => {
    // fetch user ids before each test helper
    ({ user1Id, user2Id, user3Id } = getUserIds());

    // initialize a connection request before each test
    const result = await Connection.sendConnectionRequest(user1Id, user2Id);
    connectionId = result.id; // store the connectionId
})

describe('sendConnectionRequest', () => {
    test('successfull sends a connection request', async () => {

        //verify connection request created in beforeeach
        expect(connectionId).toBeDefined();

        // verify request insertion into the db
        const checkDb = await db.query(
            `SELECT * FROM matches
             WHERE id = $1`,
            [connectionId]);

        expect(checkDb.rows.length).toBe(1);
        expect(checkDb.rows[0]).toHaveProperty('is_pending', true); // verify pending after a sent request
    });
});

describe('acceptConnectionRequest', () => {
    test('successfully accepts a pending connection request', async () => {

        // user2 accepted the connection request
        const accepted = await Connection.acceptConnectionRequest(connectionId, user2Id);

        expect(accepted).toHaveProperty('is_accepted', true)
        expect(accepted).toHaveProperty('is_pending', false)
    })
})

describe('cancelConnectionRequest', () => {
    test('sender successfully cancels a connection request', async () => {

        // user1 the sender cancels the connection request they sent
        const cancelled = await Connection.cancelConnectionRequest(connectionId, user1Id);

        expect(cancelled).toEqual({ message: 'Connection request successfully cancelled' });

        // verify removal from the db
        const checkDb = await db.query(
            `SELECT * FROM matches WHERE id = $1`,
            [connectionId]
        );
        expect(checkDb.rows.length).toBe(0); // ensure nothing
    })
})

describe('declineConnectionRequest', () => {
    test('receiver successfully declines a connection request', async () => {

        // user2 declines the connection request
        const declined = await Connection.declineConnectionRequest(connectionId, user2Id);

        expect(declined).toEqual({
            message: 'Connection request successfully declined'
        })

        // verify removal of pending request from the db
        const checkDb = await db.query(
            `SELECT * FROM matches
            WHERE id = $1`,
            [connectionId]
        );
        expect(checkDb.rows.length).toBe(0);
    })
})

describe('getPendingRequests', () => {
    test('current user successfully retrieves their pending connection requests', async () => {

        const pendingRequests = await Connection.getPendingRequests(user2Id);

        expect(pendingRequests.length).toBe(1);
        expect(pendingRequests[0]).toHaveProperty('username', 'user1');
    })
})

describe('getSentRequests', () => {
    test('retrieves pending connection requests sent by the user', async () => {

        const sentRequests = await Connection.getSentRequests(user1Id);

        expect(sentRequests.length).toBe(1);
        expect(sentRequests[0]).toHaveProperty('username', 'user2');
    })
})

describe('markRequestAsRead', () => {
    test('successfully marks a pending request as read', async () => {

        const result = await Connection.markRequestAsRead(user2Id);

        // verify response message
        expect(result).toEqual({
            message: 'Requests marked as read'
        });

        // check that the is_read column is updated in the db
        const checkDb = await db.query(
            `SELECT is_read
             FROM matches
             WHERE user1_id = $1
             AND user2_id = $2`,
            [user1Id, user2Id]
        );
        expect(checkDb.rows[0].is_read).toBe(true);
    })
})

describe('getConfirmedConnections', () => {
    test('successfully retrieves confirmed connections for a user', async () => {

        // user2 accepts
        await Connection.acceptConnectionRequest(connectionId, user2Id);

        // retrieve confirmed connectionsf or user1
        const connections = await Connection.getConfirmedConnections(user1Id);

        expect(connections.length).toBe(1);
        expect(connections[0]).toHaveProperty('username', 'user2');
        expect(connections[0]).toHaveProperty('firstName', 'User');
        expect(connections[0]).toHaveProperty('lastName', 'Two');
        expect(connections[0]).toHaveProperty('profilePic');
    })

    test('returns an empty array of the user has no confirmed connections', async () => {

        const connections = await Connection.getConfirmedConnections(user3Id);

        expect(connections).toEqual([])
    })
})

describe('removeConnection', () => {
    test('succesffully removes a connection between two users', async () => {

        // user2 accepts
        await Connection.acceptConnectionRequest(connectionId, user2Id);

        // remove connection from user1
        const removed = await Connection.removeConnection(connectionId, user1Id);

        expect(removed).toEqual({
            message: 'Connection and associated messages successfully removed'
        })

        // verify the connection no longer exists in the db
        const checkDb = await db.query(
            `SELECT * FROM matches WHERE id = $1`,
            [connectionId]
        );
        expect(checkDb.rows.length).toBe(0);
    })

    test('throws NotFoundError if the connection does not exist', async () => {

        // attempt to remove a nonexistent connection
        await expect(Connection.removeConnection(9999, user1Id)).rejects.toThrow(NotFoundError);
    })
})