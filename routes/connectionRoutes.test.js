'use strict';

/** tests for connection routes */

jest.mock('../utils/geocode', () => require('../models/mocks/mockGeocode'));

const request = require('supertest');
const app = require('../app');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getUserTokens,
    getUserIds
} = require('../tests/_testCommon');
const Connection = require('../models/Connection');

// Set up teardown
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// use spyon for all routes to validate the methods and mock behavior?
jest.spyOn(Connection, 'sendConnectionRequest');
jest.spyOn(Connection, 'acceptConnectionRequest');
jest.spyOn(Connection, 'cancelConnectionRequest');
jest.spyOn(Connection, 'getPendingRequests');
jest.spyOn(Connection, 'getSentRequests');
jest.spyOn(Connection, 'declineConnectionRequest');
jest.spyOn(Connection, 'markRequestAsRead');
jest.spyOn(Connection, 'getConfirmedConnections');
jest.spyOn(Connection, 'removeConnection');

describe('POST /connections/:username/connect', () => {
    test('successfully sends a connection request to a matched user', async () => {
        const { user1Token } = getUserTokens();

        const res = await request(app)
            .post('/connections/user2/connect') // send connect request to user2 who is a match
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(201); // created connection
        expect(res.body.message).toBe('Connection request sent to user2');
        // ensure both connected user id's were called
        expect(Connection.sendConnectionRequest).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    });

    test('fails when unauthorized', async () => {
        const res = await request(app)
            .post('/connections/user2/connect')
        // no token / matched user
        expect(res.statusCode).toBe(401);
    })
});

describe('POST /connections/:connectionId/accept', () => {
    test('accepts a connection request', async () => {
        const { user2Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // create a connection request from user1 to user2
        const connection = await Connection.sendConnectionRequest(user1Id, user2Id);


        // user2 accepts the connection request
        const res = await request(app)
            .post(`/connections/${connection.id}/accept`)
            .set('Authorization', `Bearer ${user2Token}`);


        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('You are now connected with user1');
        expect(Connection.acceptConnectionRequest).toHaveBeenCalledWith(connection.id, user2Id);

        // verify that user2's connection to user1 is stored in the db
        const confirmedConnections = await Connection.getConfirmedConnections(user2Id);

        expect(confirmedConnections).toContainEqual(
            expect.objectContaining({ // ensure this it contains this along with the other fields
                username: 'user1',
            })
        );
    });
});

describe('DELETE /connections/:connectionId/cancel-request', () => {
    test('sender cancels their connection request to another user', async () => {
        const { user3Token } = getUserTokens();
        const { user1Id, user3Id } = getUserIds();

        // user3 sends a connectino request to user1
        const connection = await Connection.sendConnectionRequest(user3Id, user1Id);

        const res = await request(app)
            .delete(`/connections/${connection.id}/cancel-request`)
            .set('Authorization', `Bearer ${user3Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: 'Connection request successfully cancelled' });

        // ensure the pending connection is no longer in the db
        const pendingConnections = await Connection.getPendingRequests(user1Id);
        expect(pendingConnections).not.toContainEqual(
            expect.objectContaining({ id: connection.id }) // ensure no connection id present
        )

    })
});

describe('GET /connections/pending-requests', () => {
    test('get pending requests for the logged in user', async () => {

        const { user1Token, user2Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // user2 sends a connection request to user1
        await Connection.sendConnectionRequest(user2Id, user1Id);

        // user1 retrieves their pending requests
        const res = await request(app)
            .get('/connections/pending-requests')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.requests).toBeInstanceOf(Array)
        expect(res.body.requests[0]).toEqual({ // ensure these fields are present
            userId: expect.any(Number),
            username: expect.any(String),
            firstName: 'User',
            lastName: 'Two',
            profilePic: expect.any(String),
            isRead: false, // remove before deploy
            connectionId: expect.any(Number)
        })
    })
    test('returns an empty list if no pending requests', async () => {
        const { user3Token } = getUserTokens();

        // user3 retrieves their pending requests (none expected)
        const res = await request(app)
            .get('/connections/pending-requests')
            .set('Authorization', `Bearer ${user3Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.requests).toBeInstanceOf(Array);
        expect(res.body.requests).toHaveLength(0); // no pending requests
    });
})

describe('GET /connections/sent-requests', () => {
    test('successfully fetches sent requests for the logged-in user', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // simulate user1 sending a connection request to user2
        await Connection.sendConnectionRequest(user1Id, user2Id);

        const res = await request(app)
            .get('/connections/sent-requests')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toContainEqual(
            expect.objectContaining({
                username: 'user2',
                firstName: 'User',
                lastName: 'Two',
            })
        )
    })
})

describe('DELETE /connections/:connectionId/decline-request', () => {
    test('receiver successfull declines a received request', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user3Id } = getUserIds();

        // user3 sends connection request to user1
        const connection = await Connection.sendConnectionRequest(user3Id, user1Id);

        const res = await request(app)
            .delete(`/connections/${connection.id}/decline-request`) // user1 declined request

            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);

        // ensure the connection request is no longer in the db
        const pendingConnections = await Connection.getPendingRequests(user1Id);
        expect(pendingConnections).not.toContainEqual(
            expect.objectContaining({ id: connection.id }) // ensure no connection id present
        )
    })
})

