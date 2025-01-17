/** seed script for inserting / resetting connections and messages */

const bcrypt = require('bcrypt');
const db = require('../config/db'); // uncomment when test db pool removed
const { BCRYPT_WORK_FACTOR } = require('../config/config');


const seedTestUsers = async () => {
    try {
        console.log('Starting the database transaction...');
        await db.query('BEGIN') // start transaction

        console.log('Deleting existing test user data...');

        // delete existing connections + messages for test users
        await db.query(
            `DELETE FROM messages
             WHERE sender_id IN (
                SELECT id
                FROM users
                WHERE username IN ('testuser1', 'testuser2')
            ) OR recipient_id IN (
                SELECT id
                FROM users
                WHERE username IN ('testuser1', 'testuser2')
            )`);

        // delete testusers from the matches table
        await db.query(
            `DELETE FROM matches
             WHERE user1_id IN (
                SELECT id
                FROM users
                WHERE username IN ('testuser1', 'testuser2')
            ) OR user2_id IN (
                SELECT id
                FROM users
                WHERE username IN ('testuser1', 'testuser2')
            )`);

        // delete the existing testusers
        await db.query(
            `DELETE FROM users
             WHERE username
             IN ('testuser1', 'testuser2')`);


        console.log('Inserting fresh test user data...');

        // define both test users
        const testUsers = [
            {
                username: 'testuser1',
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'UserOne',
                email: 'testuser1@example.com',
                birthDate: '1990-01-01',
                location: 'New York, NY',
                bio: 'I am test user 1.',
                mbti: 'ISFJ',
                latitude: 40.7128,
                longitude: -74.0060
            },
            {
                username: 'testuser2',
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'UserTwo',
                email: 'testuser2@example.com',
                birthDate: '1992-02-02',
                location: 'Los Angeles, CA',
                bio: 'I am test user 2.',
                mbti: 'ESFP',
                latitude: 34.0522,
                longitude: -118.2437
            },
        ];

        // insert test users to db
        for (let user of testUsers) {
            const hashedPassword = await bcrypt.hash(user.password, BCRYPT_WORK_FACTOR);
            await db.query(
                `INSERT INTO users (
                    username,
                    password,
                    first_name,
                    last_name,
                    email,
                    birth_date,
                    location,
                    bio,
                    mbti,
                    latitude,
                    longitude
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    user.username,
                    hashedPassword,
                    user.firstName,
                    user.lastName,
                    user.email,
                    user.birthDate,
                    user.location,
                    user.bio,
                    user.mbti,
                    user.latitude,
                    user.longitude
                ]
            );
        }

        await db.query('COMMIT'); // commit transaction
        console.log('Fresh test users seeded successfully');
    } catch (err) {
        await db.query('ROLLBACK'); // rollback if error
        console.error('Error seeding test users', err);
    } finally {
        try {
            console.log('Closing database connection...');
            await db.end(); // close the connection
            console.log('Database connection closed.');
            process.exit(0); // exit the process successfully
        } catch (err) {
            console.error('Error closing database connection:', err);
            process.exit(1); // exit with failure if an error occurs
        }
    }
};

seedTestUsers();