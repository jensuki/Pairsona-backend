'use strict';

/** db connection setup */

const { Client } = require('pg');
const { getDatabaseUri } = require('../config/config');

let db;

if (process.env.NODE_ENV === 'production') {
    db = new Client({
        connectionString: getDatabaseUri(),
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    db = new Client({
        connectionString: getDatabaseUri()
    });
}

// explicitly handle connection only in nontest environments
if (process.env.NODE_ENV !== 'test') {
    db.connect()
        .then(() => console.log('Connected to the DB successfully'))
        .catch(err => {
            console.error('DB connection failed', err.stack);
            process.exit(1);
        });
}

module.exports = db;