'use strict';

/** tests for creating a token helper func */

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/config');
const { createToken } = require('../helpers/token');

describe('createToken', () => {
    test('works as expected: not admin', () => {
        const token = createToken({ username: 'test', isAdmin: false });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            exp: expect.any(Number),
            username: 'test',
            isAdmin: false
        });
    });
    test('works as expected: for admin', () => {
        const token = createToken({ username: 'test', isAdmin: true });
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            exp: expect.any(Number),
            username: 'test',
            isAdmin: true
        });
    });
    test('defaults isAdmin to false if not provided', () => {
        const token = createToken({ username: 'test' }); // no isAdmin property
        const payload = jwt.verify(token, SECRET_KEY);
        expect(payload).toEqual({
            iat: expect.any(Number),
            exp: expect.any(Number),
            username: 'test',
            isAdmin: false
        });
    });
});
