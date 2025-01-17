"use strict";

/** middleware tests with jest mock requests */

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../config/expressError");
const {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdmin,
    ensureCorrectUserOrAdmin,
} = require("./auth");

const { SECRET_KEY } = require("../config/config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrongkey");

describe("authenticateJWT", function () {
    test("sets user in res.locals for valid token", function () {
        // mock a request with a valid auth header
        const req = { headers: { authorization: `Bearer ${testJwt}` } };
        const res = { locals: {} };
        const next = jest.fn();
        authenticateJWT(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed

        // check that the user data is set in res.locals
        expect(res.locals).toEqual({
            user: {
                iat: expect.any(Number),
                username: "test",
                isAdmin: false,
            },
        });
    });

    test("leaves res.locals empty if no header is provided", function () {
        const req = {};
        const res = { locals: {} };
        const next = jest.fn();
        authenticateJWT(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed
        expect(res.locals).toEqual({}); // check that res.locals is empty
    });

    test("calls next with an error for invalid token", function () {
        const req = { headers: { authorization: `Bearer ${badJwt}` } };
        const res = { locals: {} };
        const next = jest.fn();
        authenticateJWT(req, res, next);
        // expect next to be called with the jsonwebtoken error
        expect(next).toHaveBeenCalledWith(expect.any(jwt.JsonWebTokenError));
        expect(res.locals).toEqual({}); // empty
    });
});

describe("ensureLoggedIn", function () {
    test("allows logged-in users", function () {
        // mock a response with a user in res.locals
        const req = {};
        const res = { locals: { user: { username: "test", is_admin: false } } };
        const next = jest.fn();
        ensureLoggedIn(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed
    });

    test("throws UnauthorizedError if not logged in", function () {
        // mock response with no user in res.locals
        const req = {};
        const res = { locals: {} };
        const next = jest.fn();
        ensureLoggedIn(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});

describe("ensureAdmin", function () {
    test("allows admin users", function () {
        const req = {};
        const res = { locals: { user: { username: "test", isAdmin: true } } };
        const next = jest.fn();
        ensureAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed
    });

    test("throws UnauthorizedError if not admin", function () {
        const req = {};
        const res = { locals: { user: { username: "test", isAdmin: false } } };
        const next = jest.fn();
        ensureAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    test("throws UnauthorizedError if anonymous", function () {
        const req = {};
        const res = { locals: {} };
        const next = jest.fn();
        ensureAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});

describe("ensureCorrectUserOrAdmin", function () {
    test("allows admin users", function () {
        const req = { params: { username: "test" } };
        const res = { locals: { user: { username: "admin", isAdmin: true } } };
        const next = jest.fn();
        ensureCorrectUserOrAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed
    });

    test("allows the correct user", function () {
        const req = { params: { username: "test" } };
        const res = { locals: { user: { username: "test", isAdmin: false } } };
        const next = jest.fn();
        ensureCorrectUserOrAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(); // ensures no error was passed
    });

    test("throws UnauthorizedError for mismatched user", function () {
        const req = { params: { username: "wrong" } };
        const res = { locals: { user: { username: "test", isAdmin: false } } };
        const next = jest.fn();
        ensureCorrectUserOrAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    test("throws UnauthorizedError for anonymous users", function () {
        const req = { params: { username: "test" } };
        const res = { locals: {} };
        const next = jest.fn();
        ensureCorrectUserOrAdmin(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
