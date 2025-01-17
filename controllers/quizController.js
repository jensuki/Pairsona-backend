'use strict';

const questions = require('../data/questions.json');
const mbtiDetails = require('../data/mbti_details.json');
const User = require('../models/User');
const { BadRequestError } = require('../config/expressError');

// get all questions
const getQuestions = (req, res) => {
    res.json(questions); // send the list of questions to front end
};

const calculateResult = async (req, res, next) => {
    try {
        const { answers } = req.body;

        // validate answers for all 30 questions
        if (!answers || Object.keys(answers).length !== 30) {
            throw new BadRequestError('Incomplete answers submitted');
        }

        const score = {
            I: 0,
            E: 0,
            S: 0,
            N: 0,
            T: 0,
            F: 0,
            J: 0,
            P: 0
        };

        // increment correct letter value to score
        Object.values(answers).forEach((value) => {
            if (value === 'I') score.I++;
            if (value === 'E') score.E++;
            if (value === 'S') score.S++;
            if (value === 'N') score.N++;
            if (value === 'T') score.T++;
            if (value === 'F') score.F++;
            if (value === 'J') score.J++;
            if (value === 'P') score.P++;
        });

        const result = [
            score.I > score.E ? 'I' : 'E',
            score.S > score.N ? 'S' : 'N',
            score.T > score.F ? 'T' : 'F',
            score.J > score.P ? 'J' : 'P'
        ].join('')

        // retrieve mtbi details
        const details = mbtiDetails[result] || {
            title: 'Unknown',
            percentage: 'N/A',
            description: 'No additional information available for this personalty type',
            site: 'N/A'
        };

        // get logged in user from JWT
        const username = req.res.locals.user.username;

        // save mbti reult to users profile
        await User.update(username, { mbti: result });

        // respond with their mbti results details
        return res.json({
            type: result,
            title: details.title,
            percentage: details.percentage,
            description: details.description,
            site: details.site
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = { getQuestions, calculateResult };