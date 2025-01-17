'use strict';

/** starting up server for pairsona */

const { PORT } = require('./config/config');
const app = require('./app');

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});