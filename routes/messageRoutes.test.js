'use strict';

/** tests for message routes */

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
const Message = require('../models/Message')

// set up teardown
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe('POST /messages/:username', () => {
    test('successfully sends a message to a connected user', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // establish connection
        await Connection.sendConnectionRequest(user1Id, user2Id);
        await Connection.acceptConnectionRequest(1, user2Id); // assuming conn id = 1

        const res = await request(app)
            .post('/messages/user2') // send a message to user2
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ content: 'Hello, User2!' });

        expect(res.statusCode).toBe(201); // created
    });

    test('fails if user is not connected', async () => {
        const { user1Token } = getUserTokens();

        const res = await request(app)
            .post('/messages/user3') // no connection established with user3
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ content: 'Hello, User3!' });

        expect(res.statusCode).toBe(403);
    });
})

describe('GET /messages/unread', () => {
    test('retrieves all unread messages for the logged-in user', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // user2 sends 2 messages to user1
        await Message.sendMessage(user2Id, user1Id, 'Unread message 1');
        await Message.sendMessage(user2Id, user1Id, 'Unread message 2');

        const res = await request(app)
            .get('/messages/unread')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.messages).toHaveLength(2);
        expect(res.body.messages).toEqual(
            expect.arrayContaining([ // ensure both message content
                expect.objectContaining({ content: 'Unread message 1' }),
                expect.objectContaining({ content: 'Unread message 2' }),
            ])
        );
    });
});

describe('GET /messages/:username', () => {
    test('retrieves all message history between logged-in user and another user', async () => {
        const { user1Token } = getUserTokens();
        const { user1Id, user2Id } = getUserIds();

        // send messages to eachother user1 <-> user2
        await Message.sendMessage(user1Id, user2Id, 'Message from User1 to User2');
        await Message.sendMessage(user2Id, user1Id, 'Message from User2 to User1');

        const res = await request(app)
            .get('/messages/user2')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.messages).toHaveLength(2);
        expect(res.body.messages).toEqual(
            expect.arrayContaining([ // contains both messages in history
                expect.objectContaining({ content: 'Message from User1 to User2' }),
                expect.objectContaining({ content: 'Message from User2 to User1' }),
            ])
        );
    })
})