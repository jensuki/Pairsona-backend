/** test for the mbti quiz logic */

const { getQuestions, calculateResult } = require('../controllers/quizController');
const User = require('../models/User');
const questions = require('../data/questions.json');
const mbtiDetails = require('../data/mbti_details.json');
const { BadRequestError } = require('../config/expressError');

// mock dependencies
jest.mock('../models/User'); // mock user model to avoid interacting with db

describe('Quiz Controller', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear any mock calls after each test
    });

    describe('getQuestions', () => {
        test('should return the list of quiz questions', () => {
            // mock request + response objects
            const req = {};
            const res = { json: jest.fn() }; // mock the json response


            getQuestions(req, res);

            // verify that res.json was called with the questions data
            expect(res.json).toHaveBeenCalledWith(questions);
        });
    });


    describe('calculateResult', () => {
        test('should calculate the MBTI result and save it to the user profile', async () => {
            // Mock request and response objects
            const req = {
                body: {
                    answers: {
                        1: 'I', 2: 'S', 3: 'T', 4: 'J', // mock answers to 'ISTJ'
                        5: 'I', 6: 'S', 7: 'T', 8: 'J',
                        9: 'I', 10: 'S', 11: 'T', 12: 'J',
                        13: 'I', 14: 'S', 15: 'T', 16: 'J',
                        17: 'I', 18: 'S', 19: 'T', 20: 'J',
                        21: 'I', 22: 'S', 23: 'T', 24: 'J',
                        25: 'I', 26: 'S', 27: 'T', 28: 'J',
                        29: 'I', 30: 'S'
                    }
                },
                res: { locals: { user: { username: 'testuser' } } }, // simulate logged in testuser
            };

            const res = { json: jest.fn() }; // mock the respnse
            const next = jest.fn(); // mock next

            // calculate based on answers
            await calculateResult(req, res, next);

            const expectedResult = 'ISTJ';
            const expectedDetails = mbtiDetails[expectedResult];

            // verify that the result was saved to the testusers profile
            expect(User.update).toHaveBeenCalledWith('testuser', { mbti: expectedResult });

            // also verify correct mbti details
            expect(res.json).toHaveBeenCalledWith({
                type: expectedResult,
                title: expectedDetails.title,
                percentage: expectedDetails.percentage,
                description: expectedDetails.description,
                site: expectedDetails.site
            });
        });

        test('should return an error if answers are incomplete', async () => {
            // mock request with incomplete quiz
            const req = {
                body: {
                    answers: { 1: 'I', 2: 'S' }
                }
            };
            const res = { json: jest.fn() };
            const next = jest.fn();

            await calculateResult(req, res, next);

            // verify badrequesterror
            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });

    });
});