const { PORT } = require('./config/config');
const app = require('./app');

// debug
console.log("Environment PORT value:", process.env.PORT);  // check if Render provides PORT
console.log("Resolved PORT from config:", PORT);           // verify PORT from config.js
console.log("About to start the server...");
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
console.log("Server started successfully.");