describe('PATCH /connections/requests/read', () => {
    test('successfully marks all requests as read', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id, user3Id } = getUserIds();

        // simulate multiple connection requests sent to user1
        await Connection.sendConnectionRequest(user2Id, user1Id);
        await Connection.sendConnectionRequest(user3Id, user1Id);

        // user1 marks all their pending requests as read
        const res = await request(app)
            .patch('/connections/requests/read')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Requests marked as read');

        // verify in the database that all requests are marked as read
        const pendingRequests = await Connection.getPendingRequests(user1Id);

        pendingRequests.forEach((request) => {
            expect(request.isRead).toBe(true); // ensure the is_read flag is true for all requests
        });
    });
});

describe('GET /connections', () => {
    test('successfully gets all confirmed connections for logged in user', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id, user3Id } = getUserIds();

        // multiple connection requests sent to user1
        const connection1 = await Connection.sendConnectionRequest(user2Id, user1Id);
        const connection2 = await Connection.sendConnectionRequest(user3Id, user1Id);

        // user1 accepts both requests
        await Connection.acceptConnectionRequest(connection1.id, user1Id);
        await Connection.acceptConnectionRequest(connection2.id, user1Id);

        // fetch all confirmed connections for user1
        const res = await request(app)
            .get('/connections')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.connections).toBeInstanceOf(Array);
        // verify that user2 and user3 are in the confirmed connections
        expect(res.body.connections).toContainEqual(
            expect.objectContaining({
                username: 'user2',
                firstName: 'User',
                lastName: 'Two',
            })
        );

        expect(res.body.connections).toContainEqual(
            expect.objectContaining({
                username: 'user3',
                firstName: 'User',
                lastName: 'Three',
            })
        );
    });
});

describe('DELETE /connections/:connectionId/disconnect', () => {
    test('successfully removes a confirmed connection between two users', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // user2 sends a connection request to User1
        const connection = await Connection.sendConnectionRequest(user2Id, user1Id);

        // user1 accepts the connection request
        await Connection.acceptConnectionRequest(connection.id, user1Id);

        // confirm the connection exists
        const confirmedConnections = await Connection.getConfirmedConnections(user1Id);

        // user1 removes the confirmed connection
        const res = await request(app)
            .delete(`/connections/${connection.id}/disconnect`)
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Connection and associated messages successfully removed');

        // verify the connection is no longer in the database
        const remainingConnections = await Connection.getConfirmedConnections(user1Id);

        expect(remainingConnections).not.toContainEqual(
            expect.objectContaining({ id: connection.id }) // ensure no connection id
        );
    });
});
