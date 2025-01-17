'use strict';

/** starting up server for pairsona */

const { PORT } = process.env;
const app = require('./app');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
