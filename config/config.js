'use strict';

/** global configurations */

require('dotenv').config();
require('colors');

// environmental variables
const SECRET_KEY = process.env.SECRET_KEY || 's3cr3tk3y';
const PORT = process.env.PORT || 3001;

// get uri for test or production
const getDatabaseUri = () => {
    return (process.env.NODE_ENV === 'test')
        ? process.env.DATABASE_URL_TEST || 'postgresql:///pairsona_test'
        : process.env.DATABASE_URL || 'postgresql:///pairsona';
};

// less work factor in test db
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

console.log("Pairsona Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("Test Database URL:".yellow, process.env.DATABASE_URL_TEST);
console.log("-----------");
console.log("NODE_ENV:".yellow, process.env.NODE_ENV);
console.log("Using Database:".yellow, getDatabaseUri());

module.exports = {
    SECRET_KEY,
    PORT,
    BCRYPT_WORK_FACTOR,
    getDatabaseUri
}
