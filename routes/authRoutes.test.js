'use strict';

/** tests for authentication routes */

// import mocks
jest.mock('../utils/geocode', () => require('../models/mocks/mockGeocode'));
jest.mock('../utils/supabase', () => require('./mocks/mockSupabase'));

const request = require('supertest');
const app = require('../app');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    getUserTokens
} = require('../tests/_testCommon');

// set up teardown
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe('POST /auth/register', () => {
    test('successfully register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .field('username', 'testuser')
            .field('password', 'password123')
            .field('firstName', 'Test')
            .field('lastName', 'User')
            .field('email', 'testuser@example.com')
            .field('birthDate', '1990-01-01')
            .field('location', 'New York')
            .attach('profilePic', Buffer.from('mocked-fake-image'), 'profile_pic.jpg'); // load fake image path

        expect(res.statusCode).toBe(201);
        // expect any string as the generated token
        expect(res.body).toEqual({
            token: expect.any(String)
        });
    });

    test('fails with invalid data', async () => {
        const res = await request(app)
            .post('/auth/register')
            .field('username', '')
            .field('password', 'password123')

        expect(res.statusCode).toBe(400);
    });

    test('fails when profile pic upload fails', async () => {
        const { uploadMock } = require('./mocks/mockSupabase'); // import the dynamic mock

        // override the upload mock to simulate a failure once
        uploadMock.mockImplementationOnce(() => {
            return {
                data: null,
                error: { message: 'Upload failed' }, // simulate failure
            };
        });

        const res = await request(app)
            .post('/auth/register')
            .field('username', 'testuser')
            .field('password', 'password123')
            .field('firstName', 'Test')
            .field('lastName', 'User')
            .field('email', 'testuser@example.com')
            .field('birthDate', '1990-01-01')
            .field('location', 'New York')
            .attach('profilePic', Buffer.from('mocked-fake-image'), 'profile_pic.jpg');

        expect(res.statusCode).toBe(400);
        expect(res.body.error.message).toBe('Error uploading profile image to supabase');
    });
})

describe('GET /auth/me', () => {
    test('retrieves user details for logged-in user', async () => {
        const { user1Token } = getUserTokens()// get token dynamically
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${user1Token}`); // set user1's token in header

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            user: {
                id: expect.any(Number),
                username: 'user1',
                firstName: 'User',
                lastName: 'One',
                email: 'user1@example.com',
                location: 'New York',
                birthDate: '1990-01-01',
                bio: 'Bio for User One',
                profilePic: 'https://example.com/pic1.jpg',
                latitude: 40.7128,
                longitude: -74.0060,
                isAdmin: false,
                mbti: 'INTJ',
                mbtiDetails: {
                    title: 'The Visionary or Architect',
                    description:
                        'Architects are imaginative and strategic thinkers, with a plan for everything.',
                    percentage: '2.1%',
                    site: 'https://www.16personalities.com/intj-personality',
                }, // include mbti details from api
            },
        });
    });


    test('fails for unauthorized user', async () => {
        const res = await request(app).get('/auth/me');
        // without token
        expect(res.statusCode).toBe(401);
        expect(res.body.error.message).toBe('Unauthorized');
    });
});