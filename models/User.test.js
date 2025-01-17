'use strict';

/** tests for user model */

// import mock location data to prevent real api calls
jest.mock('../utils/geocode', () => require('./mocks/mockGeocode'));

// define imports after mock
const db = require('../config/db');
const User = require('./User');
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require('../config/expressError');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require('../tests/_testCommon');

// set up and tear down
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(() => {
    commonAfterAll();

});


/** user.register */
describe('register', () => {
    test('successfully registers a new user', async () => {
        const newUser = await User.register({
            username: 'newuser',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
            email: 'newuser@example.com',
            birthDate: '1995-05-05',
            location: 'New York',
            bio: 'This is a test bio.',
            profilePic: 'https://example.com/pic.jpg',
            isAdmin: false,
        });

        expect(newUser).toEqual({
            id: expect.any(Number), // account for id
            username: 'newuser',
            firstName: 'New',
            lastName: 'User',
            email: 'newuser@example.com',
            birthDate: '1995-05-05',
            location: 'New York',
            bio: 'This is a test bio.',
            profilePic: 'https://example.com/pic.jpg',
            latitude: expect.any(Number),
            longitude: expect.any(Number),
            isAdmin: false,
        });
    });

    test('throws BadRequestError on duplicate username', async () => {
        await expect(
            User.register({
                username: 'user1',
                password: 'password123',
                firstName: 'Duplicate',
                lastName: 'User',
                email: 'duplicate@example.com',
                birthDate: '1990-01-01',
                location: 'New York',
                bio: 'Duplicate bio.',
                profilePic: 'https://example.com/duplicate.jpg',
                isAdmin: false,
            })
        ).rejects.toThrow(BadRequestError);
    });
});

/** user.authenticate */
describe('authenticate', () => {
    test('successfully authenticates with valid credentials', async () => {
        const user = await User.authenticate('user1', 'password1');
        expect(user).toEqual({
            id: expect.any(Number),
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
            email: 'user1@example.com',
            isAdmin: false,
        });
    });

    test('throws UnauthorizedError with invalid username', async () => {
        await expect(User.authenticate('invaliduser', 'password1')).rejects.toThrow(
            UnauthorizedError
        );
    });

    test('throws UnauthorizedError with incorrect password', async () => {
        await expect(User.authenticate('user1', 'wrongpassword')).rejects.toThrow(
            UnauthorizedError
        );
    });
});

/** user.get */
describe('get', () => {
    test('successfully retrieves user by username', async () => {
        const user = await User.get('user1');
        expect(user).toEqual({
            id: expect.any(Number),
            username: 'user1',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
            birthDate: '1990-01-01',
            location: 'New York',
            bio: 'Bio for User One', // optional
            profilePic: expect.any(String) || null, // optional
            latitude: expect.any(Number),
            longitude: expect.any(Number),
            mbti: 'INTJ', // since we manually set mbti in commonbeforeall (mimic quiz completion)
            isAdmin: false,
            mbtiDetails: {
                title: "The Visionary or Architect",
                description:
                    "Architects are imaginative and strategic thinkers, with a plan for everything.",
                percentage: "2.1%",
                site: "https://www.16personalities.com/intj-personality",
            }
        });
    });

    test('throws NotFoundError if user not found', async () => {
        await expect(User.get('nonexistent')).rejects.toThrow(NotFoundError);
    });
});

/** user.update */
describe('update', () => {
    test('successfully updates user data', async () => {
        const updatedUser = await User.update('user1', {
            firstName: 'Updated',
            lastName: 'Name',
            location: 'Los Angeles',
            profilePic: 'https://example.com/updated-pic.jpg'
        });

        expect(updatedUser).toEqual({
            username: 'user1',
            firstName: 'Updated',
            lastName: 'Name',
            location: 'Los Angeles',
            latitude: expect.any(Number),
            longitude: expect.any(Number),
            bio: 'Bio for User One',
            profilePic: 'https://example.com/updated-pic.jpg'
        });
    });

    test('throws NotFoundError if user does not exist', async () => {
        await expect(User.update('nonexistent', { firstName: 'Test' })).rejects.toThrow(
            NotFoundError
        );
    });

    test('throws BadRequestError if no data provided', async () => {
        await expect(User.update('user1', {})).rejects.toThrow(BadRequestError);
    });
});

/** user.remove */
describe('remove', () => {
    test('successfully deletes user by username', async () => {
        await User.remove('user1');
        await expect(User.get('user1')).rejects.toThrow(NotFoundError);
    });

    test('throws NotFoundError if user does not exist', async () => {
        await expect(User.remove('nonexistent')).rejects.toThrow(NotFoundError);
    });
});

/** user.findMatches */
describe('findMatches', () => {
    // ensure user1 has an mbti set before running the tests
    beforeAll(async () => {
        await User.update('user1', { mbti: 'INTJ' });
    });

    test('successfully finds compatible matches for a user', async () => {
        const matches = await User.findMatches('user1');

        // include both user2 and user3 since they are compatible with user1's MBTI (INTJ)
        expect(matches).toEqual([
            {
                username: 'user2',
                firstName: 'User',
                lastName: 'Two',
                email: 'user2@example.com',
                birthDate: '1992-02-02',
                location: 'Los Angeles',
                bio: 'Bio for User Two',
                profilePic: 'https://example.com/pic2.jpg',
                latitude: expect.any(Number),
                longitude: expect.any(Number),
                mbti: 'ENFP',
            },
            {
                username: 'user3',
                firstName: 'User',
                lastName: 'Three',
                email: 'user3@example.com',
                birthDate: '1992-03-03',
                location: 'Los Angeles',
                bio: 'Bio for User Three',
                profilePic: 'https://example.com/pic3.jpg',
                latitude: expect.any(Number),
                longitude: expect.any(Number),
                mbti: 'ENFP',
            }
        ]);
    });

    test('throws NotFoundError if user does not exist', async () => {
        await expect(User.findMatches('nonexistent')).rejects.toThrow(NotFoundError);
    });

    test('throws BadRequestError if user MBTI is not set', async () => {
        // ensure 'user3' has mbti set to null to trigger the error
        await User.update('user3', { mbti: null });
        await expect(User.findMatches('user3')).rejects.toThrow(BadRequestError);
    });
});
