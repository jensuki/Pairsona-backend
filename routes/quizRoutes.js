'use strict';

const express = require('express');
const { getQuestions, calculateResult } = require('../controllers/quizController');
const { ensureLoggedIn } = require('../middleware/auth');

const router = express.Router();

/** GET /questions
 *
 * fetch all quiz questions
 *
 * authorization required: logged in
*/

router.get('/questions', ensureLoggedIn, getQuestions);

/** POST /results
 *
 * returns: { type, title, percentage, description, site}
 *
 * calculate and save MBTI result for logged in user
 *
 * authorization required: logged in
*/

router.post('/results', ensureLoggedIn, calculateResult);

module.exports = router;

