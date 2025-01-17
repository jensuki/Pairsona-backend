'use strict';

/** common setup funcs and test data for testing routes */

const bcrypt = require('bcrypt');
const db = require('../config/db');
const { createToken } = require('../helpers/token');
const { BCRYPT_WORK_FACTOR } = require('../config/config');
// const { geocodeLocation } = require('../utils/geocode');
const User = require('../models/User');

// tokens for auth tests
let user1Token, user2Token, user3Token, adminToken;

// user id's to use in connections + messages
let user1Id, user2Id, user3Id, adminId;

// func to run before all tests
const commonBeforeAll = async () => {

    //connect explicitly for tests
    await db.connect();

    // clean up all tables to make sure all test cases operate on fresh data
    await db.query('TRUNCATE TABLE matches, messages, users RESTART IDENTITY CASCADE');


    // manually include lat and lng or ny, los angeles to prevent api calls
    const user1Location = { latitude: 40.7128, longitude: -74.0060 };
    const user2Location = { latitude: 34.0522, longitude: -118.2437 };
    const user3Location = { latitude: 34.0522, longitude: -118.2437 };


    // register user1
    const hashedPassword1 = await bcrypt.hash('password1', BCRYPT_WORK_FACTOR);
    const user1 = await User.register({
        username: 'user1',
        password: 'password1',
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
        birthDate: '1990-01-01',
        location: 'New York',
        bio: 'Bio for User One',
        profilePic: 'https://example.com/pic1.jpg',
        latitude: user1Location.latitude,
        longitude: user1Location.longitude,
        mbti: null, // mbti not set during registration
        isAdmin: false
    });

    user1Id = user1.id;
    user1Token = createToken({ id: user1.id, username: user1.username, isAdmin: false });

    // register user2 without MBTI
    const hashedPassword2 = await bcrypt.hash('password2', BCRYPT_WORK_FACTOR);
    const user2 = await User.register({
        username: 'user2',
        password: 'password2',
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@example.com',
        birthDate: '1992-02-02',
        location: 'Los Angeles',
        bio: 'Bio for User Two',
        profilePic: 'https://example.com/pic2.jpg',
        latitude: user2Location.latitude,
        longitude: user2Location.longitude,
        mbti: null, // mbti not set during registration
        isAdmin: false
    });

    user2Id = user2.id;
    user2Token = createToken({ id: user2.id, username: user2.username, isAdmin: false });

    // register user3 without MBTI
    const hashedPassword3 = await bcrypt.hash('password3', BCRYPT_WORK_FACTOR);
    const user3 = await User.register({
        username: 'user3',
        password: 'password3',
        firstName: 'User',
        lastName: 'Three',
        email: 'user3@example.com',
        birthDate: '1992-03-03',
        location: 'Los Angeles',
        bio: 'Bio for User Three',
        profilePic: 'https://example.com/pic3.jpg',
        latitude: user3Location.latitude,
        longitude: user3Location.longitude,
        mbti: null, // mbti not set during registration
        isAdmin: false
    });

    user3Id = user3.id;
    user3Token = createToken({ id: user3.id, username: user3.username, isAdmin: false });

    // register admin user with MBTI
    const hashedAdminPassword = await bcrypt.hash('adminpassword', BCRYPT_WORK_FACTOR);
    const admin = await User.register({
        username: 'admin',
        password: 'adminpassword',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        birthDate: '1985-05-05',
        location: 'San Francisco',
        bio: 'Bio for Admin',
        profilePic: 'https://example.com/admin.jpg',
        latitude: 37.7749,
        longitude: -122.4194,
        mbti: 'ENTJ',
        isAdmin: true
    });

    adminId = admin.id;
    adminToken = createToken({ id: admin.id, username: admin.username, isAdmin: true });

    // manually assign MBTI for specific users after registration (to mimic quiz completion)
    await User.update('user1', { mbti: 'INTJ' });
    await User.update('user2', { mbti: 'ENFP' });
    await User.update('user3', { mbti: 'ENFP' });
    await User.update('admin', { mbti: 'ESTJ' });
};

// func to run before each test
const commonBeforeEach = async () => {
    await db.query('BEGIN');
};

// func to run after each test
const commonAfterEach = async () => {
    await db.query('ROLLBACK');
};

// func to run after all tests
const commonAfterAll = async () => {
    await db.end();
};

module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    user1Token,
    user2Token,
    user3Token,
    adminToken,
    getUserTokens: () => ({ user1Token, user2Token, user3Token, adminToken }), // for dynamic token retrieval
    getUserIds: () => ({ user1Id, user2Id, user3Id, adminId }) // func to dynamically get user ids in tests
};
