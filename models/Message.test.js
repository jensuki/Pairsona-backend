'use strict';

/** tests for message model */

// import mock location data to prevent real api calls
jest.mock('../utils/geocode', () => require('./mocks/mockGeocode'));


const db = require('../config/db');
const Message = require('./Message');
const { BadRequestError } = require('../config/expressError');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getUserIds,
} = require('../tests/_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** sendMessage */
describe('sendMessage', () => {
    test('successfully sends a message', async () => {
        const { user1Id, user2Id } = getUserIds();

        const content = 'Hello, how are you?';

        // send a message from user1 to user2
        const message = await Message.sendMessage(user1Id, user2Id, content);

        expect(message).toEqual(expect.objectContaining({
            id: expect.any(Number),
            sender_id: user1Id,
            recipient_id: user2Id,
            content: content,
            created_at: expect.any(Date),
        }));
    });

    test('throws BadRequestError if content is empty', async () => {
        const { user1Id, user2Id } = getUserIds();

        await expect(Message.sendMessage(user1Id, user2Id, ''))
            .rejects.toThrow(BadRequestError);
    });
});

/** getMessagesBetweenUsers */
describe('getMessagesBetweenUsers', () => {
    test('retrieves message history between two users', async () => {
        const { user1Id, user2Id } = getUserIds();

        await Message.sendMessage(user1Id, user2Id, 'Hello!');
        await Message.sendMessage(user2Id, user1Id, 'Hi there!');

        // retrieve message history
        const messages = await Message.getMessagesBetweenUsers(user1Id, user2Id);

        expect(messages.length).toBe(2);
        expect(messages[0]).toHaveProperty('content', 'Hello!');
        expect(messages[1]).toHaveProperty('content', 'Hi there!');
    });
});

/** getUnreadMessages */
describe('getUnreadMessages', () => {
    test('retrieves unread messages for a user', async () => {
        const { user1Id, user2Id } = getUserIds();

        // send first message
        await Message.sendMessage(user1Id, user2Id, 'Unread message 1');

        //send the second message
        await Message.sendMessage(user1Id, user2Id, 'Unread message 2');

        const unreadMessages = await Message.getUnreadMessages(user2Id);

        // sort messages by id to ensure consistent order
        unreadMessages.sort((a, b) => a.id - b.id);

        expect(unreadMessages.length).toBe(2);
        expect(unreadMessages[0]).toHaveProperty('content', 'Unread message 1');
        expect(unreadMessages[1]).toHaveProperty('content', 'Unread message 2');
    });
});

/** markMessageAsRead */
describe('markMessageAsRead', () => {
    test('successfully marks a message as read', async () => {
        const { user1Id, user2Id } = getUserIds();

        const message = await Message.sendMessage(user1Id, user2Id, 'Mark me as read');

        // mark the message as read
        await Message.markMessageAsRead(message.id);

        // check if the message is marked as read
        const result = await db.query(
            `SELECT is_read FROM messages WHERE id = $1`,
            [message.id]
        );

        expect(result.rows[0].is_read).toBe(true);
    });

    test('throws BadRequestError if message does not exist', async () => {
        await expect(Message.markMessageAsRead(9999)).rejects.toThrow(BadRequestError);
    });
});
