const { PORT } = require('./config/config');
const app = require('./app');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
console.log("Server started successfully.");