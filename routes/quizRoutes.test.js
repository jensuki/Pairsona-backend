'use strict';

/** tests for quiz routes */

jest.mock('../utils/geocode', () => require('../models/mocks/mockGeocode'));

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

describe('GET /quiz/questions', () => {
    test('retrieves all quiz questions for the logged-in user', async () => {
        const { user1Token } = getUserTokens();

        const res = await request(app)
            .get('/quiz/questions')
            .set('Authorization', `Bearer ${user1Token}`);

        // console.log('RESPONSE BODY:', JSON.stringify(res.body, null, 2))
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(30); // get all 30 questions
        expect(res.body[0]).toHaveProperty('options');
    });

    test('fails when unauthorized', async () => {
        // no token
        const res = await request(app).get('/quiz/questions');

        expect(res.statusCode).toBe(401);
        expect(res.body.error.message).toBe('User must be logged in');
    })
});

describe('POST /quiz/results', () => {
    test('successfully calculates and saves MBTI result for logged-in user', async () => {
        const { user1Token } = getUserTokens();

        // mock answers for all 30 questions
        const answers = {
            1: 'E', 2: 'S', 3: 'T', 4: 'J',
            5: 'E', 6: 'S', 7: 'T', 8: 'J',
            9: 'E', 10: 'S', 11: 'T', 12: 'J',
            13: 'E', 14: 'S', 15: 'T', 16: 'J',
            17: 'E', 18: 'S', 19: 'T', 20: 'J',
            21: 'E', 22: 'S', 23: 'T', 24: 'J',
            25: 'E', 26: 'S', 27: 'T', 28: 'J',
            29: 'E', 30: 'S'
        };

        const res = await request(app)
            .post('/quiz/results')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ answers })

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            type: 'ESTJ',
            title: 'The Executive',
            percentage: '8.7%',
            description: expect.any(String),
            site: expect.any(String)
        });

        // verify MBTI was saved into the users profile
        const updatedUser = await User.get('user1');
        expect(updatedUser.mbti).toBe('ESTJ')
    })

    test('handles incomplete answers gracefully', async () => {
        const { user1Token } = getUserTokens();

        // mock incomplete answers
        const answers = {
            1: 'E', 2: 'S', 3: 'T'
        };

        const res = await request(app)
            .post('/quiz/results')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ answers })

        expect(res.statusCode).toBe(400);
        expect(res.body.error.message).toBe('Incomplete answers submitted');
    });
})
