'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { authenticateJWT } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');

const { NotFoundError } = require('./config/expressError');

const app = express();

// cors setup
app.use(cors({
    origin: ['http://localhost:5173', 'https://pairsona-frontend.onrender.com'], // Allowed origins
    credentials: true // allow cookies + auth headers
}));

// middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authenticateJWT);

// serve static files from build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));
console.log('Static files path:', path.join(__dirname, '../frontend/dist'));


// root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Pairsona backend!' });
});

// routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/quiz', quizRoutes);
app.use('/connections', connectionRoutes);
app.use('/messages', messageRoutes);

// catch all handler for all other routes (for client side navigating)
app.get('*', (req, res) => {
    console.log("Serving React app for route:", req.url);
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
})

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