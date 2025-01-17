'use strict';

/** tests for user routes */

const { getDistance } = require('../utils/distance')
// import mocks
jest.mock('../utils/geocode', () => require('../models/mocks/mockGeocode'));
jest.mock('../utils/distance', () => ({
    getDistance: jest.fn()
}));


const request = require('supertest');
const app = require('../app');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getUserTokens
} = require('../tests/_testCommon');
const User = require('../models/User');
const db = require('../config/db');

// set up teardown
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe('PATCH /users/:username', () => {
    test('successfully updates a users profile', async () => {
        const { user1Token } = getUserTokens();

        const res = await request(app)
            .patch('/users/user1')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
                bio: 'Updated bio',
                location: 'Chicago'
            })

        expect(res.statusCode).toBe(200);
        // expect response of only fields that are allowed to be updated
        expect(res.body.user).toEqual({
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
            location: 'Chicago', // ensure location is updated
            bio: 'Updated bio', // ensure bio is updated
            profilePic: 'https://example.com/pic1.jpg',
            latitude: 41.8781, // updated lat
            longitude: -87.6298 // updated bio
        });
    })
})

describe('POST /users', () => {
    test('admin successfully creates a new user', async () => {
        const { adminToken } = getUserTokens();

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'newuser',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
                email: 'newuser@example.com',
                birthDate: '1995-05-05',
                location: 'Houston',
                bio: 'Bio for New User',
                isAdmin: false,
            });

        expect(res.statusCode).toBe(201);
    });
})

describe('GET /users', () => {
    test('retrieves all users as admin', async () => {
        const { adminToken } = getUserTokens();

        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.users).toHaveLength(4); // expect all four seeded test users
    })
})

describe('GET /users/:username', () => {
    test('retrieves user details as the correct user', async () => {
        const { user2Token } = getUserTokens();

        const res = await request(app)
            .get('/users/user2')
            .set('Authorization', `Bearer ${user2Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.username).toBe('user2')
    })
})

describe('GET /users/:username/profile', () => {
    test('retrieves profile for logged-in user', async () => {
        const { user3Token } = getUserTokens();

        const res = await request(app)
            .get('/users/user3/profile')
            .set('Authorization', `Bearer ${user3Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.username).toBe('user3');
        expect(res.body.user).toHaveProperty('email');
        expect(res.body.user).toHaveProperty('birthDate')
    })

    test('retrieves profile for a matched user', async () => {
        const { user3Token } = getUserTokens();

        const res = await request(app)
            .get('/users/user1/profile') // get user1's profile since they are a match in mbti compatibilty
            .set('Authorization', `Bearer ${user3Token}`); // with user3 token

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toHaveProperty('profilePic')
    })


});

describe('GET /users/:username/mbti', () => {
    test('successfully retrieves MBTI results for the user (self)', async () => {
        const { user1Token } = getUserTokens();

        const res = await request(app)
            .get('/users/user1/mbti')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        // expect the correct INTJ mbti details
        expect(res.body.mbtiDetails).toEqual({
            type: 'INTJ',
            title: 'The Visionary or Architect',
            percentage: '2.1%',
            description: 'Architects are imaginative and strategic thinkers, with a plan for everything.',
            site: 'https://www.16personalities.com/intj-personality'
        });
    });

    test('handles missing mbti gracefully', async () => {
        const { user3Token } = getUserTokens();

        // mock user3 to not have an mbti set
        jest.spyOn(User, 'get').mockResolvedValueOnce({
            username: 'user3',
            mbti: null
        });

        const res = await request(app)
            .get('/users/user3/mbti')
            .set('Authorization', `Bearer ${user3Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.mbtiDetails).toEqual({
            type: null,
            title: 'Unknown',
            percentage: 'N/A',
            description: 'No additional information available for this personality type',
            site: 'N/A'
        })
    })
})

describe('PATCH /users/:username/mbti', () => {
    test('updates mbti type for the correct user', async () => {
        const { user1Token } = getUserTokens();

        // simulate the mbti result being updated after quiz completion
        const res = await request(app)
            .patch('/users/user1/mbti')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ mbti: 'ENTJ' }) // updated mbti

        expect(res.statusCode).toBe(200);

        // check the response body for correct MBTI update + other allowed fields
        expect(res.body.user).toEqual({
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
            location: 'New York',
            latitude: 40.7128,
            longitude: -74.006,
            bio: 'Bio for User One',
            profilePic: 'https://example.com/pic1.jpg',
            mbti: 'ENTJ', // ensure MBTI is updated
        });
    })

    test('fails for unauthorized user', async () => {
        const { user2Token } = getUserTokens();

        const res = await request(app)
            .patch('/users/user1/mbti')
            .set('Authorization', `Bearer ${user2Token}`)
            .send({ mbti: 'ENTJ' });

        expect(res.statusCode).toBe(401);
    })
})
describe('GET /users/:username/matches', () => {
    test('retrieves compatible matches with distances', async () => {
        const { user1Token } = getUserTokens();

        // mock getDistance
        getDistance.mockImplementation((lat1, lon1, lat2, lon2) => {
            if (lat1 === 40.7128 && lon1 === -74.0060) {
                if (lat2 === 34.0522 && lon2 === -118.2437) return 3000; // ny to la
            }
            return 0; // default case
        });

        const res = await request(app)
            .get('/users/user1/matches')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        // chec that both user2 and user3 are in the compatible matches
        expect(res.body.matches).toEqual([
            expect.objectContaining({
                username: 'user2',
                firstName: 'User',
                lastName: 'Two',
                location: 'Los Angeles',
                distance: 3000,
                description: expect.any(String),
            }),
            expect.objectContaining({
                username: 'user3',
                firstName: 'User',
                lastName: 'Three',
                location: 'Los Angeles',
                distance: 3000,
                description: expect.any(String),
            })
        ]);
    });

    test('handles no matches found (incompatible mbti types)', async () => {
        const { user1Token } = getUserTokens();

        // mock user1 to have mbti type that doesn't have any matches
        jest.spyOn(User, 'get').mockResolvedValueOnce({
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
            location: 'New York',
            latitude: 40.7128,
            longitude: -74.0060,
            mbti: 'ISTP', // ISTP is compatible only with ESFJ and ENFJ, none of the test users
        });

        // mock findMatches to return an empty array
        jest.spyOn(User, 'findMatches').mockResolvedValueOnce([]);

        const res = await request(app)
            .get('/users/user1/matches')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.matches).toEqual([]); // no matches
    })
});

describe('DELETE /users/:username', () => {
    test('deletes a user as admin', async () => {
        const { adminToken } = getUserTokens();

        const res = await request(app)
            .delete('/users/user1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(204); // no content
    })

    test('regular user can delete their own account', async () => {
        const { user3Token } = getUserTokens();

        const res = await request(app)
            .delete('/users/user3')
            .set('Authorization', `Bearer ${user3Token}`);

        expect(res.statusCode).toBe(204); // no content
    })
})