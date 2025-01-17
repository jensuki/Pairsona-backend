'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

const { authenticateJWT } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');

const { NotFoundError } = require('./config/expressError');

const app = express();

// middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('tiny'));
app.use(authenticateJWT);

// routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/quiz', quizRoutes);
app.use('/connections', connectionRoutes);
app.use('/messages', messageRoutes);


// 404 Handler
app.use((req, res, next) => {
    return next(new NotFoundError());
});

// general error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message;

    return res.status(status).json({
        error: { message, status }
    });
});

module.exports = app;